pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721Token.sol";
import "./Certificate.sol";

contract SCToken is ERC721Token {
  using SafeMath for uint256;

  // This token contract's owner
  address owner;

  // Compents that are required for generating a token
  address[] components;

  // Amounts of that component that are required for generating a token
  uint256[] amounts;

  // Link to an external Storage such as IPFS using its hash
  bytes32 externalInfo;

  // Mapping that stores the amount contained in one batch (NF token)
  mapping(uint256 => uint256) contentAmount;

  // Mapping that stores links to external information for each batch
  mapping(uint256 => bytes32) externalBatchInfo;

  modifier onlyContractOwner() {
    require(msg.sender == owner);
    _;
  }

  constructor(address _owner, string _name, string _symbol, address[] _components, uint256[] _amounts) ERC721Token(_name, _symbol) public {
    require(_components.length == _amounts.length);

    owner = _owner;
    components = _components;
    amounts = _amounts;
  }

  function mint(uint256 _quantity, address[] _components, uint256[] _tokenIds, uint256[] _amounts) public onlyContractOwner {
    // Check if the array lengths are equal and comply to the required components
    require(_components.length == _tokenIds.length);
    require(_amounts.length == _components.length);
    require(_components.length == components.length);

    // Generate token ID (maybe more enthropy would be good)
    uint256 tokenId = uint256(
      keccak256(
        abi.encodePacked(_components, _tokenIds, _amounts, msg.sender, now)));

    // Reduce all input components according to the used amounts
    for(uint i = 0; i < components.length; i++) {
      // Ensure the required amounts of input components was used and reduce
      require(_quantity * _amounts[i] >= amounts[i]);
      if(_components[i] != components[i])
        require(Certificate(components[i]).hasGood(_components[i]));
      SCToken(_components[i]).reduceContent(_tokenIds[i],_amounts[i]);
    }

    _mint(msg.sender, tokenId);
    contentAmount[tokenId] = _quantity;
    emit Mint(tokenId, _components, _tokenIds, _amounts, now);
  }

  function reduceContent(uint256 _tokenId, uint256 _amount) public canTransfer(_tokenId) {
    require(_amount <= contentAmount[_tokenId]);

    // Burn token if batch will be empty
    if(_amount == contentAmount[_tokenId])
      burn(_tokenId);
    else
      contentAmount[_tokenId] = contentAmount[_tokenId].sub(_amount);
  }

  function burn(uint256 _tokenId) public canTransfer(_tokenId) {
    _burn(msg.sender, _tokenId);
    contentAmount[_tokenId] = 0;
  }

  function tokenContent(uint256 _tokenId) public view returns (uint256) {
    return contentAmount[_tokenId];
  }

  function setExternalInfo(bytes32 link) public onlyContractOwner {
    externalInfo = link;
  }

  function getExternalInfo() public constant returns (bytes32) {
    return externalInfo;
  }

  function setExternalInfoForToken(uint256 _tokenId, bytes32 link) public canTransfer(_tokenId) {
    externalBatchInfo[_tokenId] = link;
  }

  function getExternalInfoForToken(uint256 _tokenId) public constant returns (bytes32) {
    return externalBatchInfo[_tokenId];
  }

  event Mint(
    uint256 indexed batchId,
    address[] source_components,
    uint256[] source_batches,
    uint256[] source_amounts,
    uint timestamp
  );
}
