import { expect } from "chai";
import hre from "hardhat";

const { ethers } = await hre.network.create();

describe("Pair - Liquidity", function () {
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

        await tokenA.transfer(
            router.address,
            ethers.parseEther("1000")
        );

        await tokenB.transfer(
            router.address,
            ethers.parseEther("1000")
        );

        await tokenA.connect(router).approve(
            pairAddress,
            ethers.parseEther("1000")
        );

        await tokenB.connect(router).approve(
            pairAddress,
            ethers.parseEther("1000")
        );
    });


    describe("addLiquidity()", function () {

        it("should allow router to add liquidity", async function () {
            await pair.connect(router).addLiquidity(
                user.address,
                ethers.parseEther("100"),
                ethers.parseEther("100")
            );

            expect(
                await pair.balanceOf(user.address)
            ).to.be.gt(0);
        });


        it("should update reserves after adding liquidity", async function () {
            await pair.connect(router).addLiquidity(
                user.address,
                ethers.parseEther("100"),
                ethers.parseEther("200")
            );

            const reserves = await pair.getReserves();

            expect(reserves[0]).to.equal(
                ethers.parseEther("100")
            );

            expect(reserves[1]).to.equal(
                ethers.parseEther("200")
            );
        });


        it("should emit LiquidityAdded", async function () {
            await expect(
                pair.connect(router).addLiquidity(
                    user.address,
                    ethers.parseEther("100"),
                    ethers.parseEther("100")
                )
            )
            .to.emit(pair, "LiquidityAdded");
        });


        it("should reject zero token amount", async function () {
            await expect(
                pair.connect(router).addLiquidity(
                    user.address,
                    0,
                    ethers.parseEther("100")
                )
            )
            .to.be.revertedWithCustomError(
                pair,
                "InvalidAmount"
            );
        });


        it("should reject zero recipient", async function () {
            await expect(
                pair.connect(router).addLiquidity(
                    ethers.ZeroAddress,
                    ethers.parseEther("100"),
                    ethers.parseEther("100")
                )
            )
            .to.be.revertedWithCustomError(
                pair,
                "ZeroAddress"
            );
        });


        it("should reject non-router liquidity provider", async function () {
            await expect(
                pair.connect(user).addLiquidity(
                    user.address,
                    ethers.parseEther("100"),
                    ethers.parseEther("100")
                )
            )
            .to.be.revertedWithCustomError(
                pair,
                "OnlyRouter"
            );
        });

    });


    describe("removeLiquidity()", function () {

        beforeEach(async function () {
            await pair.connect(router).addLiquidity(
                user.address,
                ethers.parseEther("100"),
                ethers.parseEther("100")
            );

            await pair.connect(user).approve(
                await pair.getAddress(),
                await pair.balanceOf(user.address)
            );
        });


        it("should remove liquidity", async function () {
            const shares = await pair.balanceOf(
                user.address
            );

            await pair.connect(router).removeLiquidity(
                user.address,
                shares
            );

            expect(
                await pair.balanceOf(user.address)
            ).to.equal(0);
        });


        it("should burn LP tokens", async function () {
            const shares = await pair.balanceOf(
                user.address
            );

            const supplyBefore =
                await pair.totalSupply();

            await pair.connect(router).removeLiquidity(
                user.address,
                shares
            );

            const supplyAfter =
                await pair.totalSupply();

            expect(supplyAfter).to.be.lt(
                supplyBefore
            );
        });


        it("should emit LiquidityRemoved", async function () {
            const shares = await pair.balanceOf(
                user.address
            );

            await expect(
                pair.connect(router).removeLiquidity(
                    user.address,
                    shares
                )
            )
            .to.emit(pair, "LiquidityRemoved");
        });


        it("should reject insufficient liquidity shares", async function () {
            await expect(
                pair.connect(router).removeLiquidity(
                    user.address,
                    ethers.parseEther("999999")
                )
            )
            .to.be.revertedWithCustomError(
                pair,
                "InsufficientBalance"
            );
        });


        it("should reject non-router removal", async function () {
            const shares = await pair.balanceOf(
                user.address
            );

            await expect(
                pair.connect(user).removeLiquidity(
                    user.address,
                    shares
                )
            )
            .to.be.revertedWithCustomError(
                pair,
                "OnlyRouter"
            );
        });

    });

});