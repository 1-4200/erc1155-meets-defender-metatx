import { ethers } from "hardhat";
import { Contract, ContractFactory } from "ethers";
import { ERC1155MetaTx } from "../src/types";
import { MinimalForwarder } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { createERC1155MetaTxSignature } from "../scripts/_contract";
import { expect } from "chai";
import { signMetaTxRequest } from "../scripts/_metatx";
import { accounts } from "../test-wallet";

describe("ERC1155MetaTx", () => {
  let ERC1155MetaTx, MinimalForwarder: ContractFactory;
  let forwarder: MinimalForwarder;
  let erc1155MetaTx: ERC1155MetaTx;
  let acc1: SignerWithAddress, acc2: SignerWithAddress, acc3: SignerWithAddress, others: SignerWithAddress[];
  let defaultContractURI = "ipfs://",
    defaultContractName = "MyERC1155MetaTx",
    defaultContractSymbol = "MCT";

  const domainName = "ERC1155MetaTx",
    domainVersion = "1.0.0",
    heChainId = 31337;
  const acc1PrivateKey = accounts[0].secretKey,
    acc2PrivateKey = accounts[1].secretKey,
    acc3PrivateKey = accounts[2].secretKey;
  const zeroAddress = "0x0000000000000000000000000000000000000000",
    emptyBytes = "0x";
  const tokenId1 = 1,
    tokenId2 = 2,
    tokenId3 = 3;
  const amount1 = 1,
    amount5 = 5,
    amount10 = 10;

  beforeEach(async () => {
    [acc1, acc2, acc3, ...others] = await ethers.getSigners();
    MinimalForwarder = await ethers.getContractFactory("MinimalForwarder");
    forwarder = (await MinimalForwarder.deploy()) as MinimalForwarder;
    await forwarder.deployed();

    ERC1155MetaTx = await ethers.getContractFactory("ERC1155MetaTx");
    erc1155MetaTx = (await ERC1155MetaTx.deploy(
      forwarder.address,
      defaultContractURI,
      defaultContractName,
      defaultContractSymbol,
    )) as ERC1155MetaTx;
    await erc1155MetaTx.deployed();
  });

  describe("Redeem", () => {
    it("Should redeem a token directly", async () => {
      const sig = await createERC1155MetaTxSignature(
        acc1,
        erc1155MetaTx.address,
        tokenId1,
        amount1,
        domainName,
        domainVersion,
        heChainId,
      );
      await expect(await erc1155MetaTx.connect(acc1).redeem(acc2.address, tokenId1, amount1, emptyBytes, sig))
        .to.emit(erc1155MetaTx, "TransferSingle")
        .withArgs(acc1.address, zeroAddress, acc2.address, tokenId1, amount1);
      await expect(await erc1155MetaTx.balanceOf(acc2.address, tokenId1)).to.equal(amount1);
      await expect(await erc1155MetaTx.balanceOf(acc1.address, tokenId1)).to.equal(0);
    });

    it("Should redeem a token via meta-tx", async () => {
      const signer = acc2;
      const relayer = acc3;
      const forwarderContract = forwarder.connect(relayer);

      const sig = await createERC1155MetaTxSignature(
        signer,
        erc1155MetaTx.address,
        tokenId1,
        amount1,
        domainName,
        domainVersion,
        heChainId,
      );
      const data = erc1155MetaTx.interface.encodeFunctionData("redeem", [
        signer.address,
        tokenId1,
        amount1,
        emptyBytes,
        sig,
      ]);
      const { request, signature } = await signMetaTxRequest(acc2PrivateKey, forwarderContract, {
        to: erc1155MetaTx.address,
        from: signer.address,
        data,
      });

      await expect(await forwarderContract.execute(request, signature))
        .to.emit(erc1155MetaTx, "TransferSingle")
        .withArgs(signer.address, zeroAddress, signer.address, tokenId1, amount1);
      await expect(await erc1155MetaTx.balanceOf(signer.address, tokenId1)).to.equal(amount1);
      await expect(await erc1155MetaTx.balanceOf(acc1.address, tokenId1)).to.equal(0);
    });

    it("Should fail to redeem a token directly if wrong signature passed", async () => {
      const sig1 = await createERC1155MetaTxSignature(
        acc2, // wrong signer
        erc1155MetaTx.address,
        tokenId1,
        amount1,
        domainName + "hoge",
        domainVersion,
        heChainId,
      );
      const sig2 = await createERC1155MetaTxSignature(
        acc1,
        erc1155MetaTx.address,
        tokenId3, // wrong tokenId
        amount1,
        domainName,
        domainVersion,
        heChainId,
      );
      const sig3 = await createERC1155MetaTxSignature(
        acc1,
        erc1155MetaTx.address,
        tokenId1,
        amount10, // wrong amount
        domainName,
        domainVersion,
        heChainId,
      );
      const sig4 = await createERC1155MetaTxSignature(
        acc1,
        erc1155MetaTx.address,
        tokenId1,
        amount1,
        domainName + "hoge", // wrong domainName
        domainVersion,
        heChainId,
      );
      const sig5 = await createERC1155MetaTxSignature(
        acc1,
        erc1155MetaTx.address,
        tokenId1,
        amount1,
        domainName,
        domainVersion,
        1, // wrong chainId
      );
      await Promise.all(
        [sig1, sig2, sig3, sig4, sig5].map(async sig => {
          await expect(
            erc1155MetaTx.connect(acc1).redeem(acc2.address, tokenId1, amount1, emptyBytes, sig),
          ).to.be.revertedWithCustomError(erc1155MetaTx, "InvalidSignature");
        }),
      );
    });

    it("Should fail to redeem a token via meta-tx if wrong data passed", async () => {
      const signer = acc2;
      const relayer = acc3;
      const forwarderContract = forwarder.connect(relayer);

      const sig = await createERC1155MetaTxSignature(
        signer,
        erc1155MetaTx.address,
        tokenId1,
        amount1,
        domainName,
        domainVersion,
        heChainId,
      );
      const data = erc1155MetaTx.interface.encodeFunctionData("redeem", [
        signer.address,
        tokenId1,
        amount1,
        emptyBytes,
        sig,
      ]);
      const { request, signature } = await signMetaTxRequest(acc2PrivateKey, forwarderContract, {
        to: erc1155MetaTx.address,
        from: acc1.address, // wrong from
        data,
      });
      await expect(forwarderContract.execute(request, signature)).to.be.revertedWith(
        "MinimalForwarder: signature does not match request",
      );
    });
  });

  describe("Transfer", () => {
    let sig: string;
    beforeEach(async () => {
      sig = await createERC1155MetaTxSignature(
        acc1,
        erc1155MetaTx.address,
        tokenId1,
        amount1,
        domainName,
        domainVersion,
        heChainId,
      );
      const sig2 = await createERC1155MetaTxSignature(
        acc1,
        erc1155MetaTx.address,
        tokenId2,
        amount1,
        domainName,
        domainVersion,
        heChainId,
      );
      const sig3 = await createERC1155MetaTxSignature(
        acc1,
        erc1155MetaTx.address,
        tokenId3,
        amount10,
        domainName,
        domainVersion,
        heChainId,
      );
      await erc1155MetaTx.connect(acc1).redeem(acc1.address, tokenId1, amount1, emptyBytes, sig);
      await erc1155MetaTx.connect(acc1).redeem(acc1.address, tokenId2, amount1, emptyBytes, sig2);
      await erc1155MetaTx.connect(acc1).redeem(acc1.address, tokenId3, amount10, emptyBytes, sig3);
    });

    it("Should transfer a token directly", async () => {
      // TokenId1
      await expect(await erc1155MetaTx.balanceOf(acc1.address, tokenId1)).to.equal(amount1);
      await expect(await erc1155MetaTx.balanceOf(acc2.address, tokenId1)).to.equal(0);

      await expect(
        await erc1155MetaTx.connect(acc1).safeTransferFrom(acc1.address, acc2.address, tokenId1, amount1, emptyBytes),
      )
        .to.emit(erc1155MetaTx, "TransferSingle")
        .withArgs(acc1.address, acc1.address, acc2.address, tokenId1, amount1);
      await expect(await erc1155MetaTx.balanceOf(acc2.address, tokenId1)).to.equal(amount1);
      await expect(await erc1155MetaTx.balanceOf(acc1.address, tokenId1)).to.equal(0);

      // TokenId3
      await expect(await erc1155MetaTx.balanceOf(acc1.address, tokenId3)).to.equal(amount10);
      await expect(await erc1155MetaTx.balanceOf(acc2.address, tokenId3)).to.equal(0);

      await expect(
        await erc1155MetaTx.connect(acc1).safeTransferFrom(acc1.address, acc2.address, tokenId3, amount5, emptyBytes),
      )
        .to.emit(erc1155MetaTx, "TransferSingle")
        .withArgs(acc1.address, acc1.address, acc2.address, tokenId3, amount5);
      await expect(await erc1155MetaTx.balanceOf(acc2.address, tokenId3)).to.equal(amount5);
      await expect(await erc1155MetaTx.balanceOf(acc1.address, tokenId3)).to.equal(amount5);
    });

    it("Should transfer a token via meta-tx", async () => {
      const signer = acc1;
      const relayer = acc3;
      const forwarderContract = forwarder.connect(relayer);
      await expect(await erc1155MetaTx.balanceOf(signer.address, tokenId1)).to.equal(amount1);
      await expect(await erc1155MetaTx.balanceOf(acc2.address, tokenId1)).to.equal(0);

      // @ts-ignore
      const data = erc1155MetaTx.interface.encodeFunctionData("safeTransferFrom", [
        signer.address,
        acc2.address,
        tokenId1,
        amount1,
        emptyBytes,
      ]);
      const { request, signature } = await signMetaTxRequest(acc1PrivateKey, forwarderContract, {
        to: erc1155MetaTx.address,
        from: signer.address,
        data,
      });
      await forwarderContract.execute(request, signature);
      await expect(await erc1155MetaTx.balanceOf(signer.address, tokenId1)).to.equal(0);
      await expect(await erc1155MetaTx.balanceOf(acc2.address, tokenId1)).to.equal(amount1);
    });

    it("Should transfer a token with amount via meta-tx", async () => {
      // TokenId1
      const signer = acc1;
      const relayer = acc3;
      const forwarderContract = forwarder.connect(relayer);
      await expect(await erc1155MetaTx.balanceOf(signer.address, tokenId3)).to.equal(amount10);
      await expect(await erc1155MetaTx.balanceOf(acc2.address, tokenId3)).to.equal(0);

      // @ts-ignore
      const data = erc1155MetaTx.interface.encodeFunctionData("safeTransferFrom", [
        signer.address,
        acc2.address,
        tokenId3,
        amount5,
        emptyBytes,
      ]);
      const { request, signature } = await signMetaTxRequest(acc1PrivateKey, forwarderContract, {
        to: erc1155MetaTx.address,
        from: signer.address,
        data,
      });
      await forwarderContract.execute(request, signature);
      await expect(await erc1155MetaTx.balanceOf(signer.address, tokenId3)).to.equal(amount5);
      await expect(await erc1155MetaTx.balanceOf(acc2.address, tokenId3)).to.equal(amount5);
    });

    it("Should fail to transfer a token via meta-tx if operator is not owner", async () => {
      const signer = acc2;
      const relayer = acc3;
      const forwarderContract = forwarder.connect(relayer);

      await expect(await erc1155MetaTx.balanceOf(acc1.address, tokenId1)).to.equal(amount1);
      await expect(await erc1155MetaTx.balanceOf(signer.address, tokenId1)).to.equal(0);
      await expect(await erc1155MetaTx.balanceOf(relayer.address, tokenId1)).to.equal(0);
      // @ts-ignore
      const data = erc1155MetaTx.interface.encodeFunctionData("safeTransferFrom", [
        acc1.address,
        acc2.address,
        tokenId1,
        amount1,
        emptyBytes,
      ]);
      const { request, signature } = await signMetaTxRequest(acc2PrivateKey, forwarderContract, {
        to: erc1155MetaTx.address,
        from: signer.address,
        data,
      });
      await expect(await forwarderContract.execute(request, signature)).to.not.emit(erc1155MetaTx, "TransferSingle");
      // const tx = await forwarderContract.execute(request, signature);
      // const rc = await tx.wait();
      // console.log(rc.transactionHash);

      await expect(await erc1155MetaTx.balanceOf(acc1.address, tokenId1)).to.equal(amount1);
      await expect(await erc1155MetaTx.balanceOf(signer.address, tokenId1)).to.equal(0);
      await expect(await erc1155MetaTx.balanceOf(relayer.address, tokenId1)).to.equal(0);
      // await expect(forwarderContract.execute(request, signature)).to.be.revertedWith(
      //   "ERC1155: caller is not an owner nor approved",
      // );
    });

    it("Should fail to transfer a token via meta-tx if wrong singature passed", async () => {
      const signer = acc2;
      const relayer = acc3;
      const forwarderContract = forwarder.connect(relayer);

      // @ts-ignore
      const data = erc1155MetaTx.interface.encodeFunctionData("safeTransferFrom", [
        acc1.address,
        acc2.address,
        tokenId1,
        amount1,
        emptyBytes,
      ]);
      const { request, signature } = await signMetaTxRequest(acc2PrivateKey, forwarderContract, {
        to: erc1155MetaTx.address,
        from: acc1.address, // wrong signer
        data,
      });
      await expect(forwarderContract.execute(request, signature)).to.be.revertedWith(
        "MinimalForwarder: signature does not match request",
      );
    });
  });
});
