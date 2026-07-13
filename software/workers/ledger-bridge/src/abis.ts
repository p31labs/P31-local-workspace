// Minimal ABIs for the two on-chain contracts this bridge calls.
// Source of truth: bonding-soup/packages/p31-sovereign-chain/src/{P31TransparencyAnchor,ProofOfCare}.sol

export const P31TransparencyAnchorAbi = [
  {
    type: "function",
    name: "anchor",
    stateMutability: "nonpayable",
    inputs: [
      { name: "digest", type: "bytes32" },
      { name: "uri", type: "string" },
    ],
    outputs: [{ name: "id", type: "uint256" }],
  },
  {
    type: "function",
    name: "getAnchor",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "digest", type: "bytes32" },
          { name: "uri", type: "string" },
          { name: "sender", type: "address" },
          { name: "blockNumber", type: "uint64" },
          { name: "timestamp", type: "uint64" },
        ],
      },
    ],
  },
] as const;

export const ProofOfCareAbi = [
  {
    type: "function",
    name: "submitCareProofs",
    stateMutability: "nonpayable",
    inputs: [
      { name: "users", type: "address[]" },
      { name: "tProx", type: "uint256[]" },
      { name: "qRes", type: "uint256[]" },
      { name: "tasks", type: "uint256[]" },
      { name: "entropyRoots", type: "bytes32[]" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "setRelay",
    stateMutability: "nonpayable",
    inputs: [{ name: "_relay", type: "address" }],
    outputs: [],
  },
] as const;
