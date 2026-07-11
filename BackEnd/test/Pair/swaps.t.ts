import { expect } from "chai";
import hre from "hardhat";

const { ethers } = await hre.network.create();

describe("Pair - Swaps", function () {
    let factory: any;
    let pair: any;

    let owner: any;
    let router: any;
    let user: any;

    let tokenA: any;
    let tokenB: any;

    beforeEach(async function () {
        [owner, router, user] = await ethers.getSigners();

        factory = await ethers.deployContract("Factory");
        await factory.waitForDeployment();

        tokenA = await ethers.deployContract("TestToken1", [
            "Token A",
            "TKA",
            ethers.parseEther("10000"),
            ethers.parseEther("100000"),
        ]);

        tokenB = await ethers.deployContract("TestToken2", [
            "Token B",
            "TKB",
            ethers.parseEther("10000"),
            ethers.parseEther("100000"),
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

        await factory.addRouter(
            [pairAddress],
            router.address
        );

        // Give router tokens for liquidity
        await tokenA.transfer(
            router.address,
            ethers.parseEther("5000")
        );

        await tokenB.transfer(
            router.address,
            ethers.parseEther("5000")
        );

        await tokenA.connect(router).approve(
            pairAddress,
            ethers.parseEther("5000")
        );

        await tokenB.connect(router).approve(
            pairAddress,
            ethers.parseEther("5000")
        );

        // Add initial liquidity
        await pair.connect(router).addLiquidity(
            router.address,
            ethers.parseEther("1000"),
            ethers.parseEther("1000")
        );

        // Give user tokens to swap
        await tokenA.transfer(
            user.address,
            ethers.parseEther("100")
        );

        await tokenB.transfer(
            user.address,
            ethers.parseEther("100")
        );

        await tokenA.connect(user).approve(
            pairAddress,
            ethers.parseEther("100")
        );

        await tokenB.connect(user).approve(
            pairAddress,
            ethers.parseEther("100")
        );
    });


    describe("Successful swaps", function () {

        it("should swap token0 for token1", async function () {
            const token0 =
                await pair.getToken0();

            const token1 =
                await pair.getToken1();

            const beforeBalance =
                await ethers.getContractAt(
                    "TestToken1",
                    token1
                );

            await pair.connect(user).swap(
                user.address,
                token0,
                ethers.parseEther("10"),
                0,
                user.address
            );

            expect(
                await beforeBalance.balanceOf(
                    user.address
                )
            ).to.be.gt(0);
        });


        it("should swap token1 for token0", async function () {
            const token1 =
                await pair.getToken1();

            const token0 =
                await pair.getToken0();

            await pair.connect(user).swap(
                user.address,
                token1,
                ethers.parseEther("10"),
                0,
                user.address
            );

            const balance =
                await tokenA.balanceOf(
                    user.address
                );

            expect(balance).to.be.gt(0);
        });


        it("should emit SwapExecuted", async function () {
            const token0 =
                await pair.getToken0();

            await expect(
                pair.connect(user).swap(
                    user.address,
                    token0,
                    ethers.parseEther("10"),
                    0,
                    user.address
                )
            )
            .to.emit(pair, "SwapExecuted");
        });


        it("should update reserves after swap", async function () {
            const before =
                await pair.getReserves();

            const token0 =
                await pair.getToken0();

            await pair.connect(user).swap(
                user.address,
                token0,
                ethers.parseEther("10"),
                0,
                user.address
            );

            const after =
                await pair.getReserves();

            expect(
                after[0]
            ).to.not.equal(
                before[0]
            );

            expect(
                after[1]
            ).to.not.equal(
                before[1]
            );
        });

    });


    describe("Swap failures", function () {

        it("should reject invalid token", async function () {
            const fakeToken =
                ethers.Wallet.createRandom().address;

            await expect(
                pair.connect(user).swap(
                    user.address,
                    fakeToken,
                    ethers.parseEther("10"),
                    0,
                    user.address
                )
            )
            .to.be.revertedWithCustomError(
                pair,
                "InvalidToken"
            );
        });


        it("should reject zero amount", async function () {
            const token0 =
                await pair.getToken0();

            await expect(
                pair.connect(user).swap(
                    user.address,
                    token0,
                    0,
                    0,
                    user.address
                )
            )
            .to.be.revertedWithCustomError(
                pair,
                "InvalidAmount"
            );
        });


        it("should reject zero recipient", async function () {
            const token0 =
                await pair.getToken0();

            await expect(
                pair.connect(user).swap(
                    user.address,
                    token0,
                    ethers.parseEther("10"),
                    0,
                    ethers.ZeroAddress
                )
            )
            .to.be.revertedWithCustomError(
                pair,
                "ZeroAddress"
            );
        });


        it("should reject excessive slippage", async function () {
            const token0 =
                await pair.getToken0();

            await expect(
                pair.connect(user).swap(
                    user.address,
                    token0,
                    ethers.parseEther("10"),
                    ethers.parseEther("100000"),
                    user.address
                )
            )
            .to.be.revertedWithCustomError(
                pair,
                "SlippageExceeded"
            );
        });


        it("should reject swap when liquidity is insufficient", async function () {
            const token0 =
                await pair.getToken0();

            await expect(
                pair.connect(user).swap(
                    user.address,
                    token0,
                    ethers.parseEther("1000000"),
                    0,
                    user.address
                )
            )
            .to.be.reverted;
        });

    });

});