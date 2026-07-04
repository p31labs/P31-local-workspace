// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/CognitivePassport.sol";

contract DeployPassport is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        string memory baseURI = vm.envString("PASSPORT_BASE_URI");

        vm.startBroadcast(deployerKey);
        CognitivePassport passport = new CognitivePassport(baseURI);
        vm.stopBroadcast();

        console.log("CognitivePassport deployed at:", address(passport));
        console.log("Base URI set to:", baseURI);
    }
}
