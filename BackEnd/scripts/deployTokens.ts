import hre from "hardhat";

const { ethers } = await hre.network.create();

async function main() {
    const tokenName = "Token A";
    const tokenSymbol = "TKA";

    const initialSupply = ethers.parseEther("10000");
    const maxSupply = ethers.parseEther("100000");

    const Token = await ethers.getContractFactory(
        "TestToken1"
    );

    const token = await Token.deploy(
        tokenName,
        tokenSymbol,
        initialSupply,
        maxSupply
    );

    await token.waitForDeployment();

    console.log(
        "Token deployed at:",
        await token.getAddress()
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });