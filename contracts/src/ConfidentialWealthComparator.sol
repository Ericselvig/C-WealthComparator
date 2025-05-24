// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {inco, euint256, ebool, e} from "@inco/lightning/src/Lib.sol";

/**
 * @author Yash Goyal (Ericselvig)
 * @title ConfidentialWealthComparator
 * @notice A contract that allows users to compare their wealth without revealing the actual values.
 * @dev Uses Inco Lightning.
 */
contract ConfidentialWealthComparator {
    using e for euint256;
    using e for ebool;
    using e for uint256;
    using e for bytes;
    using e for address;

    //////// ERRORS ////////
    error UnauthorizedHandleAccess();
    error RequestAlreadyFulfilled(uint256 requestId);
    error InvalidInput();

    //////// STORAGE ////////

    // SLOT 0
    uint256 private latestRequestId;

    mapping(uint256 requestId => address richestUser) private richestUserByRequestId;
    mapping(address => euint256) public wealthOf;

    //////// EVENTS ////////
    event RichestUserUpdated(address indexed user, uint256 indexed requestId);

    //////// EXTERNAL FUNCTIONS ////////

    /**
     * @notice Allows users to submit their encrypted wealth.
     * @dev This function is meant to be called by EOAs.
     * @param _encryptedWealth The ciphertext wealth of the user.
     */
    function submitWealth(bytes memory _encryptedWealth) external {
        euint256 wealth = _encryptedWealth.newEuint256(msg.sender);
        _submitWealth(wealth);
    }

    /**
     * @notice Allows users to submit their encrypted wealth.
     * @dev This function is meant to be called by smart contracts.
     * @param _encryptedWealth The encrypted wealth of the user.
     */
    function submitWealth(euint256 _encryptedWealth) external {
        if (!msg.sender.isAllowed(_encryptedWealth)) revert UnauthorizedHandleAccess();
        _submitWealth(_encryptedWealth);
    }

    /**
     * @notice Compares the wealth of multiple users and returns the address of the richest user.
     * @param _users An array of user addresses to compare.
     * @return The ID of the decryption request.
     */
    function compareWealth(address[] calldata _users) external returns (uint256) {
        if (_users.length == 0) revert InvalidInput();

        euint256 richestUserWealthEncrypted = wealthOf[_users[0]];
        euint256 richestUserEncrypted = uint256(uint160(_users[0])).asEuint256();

        for (uint256 i = 1; i < _users.length; ++i) {
            ebool success = wealthOf[_users[i]].ge(richestUserWealthEncrypted);
            richestUserWealthEncrypted = success.select(wealthOf[_users[i]], richestUserWealthEncrypted);
            richestUserEncrypted = success.select(uint256(uint160(_users[i])).asEuint256(), richestUserEncrypted);
        }

        richestUserEncrypted.allowThis();

        latestRequestId = richestUserEncrypted.requestDecryption(this.decryptionCallback.selector, "");
        return latestRequestId;
    }

    /**
     * @notice Decryption callback function.
     * @dev This function is called by the INCO contract when the decryption is successful.
     * @param requestId The request ID.
     * @param result The result of the decryption.
     */
    function decryptionCallback(uint256 requestId, uint256 result, bytes memory) external {
        if (msg.sender != address(inco)) revert UnauthorizedHandleAccess();
        if (richestUserByRequestId[requestId] != address(0)) revert RequestAlreadyFulfilled(requestId);

        address richestUser = address(uint160(result));
        richestUserByRequestId[requestId] = richestUser;

        emit RichestUserUpdated(richestUser, requestId);
    }

    //////// EXTERNAL VIEW FUNCTIONS ////////

    /**
     * @notice Returns the richest user.
     * @param _requestId The ID of the decryption request.
     * @return The address of the richest user for the given request ID.
     */
    function getRichestUser(uint256 _requestId) external view returns (address) {
        return richestUserByRequestId[_requestId];
    }

    //////// INTERNAL FUNCTIONS ////////

    /**
     * @dev internal logic for submitting wealth
     * @param _encryptedWealth The encrypted wealth of the user in the form of an euint256.
     */
    function _submitWealth(euint256 _encryptedWealth) internal {
        ebool success = wealthOf[msg.sender].eq(uint256(0).asEuint256());

        euint256 newWealth = success.select(_encryptedWealth, wealthOf[msg.sender]);

        wealthOf[msg.sender] = newWealth;

        newWealth.allow(msg.sender);
        newWealth.allowThis();
    }
}
