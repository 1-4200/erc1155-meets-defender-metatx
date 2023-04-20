# erc1155-meets-defender-metatx

This is a sample project to demonstrate how to use [Defender MetaTx](https://www.openzeppelin.com/defender) to interact with an ERC1155LazyMint contract.

Since the purpose of this repository is for technical verification, it requires many changes necessary for production, such as strict type definitions and proper error handling etc.

## Usage

### Pre Requisites

#### Node version

Either make sure you're running a version of node compliant with the engines requirement in package.json, or install Node Version Manager nvm(or nodenv) and run nvm(or nodenv) use to use the correct version of node.

#### Setup

Before running any command, you need to create a `.env` file and set the required values

```shell
cp .env.example .env
```

Then, proceed with installing dependencies:

```sh
yarn install
```

### Deploy
To deploy contracts, run the following commands:

```shell
npx hardhat run scripts/deploy.ts --network <network>
```

### Redeem NFT

**Note:** Manage redeem details with `.env` values

To redeem NFT, run the following commands:
```sh
npx hardhat run scripts/redeem.ts --network <network>
```
Generate a file with signatures and request data to be passed to RELAYER_URL. 
The file will be saved in `./scripts_out` directory in default.

```shell
npx hardhat run scripts/run_redeem.ts --network <network>
```

Pass the signature and request created above to the relayer, and if there are no problems with the validation, execute the request.

### Transfer NFT
**Note:** Manage transfer details with `.env` values

To transfer NFT, run the following commands:

```shell
npx hardhat run scripts/transfer.ts --network <network>
```

```shell
npx hardhat run scripts/run_transfer.ts --network <network>
```

### Verify
To verify the created signature for verification, run the following command: 
```shell
npx hardhat run scripts/verify.ts --network <network>
```