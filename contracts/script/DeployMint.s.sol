// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/LOVESBT.sol";
import "../src/ProofOfCare.sol";
import "../src/LOVEToken.sol";

/// @notice Deploy LOVESBT + ProofOfCare to Base Sepolia (84532) and wire oracle/relay.
/// loveToken is address(0) — LOVESBT-only scope (LOVEToken retired).
contract DeployMint is Script {
    function run() external {
        uint256 deployerPk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPk);
        address relay = vm.envOr("RELAY_ADDRESS", deployer);

        vm.startBroadcast(deployerPk);

        // 1. LOVESBT (architect = deployer, initialOracle = address(0))
        LOVESBT loveSBT = new LOVESBT(deployer, address(0));
        console.log("LOVESBT deployed at:", address(loveSBT));

        // 2. ProofOfCare (architect = deployer, loveToken = 0x0, loveSBT = loveSBT)
        ProofOfCare proof = new ProofOfCare(deployer, address(0), address(loveSBT));
        console.log("ProofOfCare deployed at:", address(proof));

        // 3. CRITICAL: make ProofOfCare the oracle so it can mint SBTs
        loveSBT.setOracle(address(proof));
        console.log("LOVESBT oracle -> ProofOfCare");

        // 4. CRITICAL: authorise the bridge/relay signer
        proof.setRelay(relay);
        console.log("ProofOfCare relay ->", relay);

        vm.stopBroadcast();

        console.log("");
        console.log("==========================================================");
        console.log("Mint Contracts Deployed on Base Sepolia (84532)");
        console.log("==========================================================");
        console.log("LOVESBT:     ", address(loveSBT));
        console.log("ProofOfCare: ", address(proof));
        console.log("Oracle:      ProofOfCare (set)");
        console.log("Relay:       ", relay);
        console.log("==========================================================");
    }
}
