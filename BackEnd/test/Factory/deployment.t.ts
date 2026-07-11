import { expect } from "chai";
import hre from "hardhat"; // Hardhat Runtime Environment

const { ethers, networkHelpers } = await hre.network.create(); // Creates a new local simulation of an Ethreum blockchain, it returns an object
                                                               // with an instance of ethers, and networkHelpers connected to the simulation

describe("Factory - Deployment", function () {
    let factory: any;
    let owner: any;
    let addr1: any;

    beforeEach(async function () {
        [owner, addr1] = await ethers.getSigners(); // This will return the provided test addresses by the local blockchain

        factory = await ethers.deployContract("Factory"); // Deploying the contract, Hardhat framework manage to find it

        await factory.waitForDeployment(); // Waiting for deployment completion
    });

    describe("Constructor", function () {
        it("should deploy successfully", async function () {
            expect(await factory.getAddress()).to.not.equal(
                ethers.ZeroAddress
            );
        });

        it("should set the deployer as owner", async function () {
            expect(await factory.owner()).to.equal(owner.address);
        });

        it("should have zero pools initially", async function () {
            expect(await factory.allPoolsLength()).to.equal(0);
        });

        it("should return an empty pools array initially", async function () {
            const pools = await factory.getPools();

            expect(pools.length).to.equal(0);
        });
    });
});