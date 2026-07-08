import { expect } from "chai";
import hre from "hardhat"; // Hardhat Runtime Environment

const { ethers, networkHelpers } = await hre.network.create(); // Creates a new local simulation of an Ethreum blockchain, it returns an object
// with an instance of ethers, and networkHelpers connected to the simulation

describe("TestToken1", function () {
    let token: any;
    let owner: any;
    let addr1: any;
    let addr2: any;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        token = await ethers.deployContract("TestToken1", [
            "TestToken1",
            "TT1",
            ethers.parseEther("1000000"),
            ethers.parseEther("10000000")
        ]);

        await token.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the correct name", async function () {
            expect(await token.name()).to.equal("TestToken1");
        });

        it("Should set the correct symbol", async function () {
            expect(await token.symbol()).to.equal("TT1");
        });

        it("Should assign the total supply to the owner", async function () {
            const totalSupply = await token.totalSupply();
            expect(await token.balanceOf(owner.address)).to.equal(totalSupply);
        });
    });

    /* describe("Transfers", function () {
        it("Should transfer tokens between accounts", async function () {
            const amount = ethers.parseEther("100");

            await token.transfer(addr1.address, amount);

            expect(await token.balanceOf(addr1.address)).to.equal(amount);
        });

        it("Should emit a Transfer event", async function () {
            const amount = ethers.parseEther("50");

            await expect(token.transfer(addr1.address, amount))
                .to.emit(token, "Transfer")
                .withArgs(owner.address, addr1.address, amount);
        });

        it("Should fail if sender has insufficient balance", async function () {
            const amount = ethers.parseEther("100");

            await expect(
                token.connect(addr1).transfer(owner.address, amount)
            ).to.be.reverted;
        });
    });

    describe("Approvals", function () {
        it("Should approve tokens", async function () {
            const amount = ethers.parseEther("200");

            await token.approve(addr1.address, amount);

            expect(
                await token.allowance(owner.address, addr1.address)
            ).to.equal(amount);
        });

        it("Should emit Approval event", async function () {
            const amount = ethers.parseEther("200");

            await expect(token.approve(addr1.address, amount))
                .to.emit(token, "Approval")
                .withArgs(owner.address, addr1.address, amount);
        });
    });

    describe("transferFrom", function () {
        it("Should transfer using allowance", async function () {
            const amount = ethers.parseEther("100");

            await token.approve(addr1.address, amount);

            await token
                .connect(addr1)
                .transferFrom(owner.address, addr2.address, amount);

            expect(await token.balanceOf(addr2.address)).to.equal(amount);

            expect(
                await token.allowance(owner.address, addr1.address)
            ).to.equal(0);
        });

        it("Should fail without enough allowance", async function () {
            const amount = ethers.parseEther("100");

            await expect(
                token
                    .connect(addr1)
                    .transferFrom(owner.address, addr2.address, amount)
            ).to.be.reverted;
        });
    }); */
});