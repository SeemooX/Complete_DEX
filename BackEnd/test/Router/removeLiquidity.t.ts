import { expect } from "chai";
import hre from "hardhat";

const { ethers } = await hre.network.create();

describe("Router - Remove Liquidity", function () {
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
            user.address,
            ethers.parseEther("1000")
        );

        await tokenB.transfer(
            user.address,
            ethers.parseEther("1000")
        );

        await tokenA.connect(user).approve(
            await router.getAddress(),
            ethers.parseEther("1000")
        );

        await tokenB.connect(user).approve(
            await router.getAddress(),
            ethers.parseEther("1000")
        );

        await router.connect(user).addLiquidity(
            await tokenA.getAddress(),
            await tokenB.getAddress(),
            ethers.parseEther("100"),
            ethers.parseEther("100")
        );

        await pair.connect(user).approve(
            await router.getAddress(),
            await pair.balanceOf(user.address)
        );
    });


    describe("removeLiquidity()", function () {
        it("should remove liquidity through Router", async function () {
            const shares = await pair.balanceOf(user.address);
            console.log("shares here: ", shares);

            await router.connect(user).removeLiquidity(
                await tokenA.getAddress(),
                await tokenB.getAddress(),
                shares
            );

            const sharesafter = await pair.balanceOf(user.address);
            console.log("shares after here: ", sharesafter);

            expect(
                await pair.balanceOf(user.address)
            ).to.equal(0);
        });

        it("should return tokens to user", async function () {
            const tokenABefore = await tokenA.balanceOf(user.address);
            console.log("token A before: ", tokenABefore)

            const tokenBBefore = await tokenB.balanceOf(user.address);
            console.log("token B before: ", tokenBBefore)

            const shares = await pair.balanceOf(user.address);

            await router.connect(user).removeLiquidity(
                await tokenA.getAddress(),
                await tokenB.getAddress(),
                shares
            );

            const tokenAAfter = await tokenA.balanceOf(user.address);
            console.log("token A after: ", tokenBBefore)

            const tokenBAfter = await tokenB.balanceOf(user.address);
            console.log("token B AFTER: ", tokenBBefore)

            expect(tokenAAfter).to.be.gt(
                tokenABefore
            );

            expect(tokenBAfter).to.be.gt(
                tokenBBefore
            );
        });


        it("should update reserves after removing liquidity", async function () {
            const shares = await pair.balanceOf(user.address);
            
            const reserves0 = await pair.getReserves();
            console.log("reserves before: ", reserves0);

            await router.connect(user).removeLiquidity(
                await tokenA.getAddress(),
                await tokenB.getAddress(),
                shares
            );

            const reserves = await pair.getReserves();
            console.log("reserves: ", reserves);

            expect(reserves[0]).to.equal(0);
            expect(reserves[1]).to.equal(0);
        });


        it("should reject identical tokens", async function () {
            await expect(
                router.connect(user).removeLiquidity(
                    await tokenA.getAddress(),
                    await tokenA.getAddress(),
                    1
                )
            )
            .to.be.revertedWith(
                "Identical tokens"
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
                router.connect(user).removeLiquidity(
                    await tokenA.getAddress(),
                    await tokenC.getAddress(),
                    1
                )
            )
            .to.be.revertedWith(
                "There is no pool of these tokens"
            );
        });


        it("should reject insufficient LP shares", async function () {
            await expect(
                router.connect(user).removeLiquidity(
                    await tokenA.getAddress(),
                    await tokenB.getAddress(),
                    ethers.parseEther("999999")
                )
            )
            .to.be.revertedWithCustomError(pair, "InsufficientBalance");
        });

    });

});