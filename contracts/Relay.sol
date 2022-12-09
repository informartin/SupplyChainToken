pragma solidity ^0.5.0;

contract Relay {

    mapping(bytes32 => bool) headerHashes;

    function storeHeaderHash(bytes32 _headerHash) public {
        headerHashes[_headerHash] = true;
    }

    function isHeaderHashStored(bytes32 _headerHash) public view returns (bool) {
        return headerHashes[_headerHash];
    } 
}