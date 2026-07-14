import { describe, it, expect } from "vitest";
import {
  needsRotation,
  computeKeyStatus,
  createLifecycleFields,
  type PQCLifecycleEntry,
} from "../pqcLifecycle";

describe("PQC Key Lifecycle (CWP-2026-029 P5)", () => {
  const DAY_MS = 1000 * 60 * 60 * 24;

  describe("computeKeyStatus", () => {
    it("returns 'active' for a freshly created key", () => {
      const entry = createLifecycleFields();
      expect(computeKeyStatus(entry)).toBe("active");
    });

    it("returns 'expiring' when within 30 days of expiry", () => {
      const now = Date.now();
      const entry: Partial<PQCLifecycleEntry> = {
        mldsa65_expires_at: now + 15 * DAY_MS, // 15 days left
      };
      expect(computeKeyStatus(entry)).toBe("expiring");
    });

    it("returns 'expired' when past expiry", () => {
      const entry: Partial<PQCLifecycleEntry> = {
        mldsa65_expires_at: Date.now() - 1 * DAY_MS, // expired 1 day ago
      };
      expect(computeKeyStatus(entry)).toBe("expired");
    });

    it("returns 'revoked' when explicitly revoked", () => {
      const entry: Partial<PQCLifecycleEntry> = {
        mldsa65_status: "revoked",
        mldsa65_expires_at: Date.now() + 365 * DAY_MS,
      };
      expect(computeKeyStatus(entry)).toBe("revoked");
    });

    it("returns 'active' when no expiry set", () => {
      const entry: Partial<PQCLifecycleEntry> = {};
      expect(computeKeyStatus(entry)).toBe("active");
    });
  });

  describe("needsRotation", () => {
    it("returns false for a fresh key", () => {
      const entry = createLifecycleFields() as PQCLifecycleEntry;
      expect(needsRotation(entry)).toBe(false);
    });

    it("returns true when within 30 days of expiry", () => {
      const entry: PQCLifecycleEntry = {
        did: "did:key:zTest",
        mldsa65_pub: "test",
        mldsa65_issued_at: Date.now() - 350 * DAY_MS,
        mldsa65_expires_at: Date.now() + 10 * DAY_MS,
        mldsa65_status: "active",
      };
      expect(needsRotation(entry)).toBe(true);
    });

    it("returns false when no expiry set", () => {
      const entry: PQCLifecycleEntry = {
        did: "did:key:zTest",
        mldsa65_pub: "test",
        mldsa65_issued_at: Date.now(),
        mldsa65_expires_at: 0,
        mldsa65_status: "active",
      };
      expect(needsRotation(entry)).toBe(false);
    });
  });

  describe("createLifecycleFields", () => {
    it("sets issued_at and expires_at with 365 day gap", () => {
      const now = Date.now();
      const fields = createLifecycleFields(now);
      expect(fields.mldsa65_issued_at).toBe(now);
      expect(fields.mldsa65_expires_at).toBe(now + 365 * DAY_MS);
      expect(fields.mldsa65_status).toBe("active");
    });
  });
});
