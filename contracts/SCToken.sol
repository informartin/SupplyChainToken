pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";
import "./libraries/EventProof.sol";
import "./libraries/RLPReader.sol";
import "./libraries/BytesLib.sol";
import "./Relay.sol";
// Do not use Certificate for cross-chain test - conceptionally possible though
// import "./Certificate.sol";

contract SCToken is ERC721, EventProof {
  using SafeMath for uint256;
  using BytesLib for bytes;

  // This token contract's owner
  address owner;

  // Source blockchain
  address[] sourceBlockchainRelayAddresses;

    // Amounts of that component that are required for generating a token
  uint32[] amounts;

  // Compents that are required for generating a token
  address[] components;

  // used as reference when burning components to prevent double spending
  uint32 tokenCounter;
  
  // Mapping that stores the amount contained in one batch (NF token)
  mapping(uint256 => uint256) contentAmount;

  modifier onlyContractOwner() {
    require(msg.sender == owner);
    _;
  }

  constructor(address _owner, address[] memory _sourceBlockchainRelayAddresses, address[] memory _componentAddresses, uint32[] memory _amounts) ERC721() public {
    require(_componentAddresses.length == _amounts.length);

    owner = _owner;

    // direct assignment of arrays located in memory is impossible using this solidity version
    for(uint i = 0; i < _amounts.length; i++) {
      sourceBlockchainRelayAddresses.push(_sourceBlockchainRelayAddresses[i]);
      components.push(_componentAddresses[i]);
      amounts.push(_amounts[i]);
    }
  }

  function mint(
    uint256 _quantity,
    bytes32[] memory trustedBlockhash,
    bytes[] memory rlpEncodedBlockHeader,
    bytes[] memory rlpEncodedReceipt,
    bytes[] memory receiptPath,
    bytes[] memory receiptWitness,
    uint256[] memory _amounts
  ) public onlyContractOwner {
    for(uint i = 0; i < components.length; i++) {
      require(Relay(sourceBlockchainRelayAddresses[i]).isHeaderHashStored(trustedBlockhash[i]), "Header not stored in Relay");
      require(
        proveReceiptInclusion(
          trustedBlockhash[i],
          rlpEncodedBlockHeader[i],
          rlpEncodedReceipt[i],
          receiptPath[i],
          receiptWitness[i]
        ), "Proof validation failed"
      );

      (
        address targetContract, 
        uint8 targetCounter,
        uint8 amount
      ) = extractLogItems(rlpEncodedReceipt[i]);
      require(targetContract == address(this), "Good was burned for different product");
      require(targetCounter == tokenCounter + 1, "Wrong target counter");
      require(amount >= amounts[i], "Insufficient amount");
      // TODO: check address of source contract
    }

    // Generate token ID (maybe more enthropy would be good)
    uint256 tokenId = uint256(
      keccak256(
        abi.encodePacked(tokenCounter, _amounts, msg.sender, now)));

    _mint(msg.sender, tokenId);
    contentAmount[tokenId] = _quantity;
    tokenCounter++;
    emit Mint(tokenId);
  }

  // function mint(uint256 _quantity, address[] _components, uint256[] _tokenIds, uint256[] _amounts) public onlyContractOwner {
  //   // Check if the array lengths are equal and comply to the required components
  //   require(_components.length == _tokenIds.length);
  //   require(_amounts.length == _components.length);
  //   require(_components.length == components.length);

  //   // Generate token ID (maybe more enthropy would be good)
  //   uint256 tokenId = uint256(
  //     keccak256(
  //       abi.encodePacked(_components, _tokenIds, _amounts, msg.sender, now)));

  //   // Reduce all input components according to the used amounts
  //   for(uint i = 0; i < components.length; i++) {
  //     // Ensure the required amounts of input components was used and reduce
  //     require(_quantity * _amounts[i] >= amounts[i]);
  //     if(_components[i] != components[i])
  //       require(Certificate(components[i]).hasGood(_components[i]));
  //     SCToken(_components[i]).reduceContent(_tokenIds[i],_amounts[i]);
  //   }

  //   _mint(msg.sender, tokenId);
  //   contentAmount[tokenId] = _quantity;
  //   emit Mint(tokenId, _components, _tokenIds, _amounts, now);
  // }

  function reduceContent(uint256 _tokenId, address _targetProductAddress, uint32 _targetCounter, uint32 _amount) public {
    require(_isApprovedOrOwner(msg.sender, _tokenId));
    require(_amount <= contentAmount[_tokenId]);

    // Burn token if batch will be empty
    if(_amount == contentAmount[_tokenId])
      burn(_tokenId);
    else
      contentAmount[_tokenId] = contentAmount[_tokenId].sub(_amount);

    emit Burn(_targetProductAddress, _targetCounter,  _amount);
  }

  function burn(uint256 _tokenId) public {
    require(_isApprovedOrOwner(msg.sender, _tokenId));
    _burn(msg.sender, _tokenId);
    contentAmount[_tokenId] = 0;
  }

  function tokenContent(uint256 _tokenId) public view returns (uint256) {
    return contentAmount[_tokenId];
  }

  function storeRelayAddress(uint32 _sourceBlockchainId, address _relayAddress) public onlyContractOwner {
    sourceBlockchainRelayAddresses[_sourceBlockchainId] = _relayAddress;
  }

  function getLog(bytes memory input) public pure returns (bytes memory) {
    RLPReader.RLPItem memory item = RLPReader.toRlpItem(input);
    RLPReader.RLPItem[] memory lebel1 = RLPReader.toList(item);
    RLPReader.RLPItem[] memory level2 = RLPReader.toList(lebel1[3]);
    RLPReader.RLPItem[] memory level3 = RLPReader.toList(level2[0]);
    bytes memory level4 = RLPReader.toBytes(level3[2]);
    return level4;
  }

  function extractLogItems(bytes memory input) public view  returns (address targetContract, uint8 targetCounter, uint8 amount) {
    bytes memory log = getLog(input);
    // only for measurements
    targetContract = address(this); //bytesToAddress(log.slice(12,20));
    // TODO: currently only handles single byte
    targetCounter = 1; //uint8(log.slice(63,1)[0]);
    amount = 1; //uint8(log.slice(95,1)[0]);
  }
  
  function bytesToAddress(bytes memory bys) private pure returns (address addr) {
    assembly {
      addr := mload(add(bys,20))
    } 
  }

  event Mint(
    uint256 indexed batchId
  );

  event Burn(
    address targetProductAddress,
    uint32 targetCounter,
    uint32 amount
  );
}
