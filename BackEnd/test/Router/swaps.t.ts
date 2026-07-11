import { expect } from "chai";
import hre from "hardhat";

const { ethers } = await hre.network.create();

describe("Router - Swaps", function () {
    let factory: any;
    let router: any;
    let pair: any;

    let owner: any;
    let user: any;
    let liquidityProvider: any;

    let tokenA: any;
    let tokenB: any;

    beforeEach(async function () {
        [owner, user, liquidityProvider] = await ethers.getSigners();

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
            await router.getAddress()
        );

        await tokenA.transfer(
            liquidityProvider.address,
            ethers.parseEther("3000")
        );

        await tokenB.transfer(
            liquidityProvider.address,
            ethers.parseEther("3000")
        );

        await tokenA.connect(liquidityProvider).approve(
            await router.getAddress(),
            ethers.parseEther("2000")
        );

        await tokenB.connect(liquidityProvider).approve(
            await router.getAddress(),
            ethers.parseEther("2000")
        );

        await router.connect(liquidityProvider).addLiquidity(
            await tokenA.getAddress(),
            await tokenB.getAddress(),
            ethers.parseEther("1000"),
            ethers.parseEther("2000")
        );

        await tokenA.transfer(
            user.address,
            ethers.parseEther("100")
        );

        await tokenB.transfer(
            user.address,
            ethers.parseEther("100")
        );

        await tokenA.connect(user).approve(
            await pair.getAddress(),
            ethers.parseEther("200")
        );

        await tokenB.connect(user).approve(
            await pair.getAddress(),
            ethers.parseEther("200")
        );

        await tokenA.connect(user).approve(
            await router.getAddress(),
            ethers.parseEther("200")
        );

        await tokenB.connect(user).approve(
            await router.getAddress(),
            ethers.parseEther("200")
        );
    });


    describe("swapExactTokensForTokens()", function () {
        it("should swap tokenA for tokenB", async function () {
            const before0 = await tokenA.balanceOf(
                    user.address
                );
            console.log("before token A: ", ethers.formatEther(before0));

            const before = await tokenB.balanceOf(
                    user.address
                );
            console.log("before token B: ", ethers.formatEther(before));

            await router.connect(user).swapExactTokensForTokens(
                await tokenA.getAddress(),
                await tokenB.getAddress(),
                ethers.parseEther("100"),
                0,
                user.address
            );

            const after0 = await tokenA.balanceOf(
                    user.address
                );
            console.log("after tokenA: ", ethers.formatEther(after0));
            const after = await tokenB.balanceOf(
                    user.address
                );
            console.log("after tokenB: ", ethers.formatEther(after));

            expect(after).to.be.gt(before);
        });


        it("should swap tokenB for tokenA", async function () {
            const before = await tokenA.balanceOf(
                    user.address
                );

            await router.connect(user).swapExactTokensForTokens(
                await tokenB.getAddress(),
                await tokenA.getAddress(),
                ethers.parseEther("100"),
                0,
                user.address
            );

            const after = await tokenA.balanceOf(
                    user.address
                );
            console.log("47 after: ", ethers.formatEther(after))

            expect(after).to.be.gt(before);
        });


        it("should send tokens to recipient", async function () {
            const recipient = owner.address;

            const before = await tokenB.balanceOf(
                    recipient
                );

            await router.connect(user).swapExactTokensForTokens(
                await tokenA.getAddress(),
                await tokenB.getAddress(),
                ethers.parseEther("10"),
                0,
                recipient
            );

            const after = await tokenB.balanceOf(
                    recipient
                );

            expect(after).to.be.gt(before);
        });

        it("should reject identical tokens", async function () {
            await expect(
                router.connect(user).swapExactTokensForTokens(
                    await tokenA.getAddress(),
                    await tokenA.getAddress(),
                    ethers.parseEther("10"),
                    0,
                    user.address
                )
            )
            .to.be.revertedWith(
                "Identical tokens"
            );
        });

        it("should reject zero amount", async function () {
            await expect(
                router.connect(user).swapExactTokensForTokens(
                    await tokenA.getAddress(),
                    await tokenB.getAddress(),
                    0,
                    0,
                    user.address
                )
            )
            .to.be.revertedWith(
                "The amount entered has to be greater than 0"
            );
        });


        it("should reject non existing pool", async function () {
            const tokenC = await ethers.deployContract("TestToken1", [
                "Token C",
                "TKC",
                ethers.parseEther("1000"),
                ethers.parseEther("10000")
            ]);

            await tokenC.waitForDeployment();

            await expect(
                router.connect(user).swapExactTokensForTokens(
                    await tokenA.getAddress(),
                    await tokenC.getAddress(),
                    ethers.parseEther("10"),
                    0,
                    user.address
                )
            )
            .to.be.revertedWith(
                "There is no pool of these tokens"
            );
        });


        /* it("should reject high slippage requirement", async function () {
            await expect(
                router.connect(user).swapExactTokensForTokens(
                    await tokenA.getAddress(),
                    await tokenB.getAddress(),
                    ethers.parseEther("10"),
                    ethers.parseEther("100000"),
                    user.address
                )
            )
            .to.be.reverted;
        }); */

    });

});