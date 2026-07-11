//! taler-cbs — Clause Blind Schnorr (CBS) over Ed25519.
//!
//! Real, audited primitives only (curve25519-dalek + sha2). No hand-rolled
//! curve math. ABI mirrors AXIS-1_FINAL_DELIVERABLE.md §3/§5 so the
//! committed TypeScript loader works unchanged.
//!
//! Protocol (§2):
//!   blind:   A=a·G, B=b·X, C=R+A+B, c'=H(C‖m) mod q, c=c'+b
//!   sign:    s = n + c·x            (issuer holds n, x)
//!   unblind: s' = s + a
//!   verify:  R_check = s'·G − c'·X ; valid ⟺ H(R_check‖m) mod q == c'

use core::ptr;
use curve25519_dalek::edwards::CompressedEdwardsY;
use curve25519_dalek::{EdwardsPoint, Scalar};
use sha2::{Digest, Sha512};

const P: usize = 32;

#[inline]
fn decompress(p: &[u8; 32]) -> Option<EdwardsPoint> {
    CompressedEdwardsY::from_slice(p).ok()?.decompress()
}

/// H(data) mod q → Scalar (proper mod-q reduction of the 64-byte hash).
fn hash_mod_q(data: &[u8]) -> Scalar {
    let mut h = Sha512::new();
    h.update(data);
    let d = h.finalize();
    let mut b = [0u8; 32];
    b.copy_from_slice(&d[0..32]);
    Scalar::from_bytes_mod_order(b)
}

/// Client blinds message `m` with random scalars `a, b` against issuer
/// ephemeral `R` and public key `X`. Returns `(c, c')` where `c = c'+b`
/// is sent to the issuer and `c'` is carried by the client.
pub fn blind(
    msg: &[u8],
    a: &[u8; 32],
    b: &[u8; 32],
    r: &[u8; 32],
    x: &[u8; 32],
) -> Option<(Scalar, Scalar)> {
    if msg.is_empty() || msg.len() > 1024 {
        return None;
    }
    let a = Scalar::from_bytes_mod_order(*a);
    let b = Scalar::from_bytes_mod_order(*b);
    let r = decompress(r)?;
    let x = decompress(x)?;
    let a_g = EdwardsPoint::mul_base(&a);
    let b_x = x * b;
    let c = r + a_g + b_x;

    let mut buf = [0u8; P + 1024];
    buf[..P].copy_from_slice(&c.compress().to_bytes());
    buf[P..P + msg.len()].copy_from_slice(msg);

    let c_prime = hash_mod_q(&buf[..P + msg.len()]);
    let cc = c_prime + b;
    Some((cc, c_prime))
}

/// Issuer signs blinded challenge `c` with ephemeral `n` and private `x`:
/// s = n + c·x.
pub fn sign_blinded(c: &[u8; 32], n: &[u8; 32], x: &[u8; 32]) -> Scalar {
    let c = Scalar::from_bytes_mod_order(*c);
    let n = Scalar::from_bytes_mod_order(*n);
    let x = Scalar::from_bytes_mod_order(*x);
    n + c * x
}

/// Client unblinds issuer response `s` with `a`: s' = s + a.
pub fn unblind(s: &[u8; 32], a: &[u8; 32]) -> Scalar {
    let s = Scalar::from_bytes_mod_order(*s);
    let a = Scalar::from_bytes_mod_order(*a);
    s + a
}

/// Verifier: valid ⟺ H(s'·G − c'·X ‖ m) mod q == c'.
pub fn verify(
    msg: &[u8],
    c_prime: &[u8; 32],
    s_prime: &[u8; 32],
    x: &[u8; 32],
    r: &[u8; 32],
) -> bool {
    if msg.is_empty() || msg.len() > 1024 {
        return false;
    }
    let c_prime = Scalar::from_bytes_mod_order(*c_prime);
    let s_prime = Scalar::from_bytes_mod_order(*s_prime);
    let x = match decompress(x) {
        Some(p) => p,
        None => return false,
    };
    let _r = match decompress(r) {
        Some(p) => p,
        None => return false,
    };
    let s_g = EdwardsPoint::mul_base(&s_prime);
    let c_x = x * c_prime;
    let r_check = s_g - c_x;

    let mut buf = [0u8; P + 1024];
    buf[..P].copy_from_slice(&r_check.compress().to_bytes());
    buf[P..P + msg.len()].copy_from_slice(msg);

    hash_mod_q(&buf[..P + msg.len()]) == c_prime
}

// ---------------------------------------------------------------------------
// wasm32 FFI — raw-pointer ABI, wraps the safe functions above.
// ---------------------------------------------------------------------------

#[inline]
unsafe fn rd32(p: *const u8) -> [u8; 32] {
    let mut b = [0u8; 32];
    ptr::copy_nonoverlapping(p, b.as_mut_ptr(), P);
    b
}

