# Codebase Health Check Report

*Generated at: 7/3/2026, 7:53:12 AM*

## 🔵 Commented-out References (6)

These orphan files are still referenced in commented-out code. Both the file and the comment should be removed.

### `src/lib/contracts/types.ts` → `<Types />`
Referenced in:
- `src/lib/governance/types.ts:2` → `* Constitutional DAO — Sovereign Governance Types`

### `worker-ai-proxy/src/index.ts` → `<Index />`
Referenced in:
- `src/lib/keyVault.ts:2` → `* Sovereign Key Vault — IndexedDB Storage for Non-Extractable CryptoKeys`

### `src/workers/contract-engine/index.ts` → `<Index />`
Referenced in:
- `src/lib/keyVault.ts:2` → `* Sovereign Key Vault — IndexedDB Storage for Non-Extractable CryptoKeys`

### `src/workers/governance-engine/index.ts` → `<Index />`
Referenced in:
- `src/lib/keyVault.ts:2` → `* Sovereign Key Vault — IndexedDB Storage for Non-Extractable CryptoKeys`

### `src/workers/love-ledger/index.ts` → `<Index />`
Referenced in:
- `src/lib/keyVault.ts:2` → `* Sovereign Key Vault — IndexedDB Storage for Non-Extractable CryptoKeys`

### `src/workers/backup-export/index.ts` → `<Index />`
Referenced in:
- `src/lib/keyVault.ts:2` → `* Sovereign Key Vault — IndexedDB Storage for Non-Extractable CryptoKeys`


---

## 🟡 Orphan Files (63)

These files are not imported by any other file in the project.

- `astro.config.ts`
- `vitest.config.ts`
- `public/sw-hearth.js`
- `public/audio/phos-processor.js`
- `src/__tests__/health.test.ts`
- `src/__tests__/setup.ts`
- `src/__tests__/version.test.ts`
- `src/components/OnboardingSuite.tsx`
- `src/components/PHOSWorkspace.tsx`
- `src/components/QuantumField.tsx`
- `src/lib/cosineWorker.ts`
- `src/lib/idempotency.ts`
- `src/lib/pushNotifications.ts`
- `src/store/accessibility.ts`
- `src/hooks/EmbeddingWorker.ts`
- `src/hooks/useVoiceInput.ts`
- `src/surfaces/AbdicationRitual.tsx`
- `src/types/three-fiber.d.ts`
- `src/workers/embedding.worker.ts`
- `tests/e2e/cognitive-load-audit.e2e.ts`
- `tests/e2e/crisis-recovery.e2e.ts`
- `src/lib/__tests__/ChaosVault.test.ts`
- `src/lib/__tests__/Embedder.test.ts`
- `src/lib/__tests__/EventLogger.test.ts`
- `src/lib/__tests__/IntentEngine.test.ts`
- `src/lib/__tests__/KarmaEngine.test.ts`
- `src/lib/__tests__/atmosphere.test.ts`
- `src/lib/__tests__/sound.test.ts`
- `src/components/__tests__/BiologicalTheme.test.ts`
- `src/components/__tests__/DemoController.integration.test.tsx`
- `src/components/__tests__/DemoController.test.ts`
- `src/components/__tests__/EscapeHatch.test.tsx`
- `src/components/__tests__/GrantNarrativeOverlay.test.tsx`
- `src/components/__tests__/PHOSOrb.test.tsx`
- `src/components/__tests__/PHOSShell.test.tsx`
- `src/components/__tests__/SkeletonLoader.test.tsx`
- `src/components/__tests__/SpoonTransitions.test.tsx`
- `src/components/__tests__/SurfaceContent.test.tsx`
- `src/components/__tests__/SurfaceErrorBoundary.test.tsx`
- `src/components/__tests__/TheGuardian.test.tsx`
- `src/surfaces/__tests__/ArcadeSurface.test.tsx`
- `src/surfaces/__tests__/ChaosIngest.test.tsx`
- `src/surfaces/__tests__/CompassSurface.test.tsx`
- `src/surfaces/__tests__/ConnectionGridSurface.test.tsx`
- `src/surfaces/__tests__/GreetingSurface.test.tsx`
- `src/surfaces/__tests__/HearthSurface.test.tsx`
- `src/surfaces/__tests__/IgnitionSurface.test.tsx`
- `src/surfaces/__tests__/LedgerSurface.test.tsx`
- `src/surfaces/__tests__/NodeZeroSurface.test.tsx`
- `src/surfaces/__tests__/OpenLedgerSurface.test.tsx`
- `src/surfaces/__tests__/RetroVaultSurface.test.tsx`
- `src/surfaces/__tests__/SettingsSurface.test.tsx`
- `src/surfaces/__tests__/ShakeStream.test.tsx`
- `src/surfaces/__tests__/WarehouseSurface.test.tsx`
- `src/lib/edge/__tests__/verify.test.ts`
- `src/components/ambient/__tests__/AtomOrbitals.test.tsx`
- `src/components/ambient/__tests__/DustMotes.test.tsx`
- `src/components/ambient/__tests__/EmberParticles.test.tsx`
- `src/components/ambient/__tests__/GlitchEffect.test.tsx`
- `src/components/ambient/__tests__/HexRain.test.tsx`
- `src/components/ambient/__tests__/PixelGrid.test.tsx`
- `src/components/ambient/__tests__/VagusBreath.test.tsx`
- `src/components/ambient/__tests__/VaultScanlines.test.tsx`

