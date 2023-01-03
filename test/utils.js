const { RLP } = require("ethers-utils");

// https://github.com/PISAresearch/event-proofs/blob/cc22d50d2afd596e7b0edd091903a5f5d4c2d245/test/eventProof.spec.ts
  exports.prepareReceiptProof = (proof) => {
    // the path is HP encoded
    let hpIndex;
    // if only leaf is present
    if (proof.txIndex === "0x0") {
      hpIndex = "0x2080";
    }  
    else {
      const indexBuffer = proof.txIndex.slice(2);
      hpIndex = "0x" + (indexBuffer.startsWith("0") ? "1" + indexBuffer.slice(1) : "00" + indexBuffer);
    }

    // the value is the second buffer in the leaf (last node)
    const value = "0x" + Buffer.from(proof.receiptProof[proof.receiptProof.length - 1][1]).toString("hex");
    // the parent nodes must be rlp encoded
    const parentNodes = RLP.encode(proof.receiptProof);

    return {
        path: hpIndex,
        rlpEncodedReceipt: value,
        witness: parentNodes
    };
  };

//   const encode = input => (input === '0x0')
//     ? RLP.encode(Buffer.alloc(0))
//     : RLP.encode(input);

exports.rlpEncodedBlock = (block) => {
    const selectedBlockElements = [
        block.parentHash,
        block.sha3Uncles,
        block.miner,
        block.stateRoot,
        block.transactionsRoot,
        block.receiptsRoot,
        block.logsBloom,
        web3.utils.toHex(block.difficulty) === "0x0" ? "0x": web3.utils.toHex(block.difficulty),
        web3.utils.toHex(block.number),
        web3.utils.toHex(block.gasLimit),
        block.gasUsed === "0x0" ? "0x": web3.utils.toHex(block.gasUsed),
        web3.utils.toHex(block.timestamp),
        block.extraData,
        block.mixHash,
        block.nonce
    ];

    return RLP.encode(selectedBlockElements);
  };