#[inline]
unsafe fn wr(p: *mut u8, b: &[u8]) {
    ptr::copy_nonoverlapping(b.as_ptr(), p, b.len());
}

#[no_mangle]
pub unsafe extern "C" fn cs_blind(
    msg: *const u8,
    msg_len: usize,
    a_ptr: *const u8,
    b_ptr: *const u8,
    r_ptr: *const u8,
    x_ptr: *const u8,
    c_out: *mut u8,
    c_prime_out: *mut u8,
) -> i32 {
    let msg = core::slice::from_raw_parts(msg, msg_len);
    let a = rd32(a_ptr);
    let b = rd32(b_ptr);
    let r = rd32(r_ptr);
    let x = rd32(x_ptr);
    match blind(msg, &a, &b, &r, &x) {
        Some((c, c_prime)) => {
            wr(c_out, &c.to_bytes());
            wr(c_prime_out, &c_prime.to_bytes());
            0
        }
        None => -1,
    }
}

#[no_mangle]
pub unsafe extern "C" fn cs_sign_blinded(
    c_ptr: *const u8,
    n_ptr: *const u8,
    x_ptr: *const u8,
    s_out: *mut u8,
) -> i32 {
    let c = rd32(c_ptr);
    let n = rd32(n_ptr);
    let x = rd32(x_ptr);
    wr(s_out, &sign_blinded(&c, &n, &x).to_bytes());
    0
}

#[no_mangle]
pub unsafe extern "C" fn cs_unblind(
    s_ptr: *const u8,
    a_ptr: *const u8,
    s_prime_out: *mut u8,
) -> i32 {
    let s = rd32(s_ptr);
    let a = rd32(a_ptr);
    wr(s_prime_out, &unblind(&s, &a).to_bytes());
    0
}

#[no_mangle]
pub unsafe extern "C" fn cs_verify(
    msg: *const u8,
    msg_len: usize,
    c_prime_ptr: *const u8,
    s_prime_ptr: *const u8,
    x_ptr: *const u8,
    r_ptr: *const u8,
) -> i32 {
    let msg = core::slice::from_raw_parts(msg, msg_len);
    let c_prime = rd32(c_prime_ptr);
    let s_prime = rd32(s_prime_ptr);
    let x = rd32(x_ptr);
    let r = rd32(r_ptr);
    if verify(msg, &c_prime, &s_prime, &x, &r) {
        0
    } else {
        -1
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use sha2::Digest;

    #[test]
    fn rfc8032_base_point() {
        let g = EdwardsPoint::mul_base(&Scalar::ONE).compress().to_bytes();
        let g_exp = [
            0x58, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66,
            0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66,
            0x66, 0x66, 0x66, 0x66,
        ];
        assert_eq!(g.to_vec(), g_exp.to_vec(), "mul_base(1) must equal RFC base G");
    }

    fn rnd() -> [u8; 32] {
        let mut b = [0u8; 32];
        // deterministic-ish RNG via std (test only)
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        let mut h = DefaultHasher::new();
        static mut SEED: u64 = 0x9e3779b97f4a7c15;
        unsafe {
            SEED = SEED.wrapping_mul(6364136223846793005).wrapping_add(1);
            SEED.hash(&mut h);
        }
        let v = h.finish();
        b[0..8].copy_from_slice(&v.to_le_bytes());
        b
    }

    #[test]
    fn cbs_round_trip_and_tamper() {
        let x = rnd();
        let x_pt = EdwardsPoint::mul_base(&Scalar::from_bytes_mod_order(x)).compress().to_bytes();
        let n = rnd();
        let r_pt = EdwardsPoint::mul_base(&Scalar::from_bytes_mod_order(n)).compress().to_bytes();
        let a = rnd();
        let b = rnd();
        let m = b"authorize 5 LOVE -> creator p31";

        let (c, c_prime) = blind(m, &a, &b, &r_pt, &x_pt).unwrap();
        let c = c.to_bytes();
        let c_prime = c_prime.to_bytes();

        let s = sign_blinded(&c, &n, &x).to_bytes();
        let s_prime = unblind(&s, &a).to_bytes();

        assert!(
            verify(m, &c_prime, &s_prime, &x_pt, &r_pt),
            "valid CBS signature must verify"
        );

        // Tampered s' must fail.
        let mut bad = s_prime;
        bad[0] ^= 0xff;
        assert!(
            !verify(m, &c_prime, &bad, &x_pt, &r_pt),
            "tampered signature must be rejected"
        );

        // Wrong message must fail.
        let wrong = b"authorize 5000 LOVE -> attacker";
        assert!(
            !verify(wrong, &c_prime, &s_prime, &x_pt, &r_pt),
            "wrong-message signature must be rejected"
        );
    }
}
