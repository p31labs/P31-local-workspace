// CWP-2026-027 B — Node e2e test for src/sdjwt.ts (RFC 9901 / VC-17).
// Imported directly via Node 24 type-stripping to exercise the real module.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  issueSDJWT,
  verifySDJWT,
  selectDisclosures,
  getIssuer,
} from "../src/sdjwt.ts";

test("SD-JWT issues with typ: dc+sd-jwt and verifies all claims", async () => {
  const cred = await issueSDJWT({
    careScore: 85,
    careEvents: 12,
    family: "Smith",
  });
  assert.match(cred.sdjwt, /\./, "compact SD-JWT has header.payload.sig");
  assert.ok(cred.issuerPubB64.length > 0, "issuer pub returned");

  const issuer = await getIssuer();
  const res = await verifySDJWT(cred.sdjwt, issuer.pub);
  assert.equal(res.valid, true, "valid SD-JWT must verify");
  assert.equal(res.disclosed.careScore, 85);
  assert.equal(res.disclosed.careEvents, 12);
  assert.equal(res.disclosed.family, "Smith");
});

test("selective disclosure reveals only chosen claims", async () => {
  const cred = await issueSDJWT({ careScore: 85, careEvents: 12, family: "Smith" });
  const selective = await selectDisclosures(cred.sdjwt, ["careScore", "family"]);
  const issuer = await getIssuer();
  const res = await verifySDJWT(selective, issuer.pub);
  assert.equal(res.valid, true);
  assert.equal(res.disclosed.careScore, 85);
  assert.equal(res.disclosed.family, "Smith");
  assert.equal(res.disclosed.careEvents, undefined, "unrevealed claim stays hidden");
});

test("tampered SD-JWT fails verification", async () => {
  const cred = await issueSDJWT({ careScore: 85 });
  const tampered = cred.sdjwt.slice(0, -4) + "AAAA";
  const issuer = await getIssuer();
  const res = await verifySDJWT(tampered, issuer.pub);
  assert.equal(res.valid, false, "tampered SD-JWT must fail");
});
