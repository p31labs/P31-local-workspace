import { ethers } from 'ethers';

const CONTENT_ROOT_ADDRESS = '0xA38782025a6E2f77b7eC1f5682dFdeCD2EDCCa39';
const CONTENT_ROOT_ABI = [
  'function setContent(string memory key, string memory cid) external',
  'function getContent(string memory key) external view returns (string memory)',
  'function contentRoot(string memory key) external view returns (string memory)',
] as const;

export async function anchorCID(
  key: string,
  cid: string
): Promise<{ txHash: string; blockNumber: number }> {
  const rpcUrl = import.meta.env.VITE_RPC_URL || 'https://sepolia.base.org';
  const privateKey = import.meta.env.VITE_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error('VITE_PRIVATE_KEY not configured');
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(CONTENT_ROOT_ADDRESS, CONTENT_ROOT_ABI, wallet);

  const tx = await contract.setContent(key, cid);
  const receipt = await tx.wait();

  return {
    txHash: receipt?.hash || tx.hash,
    blockNumber: receipt?.blockNumber || 0,
  };
}

export async function getContentRoot(key: string): Promise<string | null> {
  const rpcUrl = import.meta.env.VITE_RPC_URL || 'https://sepolia.base.org';
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(CONTENT_ROOT_ADDRESS, CONTENT_ROOT_ABI, provider);

  try {
    const cid = await contract.contentRoot(key);
    return cid || null;
  } catch {
    return null;
  }
}
