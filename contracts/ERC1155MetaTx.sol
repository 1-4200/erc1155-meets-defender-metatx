// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "@openzeppelin/contracts/metatx/MinimalForwarder.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";

error InvalidSignature();

contract ERC1155MetaTx is ERC1155, AccessControl, ERC2771Context, EIP712 {
    string private constant _DOMAIN_NAME = "ERC1155MetaTx";
    string private constant _DOMAIN_VERSION = "1.0.0";

    string public name;
    string public symbol;

    constructor(
        MinimalForwarder forwarder,
        string memory _uri,
        string memory _name,
        string memory _symbol
    ) ERC2771Context(address(forwarder)) ERC1155(_uri) EIP712(_DOMAIN_NAME, _DOMAIN_VERSION) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        name = _name;
        symbol = _symbol;
    }

    function redeem(
        address _account,
        uint256 _tokenId,
        uint256 _amount,
        bytes memory _data,
        bytes calldata _signature
    ) external payable {
        _redeem(_account, _tokenId, _amount, _data, _signature);
    }

    function _redeem(
        address _account,
        uint256 _tokenId,
        uint256 _redeemAmount,
        bytes memory _data,
        bytes calldata _signature
    ) private {
        if (!_verify(_hash(_tokenId, _redeemAmount), _signature)) revert InvalidSignature();
        _mint(_account, _tokenId, _redeemAmount, _data);
    }

    function _hash(uint256 _tokenId, uint256 _amount) internal view returns (bytes32) {
        return
            _hashTypedDataV4(
                keccak256(abi.encode(keccak256("NFT(uint256 tokenId,uint256 amount)"), _tokenId, _amount))
            );
    }

    function _verify(bytes32 _digest, bytes memory _signature) internal view returns (bool) {
        address recovered = ECDSA.recover(_digest, _signature);
        return _msgSender() == recovered;
    }

    function _msgSender() internal view override(Context, ERC2771Context) returns (address sender) {
        return ERC2771Context._msgSender();
    }

    function _msgData() internal view override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}