// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

interface IERC1155MetaTx is IERC1155 {
    /// @dev Error constants.
    error InvalidSignature();

    /// @dev Let account redeem a given amount of tokenId with a signature.
    /// @param _account The account to receive tokens.
    /// @param _tokenId The unique ID of the token to redeem.
    /// @param _amount The amount of tokens to redeem.
    /// @param _data The data to pass additional data for redeem.
    /// @param _signature The signature created by EIP-712.
    function redeem(
        address _account,
        uint256 _tokenId,
        uint256 _amount,
        bytes memory _data,
        bytes calldata _signature
    ) external payable;

    /// @dev Replacement for msg.sender.
    /// Returns the actual sender of a transaction: msg.sender for regular transactions,
    /// and the end-user for relayed callsReplacement for msg.sender.
    /// Returns the actual sender of a transaction: msg.sender for regular transactions, and the end-user for relayed calls.
    function _msgSender() internal view virtual override returns (address sender);

    /// @dev Replacement for msg.data.
    /// Returns the actual calldata of a transaction: msg.data for regular transactions,
    /// and a reduced version for relayed calls.
    function _msgData() internal view virtual override returns (bytes calldata);
}
