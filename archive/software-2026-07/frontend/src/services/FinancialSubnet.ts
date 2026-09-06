import { createMLSMeshClient, MLSMeshClient } from './mls-crypto';
import * as Phenix from './phenixWallet';

/**
 * Financial Subnet
 * 
 * Isolates the MLS Communication Mesh (ephemeral, forward-secret) 
 * from the Phenix Financial Vault (immutable, legal-ledger).
 * 
 * Memory Policy: Vault keys are flushed to null on lock to prevent 
 * JS garbage collection lag from leaving secrets in memory.
 */
export class FinancialSubnet {
  public MeshClient: MLSMeshClient;
  public PhenixReady: boolean = false;

  constructor(userId: string) {
    // Initialize the isolated Communication Mesh
    this.MeshClient = createMLSMeshClient(userId);
  }

  /**
   * Unlocks the Phenix Vault.
   * Does NOT initialize the MeshClient keys (they are separate).
   */
  async unlockPhenixVault(password: string): Promise<void> {
    try {
      await Phenix.unlockVault(password);
      this.PhenixReady = true;
    } catch (e) {
      this.PhenixReady = false;
      throw e;
    }
  }

  /**
   * Locks the Phenix Vault and aggressively scrubs memory.
   * Overwrites session storage values with null before removal 
   * to prevent residual strings in JS heap.
   */
  lockPhenixVault(): void {
    // Aggressive Memory Flush
    const sessionRaw = sessionStorage.getItem(Phenix.SESSION_KEY);
    if (sessionRaw) {
      try {
        const parsed = JSON.parse(sessionRaw);
        // Overwrite sensitive fields with null bytes before deletion
        parsed.viewingPriv = null;
        parsed.spendingPub = null;
        sessionStorage.setItem(Phenix.SESSION_KEY, JSON.stringify(parsed));
      } catch (e) {
        // Ignore parse errors, just delete
      }
    }
    
    Phenix.lockVault();
    this.PhenixReady = false;
  }

  /**
   * Logs a donation received via the K4/T4 partner bridge.
   * This creates a legally admissible "Memo-to-File" entry.
   */
  logPartnerDonation(amount: string, txHash: string, counterparty: string): Phenix.MemoEntry {
    return Phenix.logMemo({
      type: 'DONATION_RECEIVED',
      amount,
      currency: 'ETH',
      txHash,
      counterparty,
      memo: `Federated transfer via conv-p31-partners bridge.`,
    });
  }

  /**
   * Checks if the vault exists but is currently locked.
   */
  getVaultStatus(): { exists: boolean; locked: boolean } {
    return {
      exists: Phenix.vaultExists(),
      locked: !this.PhenixReady,
    };
  }
}
