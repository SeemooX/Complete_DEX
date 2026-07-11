import { expect } from "chai";
import hre from "hardhat";

const { ethers } = await hre.network.create();

describe("Factory - createPool", function () {
    let factory: any;
    let owner: any;
    let tokenA: any;
    let tokenB: any;
    let tokenC: any;

    beforeEach(async function () {
        [owner] = await ethers.getSigners();

        factory = await ethers.deployContract("Factory");
        await factory.waitForDeployment();

        tokenA = await ethers.deployContract("TestToken1", [
            "Token A",
            "TKA",
            ethers.parseEther("1000"),
            ethers.parseEther("10000"),
        ]);

        tokenB = await ethers.deployContract("TestToken1", [
            "Token B",
            "TKB",
            ethers.parseEther("1000"),
            ethers.parseEther("10000"),
        ]);

        tokenC = await ethers.deployContract("TestToken1", [
            "Token C",
            "TKC",
            ethers.parseEther("1000"),
            ethers.parseEther("10000"),
        ]);

        await Promise.all([
            tokenA.waitForDeployment(),
            tokenB.waitForDeployment(),
            tokenC.waitForDeployment(),
        ]);
    });

    describe("Success cases", function () {
        it("should create a new pool", async function () {
            const poolAddress = await factory.createPool(
                await tokenA.getAddress(),
                await tokenB.getAddress()
            );

            const pools = await factory.getPools();

            console.log("Pool in stored in the factory: ", pools[0]);
            expect(pools[0]).to.not.equal(
                ethers.ZeroAddress
            );
        });

        it("should initialize Pair with sorted token addresses", async function () {
            await factory.createPool(
                await tokenB.getAddress(),
                await tokenA.getAddress()
            );

            const pairAddress = await factory.getPool(
                await tokenA.getAddress(),
                await tokenB.getAddress()
            );

            // Associate the pair ABI with the pair already deployed contract so we could interact with it
            const pair = await ethers.getContractAt(
                "Pair",
                pairAddress
            );

            const token0 = await pair.getToken0();
            const token1 = await pair.getToken1();

            expect(token0 < token1).to.equal(true);

            // deep i used to compare the arrays content, not the reference
            expect(
                [token0, token1]
            ).to.deep.equal(
                [
                    await tokenA.getAddress(),
                    await tokenB.getAddress()
                ].sort()
            );
        });


        it("should store pool in both token directions", async function () {
            await factory.createPool(
                await tokenA.getAddress(),
                await tokenB.getAddress()
            );

            const pool1 = await factory.getPool(
                await tokenA.getAddress(),
                await tokenB.getAddress()
            );

            const pool2 = await factory.getPool(
                await tokenB.getAddress(),
                await tokenA.getAddress()
            );

            expect(pool1).to.equal(pool2);
        });

        it("should increase pool length after creation", async function () {
            await factory.createPool(
                await tokenA.getAddress(),
                await tokenB.getAddress()
            );

            expect(
                await factory.allPoolsLength()
            ).to.equal(1);
        });

        it("should emit PoolCreated event", async function () {
            await expect(
                factory.createPool(
                    await tokenA.getAddress(),
                    await tokenB.getAddress()
                )
            )
            .to.emit(factory, "PoolCreated");
        });

    });

    describe("Failure cases", function () {
        it("should revert when token0 is zero address", async function () {
            await expect(
                factory.createPool(
                    ethers.ZeroAddress,
                    await tokenB.getAddress()
                )
            )
            .to.be.revertedWithCustomError(
                factory,
                "ZeroAddress"
            );
        });

        it("should revert when token1 is zero address", async function () {

            await expect(
                factory.createPool(
                    await tokenA.getAddress(),
                    ethers.ZeroAddress
                )
            )
            .to.be.revertedWithCustomError(
                factory,
                "ZeroAddress"
            );
        });

        it("should revert when tokens are identical", async function () {
            await expect(
                factory.createPool(
                    await tokenA.getAddress(),
                    await tokenA.getAddress()
                )
            )
            .to.be.revertedWithCustomError(
                factory,
                "IdenticalAddresses"
            );
        });

        it("should revert when pool already exists", async function () {
            await factory.createPool(
                await tokenA.getAddress(),
                await tokenB.getAddress()
            );

            await expect(
                factory.createPool(
                    await tokenA.getAddress(),
                    await tokenB.getAddress()
                )
            )
            .to.be.revertedWithCustomError(
                factory,
                "PoolAlreadyExists"
            );
        });

        it("should revert when pool exists with reversed token order", async function () {
            await factory.createPool(
                await tokenA.getAddress(),
                await tokenB.getAddress()
            );

            await expect(
                factory.createPool(
                    await tokenB.getAddress(),
                    await tokenA.getAddress()
                )
            )
            .to.be.revertedWithCustomError(
                factory,
                "PoolAlreadyExists"
            );
        });

    });

});