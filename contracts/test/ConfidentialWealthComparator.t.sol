// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IncoTest} from "@inco/lightning/src/test/IncoTest.sol";
import {ConfidentialWealthComparator} from "../src/ConfidentialWealthComparator.sol";
import {inco, euint256, ebool, e} from "@inco/lightning/src/Lib.sol";

contract ConfidentialWealthComparatorTest is IncoTest {
    using e for euint256;
    using e for ebool;
    using e for uint256;
    using e for bytes;
    using e for address;

    ConfidentialWealthComparator comparator;

    function setUp() public override {
        super.setUp();

        address[] memory allowedUsers = new address[](4);
        allowedUsers[0] = alice;
        allowedUsers[1] = bob;
        allowedUsers[2] = eve;
        allowedUsers[3] = address(this);
        comparator = new ConfidentialWealthComparator(allowedUsers);
    }

    function testConstructorInputValidation() public {
        address[] memory emptyUsers = new address[](0);
        vm.expectRevert(abi.encodeWithSelector(ConfidentialWealthComparator.InvalidInput.selector));
        new ConfidentialWealthComparator(emptyUsers);
    }

    function testOnlyAllowedUserCanSubmitWealth() public {
        uint256 carolWealth = 1 ether;
        bytes memory encryptedWealth = fakePrepareEuint256Ciphertext(carolWealth);

        vm.expectRevert(abi.encodeWithSelector(ConfidentialWealthComparator.UserNotAllowed.selector, carol));
        vm.prank(carol);
        comparator.submitWealth(encryptedWealth);

        processAllOperations();
    }

    function testSubmitWealthEOA() public {
        uint256 aliceWealth = 1 ether;
        _submitWealth(alice, aliceWealth);

        assertTrue(alice.isAllowed(comparator.wealthOf(alice)));
        assertTrue(address(comparator).isAllowed(comparator.wealthOf(alice)));
        assertEq(getUint256Value(comparator.wealthOf(alice)), 1 ether);
    }

    function testUserCannotSubmitWealthTwice() public {
        uint256 aliceWealth = 1 ether;
        _submitWealth(alice, aliceWealth);

        processAllOperations();
        uint256 oldRecordedWealth = getUint256Value(comparator.wealthOf(alice));

        uint256 newWealth = 2 ether;
        _submitWealth(alice, newWealth);

        processAllOperations();
        uint256 newRecordedWealth = getUint256Value(comparator.wealthOf(alice));

        assertEq(newRecordedWealth, oldRecordedWealth);
    }

    function testSubmitWealthRevertsIfHandleAccessNotAllowed() public {
        uint256 aliceWealth = 1 ether;
        euint256 encryptedWealth = fakePrepareEuint256Ciphertext(aliceWealth).newEuint256(alice);

        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(ConfidentialWealthComparator.UnauthorizedHandleAccess.selector));
        comparator.submitWealth(encryptedWealth);
    }

    function testSubmitWealthSmartContract() public {
        uint256 wealth = 1 ether;
        euint256 encryptedWealth = fakePrepareEuint256Ciphertext(wealth).newEuint256(alice);

        vm.prank(alice);
        encryptedWealth.allow(address(comparator));

        comparator.submitWealth(encryptedWealth);
        vm.stopPrank();
    }

    function testCompareWealth() public {
        uint256 aliceWealth = 5 ether;
        uint256 bobWealth = 10 ether;
        uint256 eveWealth = 3 ether;

        _submitWealth(alice, aliceWealth);
        _submitWealth(bob, bobWealth);
        _submitWealth(eve, eveWealth);

        address[] memory users = new address[](3);
        users[0] = alice;
        users[1] = bob;
        users[2] = eve;

        uint256 requestId = comparator.compareWealth(users);

        processAllOperations();

        assertEq(comparator.getRichestUser(requestId), bob);
    }

    function testOnlyAllowedUsersCanCompareWealth() public {
        address[] memory users = new address[](2);
        users[0] = alice;
        users[1] = carol;

        vm.expectRevert(abi.encodeWithSelector(ConfidentialWealthComparator.UserNotAllowed.selector, carol));
        comparator.compareWealth(users);
    }

    function testCompareWealthRevertsIfInputIsEmpty() public {
        address[] memory users = new address[](0);
        vm.expectRevert(abi.encodeWithSelector(ConfidentialWealthComparator.InvalidInput.selector));
        comparator.compareWealth(users);
    }

    function testOnlyIncoCanCallTheDecryptionCallback() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(ConfidentialWealthComparator.CallerNotInco.selector));
        comparator.decryptionCallback(0, 0, "");
    }

    function testDecryptionCallbackRevertsIfRequestIsAlreadyFulfilled() public {
        _submitWealth(alice, 1 ether);
        _submitWealth(bob, 2 ether);

        processAllOperations();
        address[] memory users = new address[](2);
        users[0] = alice;
        users[1] = bob;
        comparator.compareWealth(users);

        processAllOperations();

        vm.prank(address(inco));
        vm.expectRevert(abi.encodeWithSelector(ConfidentialWealthComparator.RequestAlreadyFulfilled.selector, 0));
        comparator.decryptionCallback(0, 0, "");
    }

    function _submitWealth(address user, uint256 wealth) internal {
        bytes memory encryptedWealth = fakePrepareEuint256Ciphertext(wealth);

        vm.prank(user);
        comparator.submitWealth(encryptedWealth);

        processAllOperations();
    }
}
