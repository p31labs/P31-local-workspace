// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/P31TransparencyAnchor.sol";
import "../src/P31ManifestRegistry.sol";
import "../src/P31AccessAllowlist.sol";
import "../src/P31ContentRoot.sol";
import "../src/P31TreasuryConfig.sol";

/// @notice Deploy all 5 SMART governance contracts and configure TreasuryConfig.
contract DeploySmart is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        vm.startBroadcast(deployerPrivateKey);

        console.log("Deployer:", deployer);
        console.log("");

        // 1. Deploy P31TransparencyAnchor (permissionless, no owner)
        P31TransparencyAnchor anchor = new P31TransparencyAnchor();
        console.log("P31TransparencyAnchor deployed at:", address(anchor));

        // 2. Deploy P31ManifestRegistry (permissionless, no owner)
        P31ManifestRegistry registry = new P31ManifestRegistry();
        console.log("P31ManifestRegistry deployed at:", address(registry));

        // 3. Deploy P31AccessAllowlist (owner = deployer)
        P31AccessAllowlist allowlist = new P31AccessAllowlist();
        console.log("P31AccessAllowlist deployed at:", address(allowlist));

        // 4. Deploy P31ContentRoot (owner = deployer)
        P31ContentRoot contentRoot = new P31ContentRoot();
        console.log("P31ContentRoot deployed at:", address(contentRoot));

        // 5. Deploy P31TreasuryConfig (owner = deployer)
        P31TreasuryConfig treasury = new P31TreasuryConfig();
        console.log("P31TreasuryConfig deployed at:", address(treasury));

        // ── Configure TreasuryConfig ────────────────────────────────────
        // Base Sepolia USDC: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
        // Adjust safe/usdc addresses for your multisig setup.
        address safeAddr = vm.envOr("P31_SAFE_ADDRESS", deployer);
        address usdcAddr = vm.envOr("P31_USDC_ADDRESS", address(0x036CbD53842c5426634e7929541eC2318f3dCF7e));
        uint256 chainId = vm.envOr("P31_CHAIN_ID", uint256(84532));

        treasury.configure(safeAddr, usdcAddr, chainId);
        console.log("TreasuryConfig configured:");
        console.log("  safe  =", safeAddr);
        console.log("  usdc  =", usdcAddr);
        console.log("  chain =", chainId);

        treasury.lock();
        console.log("TreasuryConfig locked");

        // ── Log Summary ─────────────────────────────────────────────────
        console.log("");
        console.log("===========================================================");
        console.log("SMART Governance Contracts Deployed");
        console.log("===========================================================");
        console.log("P31TransparencyAnchor:", address(anchor));
        console.log("P31ManifestRegistry:  ", address(registry));
        console.log("P31AccessAllowlist:   ", address(allowlist));
        console.log("P31ContentRoot:       ", address(contentRoot));
        console.log("P31TreasuryConfig:    ", address(treasury));
        console.log("===========================================================");

        vm.stopBroadcast();
    }
}