---

## 🔴 Unused Imports (33 in 24 files)

### `src/__tests__/setup.ts`
```json
[
  "describe",
  "it"
]
```

### `src/components/OnboardingSuite.tsx`
```json
[
  "Battery",
  "BatteryMedium",
  "BatteryFull"
]
```

### `src/components/PWAInstallPrompt.tsx`
```json
[
  "PWAInstallProps"
]
```

### `src/components/TerminalStatusBar.tsx`
```json
[
  "Wifi"
]
```

### `src/hooks/useSovereignBrain.ts`
```json
[
  "useSyncExternalStore",
  "BrainStatus"
]
```

### `src/surfaces/AbdicationRitual.tsx`
```json
[
  "generateAndStoreIdentity",
  "loadPrivateKey"
]
```

### `src/surfaces/ArcadeSurface.tsx`
```json
[
  "useAtmosphere"
]
```

### `src/surfaces/GovernanceSurface.tsx`
```json
[
  "isValidDID",
  "signMessage",
  "activateProposal",
  "fetchTally"
]
```

### `src/surfaces/PassportSurface.tsx`
```json
[
  "signMessage"
]
```

### `src/surfaces/PassportWizard.tsx`
```json
[
  "loadPrivateKey"
]
```

### `src/components/__tests__/PHOSOrb.test.tsx`
```json
[
  "screen"
]
```

### `src/components/__tests__/SurfaceContent.test.tsx`
```json
[
  "waitFor"
]
```

### `src/lib/__tests__/sound.test.ts`
```json
[
  "vi"
]
```

### `src/store/identity.ts`
```json
[
  "Keypair"
]
```

### `src/surfaces/__tests__/ChaosIngest.test.tsx`
```json
[
  "fireEvent"
]
```

### `src/surfaces/__tests__/CompassSurface.test.tsx`
```json
[
  "vi"
]
```

### `src/surfaces/__tests__/HearthSurface.test.tsx`
```json
[
  "beforeEach"
]
```

### `src/surfaces/__tests__/IgnitionSurface.test.tsx`
```json
[
  "fireEvent"
]
```

### `src/surfaces/__tests__/LedgerSurface.test.tsx`
```json
[
  "act"
]
```

### `src/surfaces/__tests__/NodeZeroSurface.test.tsx`
```json
[
  "vi"
]
```

### `src/surfaces/__tests__/SettingsSurface.test.tsx`
```json
[
  "vi"
]
```

### `src/components/ambient/__tests__/AtomOrbitals.test.tsx`
```json
[
  "vi",
  "screen"
]
```

### `src/lib/api/governance.ts`
```json
[
  "Delegate"
]
```

### `src/lib/edge/__tests__/verify.test.ts`
```json
[
  "verifyEd25519Signature"
]
```


---

## 🟠 Unused Exports (93 in 37 files)

> [!WARNING]
> This check uses a heuristic approach. If an exported name is found anywhere else in the codebase, it is considered "used".

### `src/components/OnboardingSuite.tsx`
```json
[
  "OnboardingSuite"
]
```

### `src/components/QuantumField.tsx`
```json
[
  "QuantumField"
]
```

### `src/config/endpoints.ts`
```json
[
  "setEndpointOverride"
]
```

### `src/config/surfaces.ts`
```json
[
  "SurfaceNavItem"
]
```

### `src/context/DeviceContext.tsx`
```json
[
  "DeviceLevel"
]
```

### `src/hooks/EmbeddingWorker.ts`
```json
[
  "WorkerRequest",
  "WorkerResponse"
]
```

