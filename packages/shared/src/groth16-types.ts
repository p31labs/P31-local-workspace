export interface SnarkJs {
  groth16: {
    fullProve(input: any, wasmFile: string, zkeyFile: string): Promise<{
      proof: any;
      publicSignals: string[];
    }>;
    verify(vk: any, publicSignals: string[], proof: any): Promise<boolean>;
    exportSolidityCallData(proof: any, publicSignals: string[]): Promise<string>;
  };
  zKey: {
    exportVerificationKey(zkeyFile: string): Promise<any>;
  };
}
