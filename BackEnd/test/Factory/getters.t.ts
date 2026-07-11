import { expect } from "chai";
import hre from "hardhat";

const { ethers } = await hre.network.create();

describe("Factory - Getters", function () {
    let factory: any;
    let tokenA: any;
    let tokenB: any;
    let tokenC: any;

    beforeEach(async function () {
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

    describe("getPool()", function () {
        it("should return zero address when pool does not exist", async function () {
            const pool = await factory.getPool(
                await tokenA.getAddress(),
                await tokenB.getAddress()
            );

            expect(pool).to.equal(
                ethers.ZeroAddress
            );
        });

        it("should return the correct Pair address", async function () {
            await factory.createPool(
                await tokenA.getAddress(),
                await tokenB.getAddress()
            );

            const pool = await factory.getPool(
                await tokenA.getAddress(),
                await tokenB.getAddress()
            );

            expect(pool).to.not.equal(
                ethers.ZeroAddress
            );

            const pools = await factory.getPools();

            expect(pool).to.equal(
                pools[0]
            );
        });

        it("should return the same pool regardless of token order", async function () {
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

    });

    describe("getPools()", function () {
        it("should return empty array initially", async function () {
            const pools = await factory.getPools();

            expect(pools.length).to.equal(0);
        });

        it("should return all created pools", async function () {
            await factory.createPool(
                await tokenA.getAddress(),
                await tokenB.getAddress()
            );

            await factory.createPool(
                await tokenA.getAddress(),
                await tokenC.getAddress()
            );

            const pools = await factory.getPools();

            expect(pools.length).to.equal(2);

            expect(
                pools[0]
            ).to.not.equal(
                ethers.ZeroAddress
            );

            expect(
                pools[1]
            ).to.not.equal(
                ethers.ZeroAddress
            );
        });

        it("should preserve pool creation order", async function () {
            await factory.createPool(
                await tokenA.getAddress(),
                await tokenB.getAddress()
            );

            await factory.createPool(
                await tokenB.getAddress(),
                await tokenC.getAddress()
            );

            const pools = await factory.getPools();

            const firstPool =
                await factory.getPool(
                    await tokenA.getAddress(),
                    await tokenB.getAddress()
                );

            const secondPool =
                await factory.getPool(
                    await tokenB.getAddress(),
                    await tokenC.getAddress()
                );

            expect(
                pools[0]
            ).to.equal(
                firstPool
            );

            expect(
                pools[1]
            ).to.equal(
                secondPool
            );
        });
    });

    describe("allPoolsLength()", function () {
        it("should return zero initially", async function () {
            expect(
                await factory.allPoolsLength()
            ).to.equal(0);
        });

        it("should return correct pool count", async function () {
            await factory.createPool(
                await tokenA.getAddress(),
                await tokenB.getAddress()
            );

            expect(
                await factory.allPoolsLength()
            ).to.equal(1);

            await factory.createPool(
                await tokenA.getAddress(),
                await tokenC.getAddress()
            );

            expect(
                await factory.allPoolsLength()
            ).to.equal(2);

        });

    });

});