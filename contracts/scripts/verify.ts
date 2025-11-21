import { run } from "hardhat/config";

/**
 * Verification script for RailPay contracts on Etherscan
 * 
 * Usage:
 *   npx hardhat run scripts/verify.ts --network sepolia
 * 
 * Or verify individual contracts:
 *   npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
 */

async function main() {
  console.log("Contract Verification Helper\n");
  console.log("To verify contracts on Etherscan, use the following commands:\n");

  const contracts = {
    RailPayIdentity: {
      address: "0xC87333Cd6A1A9ce85d90acA1D7157a7DF80717F8",
      constructorArgs: ["0x68A643D905107728853AC4E66934e2B75adDED39"], // deployer address
    },
    RailPayReceipt: {
      address: "0x4F2c946bf2ED890Df80f03396b1Fe9fe97d7C4A6",
      constructorArgs: [], // no constructor args
    },
    RailPayTicket: {
      address: "0x0eC2b764f34bfB904E175c120B16613E06054766",
      constructorArgs: ["0x68A643D905107728853AC4E66934e2B75adDED39"], // deployer address
    },
    RailPassSubscription: {
      address: "0x0953B0c46a68adC2830544e884bd91a8354BcBD0",
      constructorArgs: ["0x68A643D905107728853AC4E66934e2B75adDED39"], // deployer address
    },
    RailPayPayments: {
      address: "0xB3c9aB15029d230e3f6c1ccAbb5CBADebC4498d8",
      constructorArgs: [
        "0x68A643D905107728853AC4E66934e2B75adDED39", // operator wallet
        "0x4F2c946bf2ED890Df80f03396b1Fe9fe97d7C4A6", // receipt contract address
      ],
    },
  };

  console.log("1. RailPayIdentity:");
  console.log(
    `   npx hardhat verify --network sepolia ${contracts.RailPayIdentity.address} ${contracts.RailPayIdentity.constructorArgs.join(" ")}\n`
  );

  console.log("2. RailPayReceipt:");
  console.log(
    `   npx hardhat verify --network sepolia ${contracts.RailPayReceipt.address}\n`
  );

  console.log("3. RailPayTicket:");
  console.log(
    `   npx hardhat verify --network sepolia ${contracts.RailPayTicket.address} ${contracts.RailPayTicket.constructorArgs.join(" ")}\n`
  );

  console.log("4. RailPassSubscription:");
  console.log(
    `   npx hardhat verify --network sepolia ${contracts.RailPassSubscription.address} ${contracts.RailPassSubscription.constructorArgs.join(" ")}\n`
  );

  console.log("5. RailPayPayments:");
  console.log(
    `   npx hardhat verify --network sepolia ${contracts.RailPayPayments.address} ${contracts.RailPayPayments.constructorArgs.join(" ")}\n`
  );

  console.log("Note: Make sure ETHERSCAN_API_KEY is set in your .env file");
  console.log("Get your API key from: https://etherscan.io/apis");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

