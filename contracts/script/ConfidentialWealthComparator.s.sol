// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {ConfidentialWealthComparator} from "../src/ConfidentialWealthComparator.sol";
import {console2} from "forge-std/console2.sol";

contract DeployConfidentialWealthComparator is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        vm.startBroadcast(deployerPrivateKey);

        address[] memory allowedUsers = new address[](1);
        allowedUsers[0] = deployer;

        ConfidentialWealthComparator wealthComparator = new ConfidentialWealthComparator(allowedUsers);

        console2.log("WealthComparator deployed at:", address(wealthComparator));

        vm.stopBroadcast();
    }
}
