import { expect } from "chai";
import hre from "hardhat";

const { ethers } = await hre.network.create();

describe("Router - Add Liquidity", function () {
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
    });

    describe("addLiquidity()", function () {

        it("should add liquidity through Router", async function () {
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

            expect(
                await pair.balanceOf(user.address)
            ).to.be.gt(0);
        });


        it("should increase pair reserves", async function () {
            await tokenA.connect(user).approve(
                await router.getAddress(),
                ethers.parseEther("100")
            );

            await tokenB.connect(user).approve(
                await router.getAddress(),
                ethers.parseEther("200")
            );

            await router.connect(user).addLiquidity(
                await tokenA.getAddress(),
                await tokenB.getAddress(),
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


        it("should reject identical tokens", async function () {
            await expect(
                router.connect(user).addLiquidity(
                    await tokenA.getAddress(),
                    await tokenA.getAddress(),
                    ethers.parseEther("10"),
                    ethers.parseEther("10")
                )
            )
            .to.be.revertedWith(
                "Identical tokens"
            );
        });


        it("should reject zero amount", async function () {
            await expect(
                router.connect(user).addLiquidity(
                    await tokenA.getAddress(),
                    await tokenB.getAddress(),
                    0,
                    ethers.parseEther("10")
                )
            )
            .to.be.revertedWith(
                "Zero amount"
            );
        });


        it("should reject when pool does not exist", async function () {
            const tokenC = await ethers.deployContract("TestToken1", [
                "Token C",
                "TKC",
                ethers.parseEther("1000"),
                ethers.parseEther("10000")
            ]);

            await tokenC.waitForDeployment();

            await expect(
                router.connect(user).addLiquidity(
                    await tokenA.getAddress(),
                    await tokenC.getAddress(),
                    ethers.parseEther("10"),
                    ethers.parseEther("10")
                )
            )
            .to.be.revertedWith(
                "There is no pool of these tokens"
            );
        });


        it("should fail without token approval", async function () {
            await expect(
                router.connect(user).addLiquidity(
                    await tokenA.getAddress(),
                    await tokenB.getAddress(),
                    ethers.parseEther("100"),
                    ethers.parseEther("100")
                )
            ).to.be.revertedWithCustomError(pair,
                "ERC20InsufficientAllowance"
            );
        });

    });
});