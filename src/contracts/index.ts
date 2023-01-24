/* eslint-disable no-console */

import { ethers } from 'ethers';
import contracts from './contracts.json';
import { erc20ABI } from 'wagmi'
import axios from 'axios';

let signer: any = null;
let provider: any = null;

let NFT: any = null;

let NFTWithSigner:any = null;
let currencyContract: any = null

export const initializeWeb3 = async (provider_: any, signer_: any) => {
  currencyContract = new ethers.Contract(contracts.KingFlokiNFTs.address, erc20ABI, signer_);
  NFTWithSigner = new ethers.Contract(contracts.KingFlokiNFTs.address, contracts.KingFlokiNFTs.abi, signer_);
  NFT = new ethers.Contract(contracts.KingFlokiNFTs.address, contracts.KingFlokiNFTs.abi, provider_);

  provider = provider_;
  signer = await signer_;
  console.log({ provider, signer });
};

export const NFTMintCostInEth = async () => {
    const tx = await NFT.randomNftMintCostETH();
    const _tx = parseInt(tx);
    return _tx;
}

export const requestMintRandomNft = async (handleStatus: (value: number) => Promise<void>, quantity: number) => {
    const group_id = 0
    const ownerAddress = await signer.getAddress();

    const freeMintAvailable = await NFTWithSigner.freeMintsAvailable(ownerAddress, group_id);
    const _freeMintAvailable = parseInt(freeMintAvailable);
    console.log({ _freeMintAvailable })

    if(_freeMintAvailable !== 0) {
        const tx = await NFTWithSigner.requestFreeMintRandomNft(ownerAddress, quantity);
        console.log("handleStatus", 2);
        handleStatus(2)
        await tx.wait()
    } else {
        const tx = await NFTWithSigner.requestMintRandomNft(ownerAddress, quantity, group_id, { value: 1 });
        console.log("handleStatus", 2);
        handleStatus(2)
        await tx.wait()
    }

    handleStatus(3)
    console.log("handleStatus", 3);
    return true;
}

export const getNftsFromApi = async (handleStatus: (value: number) => Promise<void>) => {
    const ownerAddress = await signer.getAddress();
    /* eslint-disable no-console */
    console.log("owner?", ownerAddress)
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    const api_call = await axios.get(`https://webhooks.kingfinance.co/pendingNfts?owner=${ownerAddress}`);
    /* eslint-disable no-console */
    console.log("we?", api_call)
    const awaiting_mints = api_call.data.data.length
    if (awaiting_mints === 0) {
        console.warn("no pending mints")
        return false;
    }
    const NftToMint = []
    for (let i = 0; i < awaiting_mints; i++) {
        const _api_call = api_call.data.data[i]
        const ticket = { tokenId: _api_call.token_id, quantity: _api_call.quantity, mintNonce: _api_call.mint_nonce, owner: ownerAddress, signature: _api_call.signature }
        const signedNFT = ticket
        NftToMint.push(signedNFT)
    }
    // mint nft with ticket
    const tx = await NFTWithSigner.mintRandomNfts(NftToMint)
    console.log("handleStatus", 4);
    handleStatus(4);
    await tx.wait()
    console.log("handleStatus", 5);
    handleStatus(5);
    /* eslint-disable no-console */
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.log(`tokens ${NftToMint} minted`)
    return true;
}

// export const handleApprove = async() => {
//   const tx = await currencyContract.approve()
// }

