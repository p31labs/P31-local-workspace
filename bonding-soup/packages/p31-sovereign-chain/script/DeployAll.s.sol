// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/LOVESBT.sol";
import "../src/ProofOfCare.sol";
import "../src/GenesisSpark.sol";
// LOVEToken.sol has been archived — no on-chain LOVE ERC20.

contract DeployAll is Script {
    function run() external returns (LOVESBT, ProofOfCare, GenesisSpark) {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        address deployer = msg.sender;

        LOVESBT sbt = new LOVESBT(deployer);
        ProofOfCare poc = new ProofOfCare(deployer, address(sbt));
        GenesisSpark spark = new GenesisSpark();

        // Critical: without this, ProofOfCare can never mint LOVESBT.
        sbt.authorizeMinter(address(poc));

        console.log("LOVESBT: %s", address(sbt));
        console.log("ProofOfCare: %s", address(poc));
        console.log("GenesisSpark: %s", address(spark));

        vm.stopBroadcast();

        return (sbt, poc, spark);
    }
}