### `src/hooks/useQuantumBrainDump.ts`
```json
[
  "ResearchStatus",
  "ResearchPlan",
  "ResearchProgress",
  "ResearchReport"
]
```

### `src/hooks/useVoiceInput.ts`
```json
[
  "useVoiceInput"
]
```

### `src/lib/IntentEngine.ts`
```json
[
  "IntentRule",
  "INTENT_RULES"
]
```

### `src/lib/K4Bridge.ts`
```json
[
  "K4Entry",
  "K4Graph"
]
```

### `src/lib/KarmaEngine.ts`
```json
[
  "mintCreditsAtomic"
]
```

### `src/lib/barterEngine.ts`
```json
[
  "BarterOffer",
  "BarterEngine"
]
```

### `src/lib/confidence.ts`
```json
[
  "ConfidenceSignals"
]
```

### `src/lib/crypto.ts`
```json
[
  "SignedMessage",
  "verifySignature",
  "createSignedPayload",
  "verifySignedPayload"
]
```

### `src/lib/did-auth.ts`
```json
[
  "hexToBytes",
  "bytesToHex"
]
```

### `src/lib/idempotency.ts`
```json
[
  "IdempotentResult",
  "IdempotencyCache"
]
```

### `src/lib/keyVault.ts`
```json
[
  "clearVault"
]
```

### `src/lib/llm.ts`
```json
[
  "AITier",
  "RoutingDecision",
  "HybridLLMEngine"
]
```

### `src/lib/offlineQueue.ts`
```json
[
  "QueuedAction",
  "registerActionHandler",
  "unregisterActionHandler",
  "enqueueAction",
  "getPendingActions",
  "updateActionStatus",
  "removeAction",
  "clearQueue"
]
```

### `src/lib/pushNotifications.ts`
```json
[
  "isPushSupported",
  "getPermissionStatus",
  "getVapidPublicKey",
  "subscribeToPush",
  "unsubscribeFromPush",
  "getStoredSubscription",
  "hasAskedForPermission"
]
```

### `src/lib/semanticSearch.ts`
```json
[
  "SemanticSearchEngine"
]
```

### `src/lib/trustGraph.ts`
```json
[
  "TrustEdge",
  "TrustNode",
  "TrustGraph"
]
```

### `src/lib/useSanctuaryWS.ts`
```json
[
  "ConnectionStatus"
]
```

### `src/lib/whisper.ts`
```json
[
  "WhisperState",
  "WhisperEngine"
]
```

### `src/store/accessibility.ts`
```json
[
  "AccessibilityState",
  "accessibilityStore"
]
```

### `src/store/identity.ts`
```json
[
  "ensurePrivateKey",
  "hasPrivateKey",
  "getIdentityState",
  "isSovereign"
]
```

### `src/surfaces/AbdicationRitual.tsx`
```json
[
  "AbdicationRitual"
]
```

### `src/types/three-fiber.d.ts`
```json
[
  "ThreeElements",
  "Vector3",
  "Group",
  "Object3D",
  "Scene",
  "Float32BufferAttribute",
  "MeshStandardMaterial",
  "PointsMaterial"
]
```

### `src/lib/api/contracts.ts`
```json
[
  "ContractCreateInput",
  "fetchContract",
  "signContract",
  "activateContract",
  "fulfillContract",
  "dissolveContract"
]
```

### `src/lib/api/governance.ts`
```json
[
  "GovernanceApiProposal",
  "TallyResult"
]
```

### `src/lib/api/ledger.ts`
```json
[
  "transferLove",
  "stakeLove"
]
```

### `src/lib/contracts/types.ts`
```json
[
  "ContractStatus",
  "ContractType",
  "ContractParty",
  "ContractTerm",
  "ROCCAStake",
  "ROCCAMilestone",
  "SovereignContract"
]
```

### `src/lib/edge/logging.ts`
```json
[
  "LogEvent"
]
```

### `src/lib/governance/types.ts`
```json
[
  "ProposalStatus",
  "ConstitutionalAction",
  "GovernanceState"
]
```

### `src/workers/contract-engine/index.ts`
```json
[
  "ContractEngine"
]
```

### `src/workers/governance-engine/index.ts`
```json
[
  "GovernanceEngine"
]
```

### `src/workers/love-ledger/index.ts`
```json
[
  "LoveTransactionDO"
]
```


---

## 🟢 Unused i18n Keys

- Total Keys Analyzed: 0
- Safe to Delete: 0
- Potentially Dynamic: 0

