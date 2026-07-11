import { expect } from "chai";
import hre from "hardhat";

const { ethers } = await hre.network.create();

describe("Router - Validation", function () {
    let factory: any;
    let router: any;
    let pair: any;

    let owner: any;
    let user: any;

    let tokenA: any;
    let tokenB: any;

    beforeEach(async function () {
        [owner, user] = await ethers.getSigners();

        factory = await ethers.deployContract("Factory");
        await factory.waitForDeployment();

        router = await ethers.deployContract("Router", [
            await factory.getAddress()
        ]);
        await router.waitForDeployment();

        tokenA = await ethers.deployContract("TestToken1", [
            "Token A",
            "TKA",
            ethers.parseEther("10000"),
            ethers.parseEther("100000")
        ]);

        tokenB = await ethers.deployContract("TestToken2", [
            "Token B",
            "TKB",
            ethers.parseEther("10000"),
            ethers.parseEther("100000")
        ]);

        await tokenA.waitForDeployment();
        await tokenB.waitForDeployment();

        await factory.createPool(
            await tokenA.getAddress(),
            await tokenB.getAddress()
        );

        const pairAddress =
            await factory.getPool(
                await tokenA.getAddress(),
                await tokenB.getAddress()
            );

        pair = await ethers.getContractAt(
            "Pair",
            pairAddress
        );

        await factory.addRouter(
            [pairAddress],
            await router.getAddress()
        );
    });


    describe("addLiquidity validation", function () {

        it("should reject zero address token", async function () {
            await expect(
                router.connect(user).addLiquidity(
                    ethers.ZeroAddress,
                    await tokenB.getAddress(),
                    ethers.parseEther("10"),
                    ethers.parseEther("10")
                )
            )
            .to.be.reverted;
        });


        it("should reject without token approval", async function () {
            await tokenA.transfer(
                user.address,
                ethers.parseEther("100")
            );

            await tokenB.transfer(
                user.address,
                ethers.parseEther("100")
            );

            await expect(
                router.connect(user).addLiquidity(
                    await tokenA.getAddress(),
                    await tokenB.getAddress(),
                    ethers.parseEther("10"),
                    ethers.parseEther("10")
                )
            )
            .to.be.reverted;
        });


        it("should reject insufficient token balance", async function () {
            await tokenA.connect(user).approve(
                await router.getAddress(),
                ethers.parseEther("100")
            );

            await tokenB.connect(user).approve(
                await router.getAddress(),
                ethers.parseEther("100")
            );

            await expect(
                router.connect(user).addLiquidity(
                    await tokenA.getAddress(),
                    await tokenB.getAddress(),
                    ethers.parseEther("100"),
                    ethers.parseEther("100")
                )
            )
            .to.be.reverted;
        });

    });


    describe("removeLiquidity validation", function () {

        it("should reject zero LP shares", async function () {
            await expect(
                router.connect(user).removeLiquidity(
                    await tokenA.getAddress(),
                    await tokenB.getAddress(),
                    0
                )
            )
            .to.be.reverted;
        });


        it("should reject removing without LP approval", async function () {
            await tokenA.transfer(
                user.address,
                ethers.parseEther("100")
            );

            await tokenB.transfer(
                user.address,
                ethers.parseEther("100")
            );

            await tokenA.connect(user).approve(
                await router.getAddress(),
                ethers.parseEther("100")
            );

            await tokenB.connect(user).approve(
                await router.getAddress(),
                ethers.parseEther("100")
            );

            await router.connect(user).addLiquidity(
                await tokenA.getAddress(),
                await tokenB.getAddress(),
                ethers.parseEther("100"),
                ethers.parseEther("100")
            );

            const shares =
                await pair.balanceOf(
                    user.address
                );

            await expect(
                router.connect(user).removeLiquidity(
                    await tokenA.getAddress(),
                    await tokenB.getAddress(),
                    shares
                )
            )
            .to.be.reverted;
        });

    });


    describe("swap validation", function () {

        beforeEach(async function () {
            await tokenA.transfer(
                user.address,
                ethers.parseEther("100")
            );

            await tokenB.transfer(
                user.address,
                ethers.parseEther("100")
            );
        });


        it("should reject zero recipient", async function () {
            await expect(
                router.connect(user).swapExactTokensForTokens(
                    await tokenA.getAddress(),
                    await tokenB.getAddress(),
                    ethers.parseEther("10"),
                    0,
                    ethers.ZeroAddress
                )
            )
            .to.be.reverted;
        });


        it("should reject swap without approval", async function () {
            await expect(
                router.connect(user).swapExactTokensForTokens(
                    await tokenA.getAddress(),
                    await tokenB.getAddress(),
                    ethers.parseEther("10"),
                    0,
                    user.address
                )
            )
            .to.be.reverted;
        });


        it("should reject swap amount greater than balance", async function () {
            await tokenA.connect(user).approve(
                await router.getAddress(),
                ethers.parseEther("1000")
            );

            await expect(
                router.connect(user).swapExactTokensForTokens(
                    await tokenA.getAddress(),
                    await tokenB.getAddress(),
                    ethers.parseEther("1000"),
                    0,
                    user.address
                )
            )
            .to.be.reverted;
        });

    });

});