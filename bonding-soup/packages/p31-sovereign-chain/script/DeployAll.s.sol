// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/LOVEToken.sol";
import "../src/LOVESBT.sol";
import "../src/ProofOfCare.sol";
import "../src/GenesisSpark.sol";

contract DeployAll is Script {
    function run() external returns (LOVEToken, LOVESBT, ProofOfCare, GenesisSpark) {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        address deployer = msg.sender;
        address sovereignPool = vm.envAddress("SOVEREIGNTY_POOL");
        address performancePool = vm.envAddress("PERFORMANCE_POOL");

        LOVEToken love = new LOVEToken(deployer, sovereignPool, performancePool);
        LOVESBT sbt = new LOVESBT(deployer);
        ProofOfCare poc = new ProofOfCare(address(love), deployer, address(sbt));
        GenesisSpark spark = new GenesisSpark();

        love.setCareOracle(address(poc));

        vm.stopBroadcast();

        return (love, sbt, poc, spark);
    }
}
