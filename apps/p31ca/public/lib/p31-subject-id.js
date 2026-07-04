/**
 * p31.subjectIdDerivation/0.1.0
 * Single source for `u_*` (passkey) and `guest_*` subject ids — CWP-32 D-IB4.
 * Used by planetary-onboard; future initial-build flow must import this (no copy-paste).
 */
(function (g) {
  "use strict";

  var SCHEMA = "p31.subjectIdDerivation/0.1.0";
  /** First 32 hex chars of SHA-256(rawId) after `u_` — matches legacy onboard. */
  var U_PREFIX_HEX = 32;
  var GUEST_BODY_LEN = 20;

  g.P31_SUBJECT_ID_DERIVATION = {
    schema: SCHEMA,
    uHexLength: U_PREFIX_HEX,
    guestIdLength: GUEST_BODY_LEN,
  };

  /**
   * @param {ArrayBuffer|ArrayBufferView} rawId
   * @returns {Promise<string>}
   */
  g.p31DigestRawCredentialIdToUSubjectId = async function (rawId) {
    if (rawId == null) throw new Error("p31: rawId required");
    var input = rawId instanceof ArrayBuffer ? rawId : new Uint8Array(rawId);
    var hash = await crypto.subtle.digest("SHA-256", input);
    return (
      "u_" +
      []
        .concat(Array.from(new Uint8Array(hash)))
        .map(function (x) {
          return x.toString(16).padStart(2, "0");
        })
        .join("")
        .slice(0, U_PREFIX_HEX)
    );
  };

  g.p31CreateGuestSubjectId = function () {
    return "guest_" + crypto.randomUUID().replace(/-/g, "").slice(0, GUEST_BODY_LEN);
  };

  /**
   * @param {{ rawId: ArrayBuffer }|null|undefined} credOrNull
   * @returns {Promise<string>}
   */
  g.p31DeriveSubjectId = async function (credOrNull) {
    if (credOrNull && credOrNull.rawId) {
      return g.p31DigestRawCredentialIdToUSubjectId(credOrNull.rawId);
    }
    return g.p31CreateGuestSubjectId();
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
