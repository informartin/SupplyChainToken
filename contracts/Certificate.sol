pragma solidity ^0.4.23;

contract Certificate {

    address owner;

    string description;

    mapping (address => bool) certifiedGoods; //Not sure if a mapping a good idea...

    constructor(address _owner, string _description) public {
        owner = _owner;
        description = _description;
    }

    function certifyGood(address contract_address) public onlyOwner returns (bool) {
        if(!certifiedGoods[contract_address]) {
            certifiedGoods[contract_address] = true;
            emit AddedCertifiedGood(contract_address);
            return true;
        } else {
            return false;
        }
    }

    function uncertifyGood(address contract_address) public onlyOwner {
        certifiedGoods[contract_address] = false;
        emit RemoveCertifiedGood(contract_address);
    }

    function hasGood(address contract_address) public constant returns (bool) {
        return certifiedGoods[contract_address];
    }

    function getDescription() public constant returns (string) {
        return description;
    }

    function getOwner() public constant returns (address) {
        return owner;
    }

    // Functions with this modifier can only be executed by the owner
    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert();
        }
        _;
    }

    event AddedCertifiedGood(address contract_address);

    event RemoveCertifiedGood(address contract_address);

}
