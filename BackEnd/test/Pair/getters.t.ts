import { expect } from "chai";
import hre from "hardhat";

const { ethers } = await hre.network.create();

describe("Pair - Getters", function () {
    let factory: any;
    let pair: any;

    let owner: any;
    let router: any;

    let tokenA: any;
    let tokenB: any;

    beforeEach(async function () {
        [owner, router] = await ethers.getSigners();

        factory = await ethers.deployContract("Factory");
        await factory.waitForDeployment();

        tokenA = await ethers.deployContract("TestToken1", [
            "Token A",
            "TKA",
            ethers.parseEther("1000"),
            ethers.parseEther("10000"),
        ]);

        tokenB = await ethers.deployContract("TestToken2", [
            "Token B",
            "TKB",
            ethers.parseEther("1000"),
            ethers.parseEther("10000"),
        ]);

        await tokenA.waitForDeployment();
        await tokenB.waitForDeployment();

        await factory.createPool(
            await tokenA.getAddress(),
            await tokenB.getAddress()
        );

        const pairAddress = await factory.getPool(
            await tokenA.getAddress(),
            await tokenB.getAddress()
        );

        pair = await ethers.getContractAt(
            "Pair",
            pairAddress
        );
    });

    describe("getToken0()", function () {
        it("should return initialized token0", async function () {
            const token0 = await pair.getToken0();

            expect(token0).to.not.equal(
                ethers.ZeroAddress
            );
        });

    });

    describe("getToken1()", function () {
        it("should return initialized token1", async function () {
            const token1 = await pair.getToken1();

            expect(token1).to.not.equal(
                ethers.ZeroAddress
            );
        });

    });

    describe("Token ordering", function () {
        it("should keep tokens sorted", async function () {
            const token0 = await pair.getToken0();
            const token1 = await pair.getToken1();

            expect(
                token0 < token1
            ).to.equal(true);
        });

    });

    describe("getReserves()", function () {
        it("should start with zero reserves", async function () {
            const reserves =
                await pair.getReserves();

            expect(reserves[0]).to.equal(0);
            expect(reserves[1]).to.equal(0);
        });

        it("should update reserves after liquidity", async function () {
            await factory.addRouter(
                [await pair.getAddress()],
                router.address
            );

            await tokenA.transfer(
                router.address,
                ethers.parseEther("100")
            );

            await tokenB.transfer(
                router.address,
                ethers.parseEther("100")
            );

            await tokenA.connect(router).approve(
                await pair.getAddress(),
                ethers.parseEther("100")
            );

            await tokenB.connect(router).approve(
                await pair.getAddress(),
                ethers.parseEther("100")
            );

            await pair.connect(router).addLiquidity(
                router.address,
                ethers.parseEther("100"),
                ethers.parseEther("100")
            );

            const reserves = await pair.getReserves();            

            expect(reserves[0]).to.equal(
                ethers.parseEther("100")
            );

            expect(reserves[1]).to.equal(
                ethers.parseEther("100")
            );
        });

    });

    describe("isRouterAllowed()", function () {
        it("should return false for unknown router", async function () {
            expect(
                await pair.isRouterAllowed(
                    router.address
                )
            ).to.equal(false);
        });

        it("should return true after adding router", async function () {
            await factory.addRouter(
                [await pair.getAddress()],
                router.address
            );

            expect(
                await pair.isRouterAllowed(
                    router.address
                )
            ).to.equal(true);
        });

        it("should return false after removing router", async function () {
            await factory.addRouter(
                [await pair.getAddress()],
                router.address
            );

            await factory.removeRouter(
                [await pair.getAddress()],
                router.address
            );

            expect(
                await pair.isRouterAllowed(
                    router.address
                )
            ).to.equal(false);
        });
    });
});