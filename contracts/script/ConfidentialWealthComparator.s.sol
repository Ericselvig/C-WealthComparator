// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {ConfidentialWealthComparator} from "../src/ConfidentialWealthComparator.sol";
import {console2} from "forge-std/console2.sol";

contract DeployConfidentialWealthComparator is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        ConfidentialWealthComparator wealthComparator = new ConfidentialWealthComparator();

        console2.log("WealthComparator deployed at:", address(wealthComparator));

        vm.stopBroadcast();
    }
}
