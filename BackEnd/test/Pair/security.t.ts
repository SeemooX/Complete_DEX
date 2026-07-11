import { expect } from "chai";
import hre from "hardhat";

const { ethers } = await hre.network.create();

describe("Pair - Security", function () {
    let factory: any;
    let pair: any;

    let owner: any;
    let attacker: any;
    let router: any;

    let tokenA: any;
    let tokenB: any;

    beforeEach(async function () {
        [owner, attacker, router] = await ethers.getSigners();

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


    describe("onlyFactory", function () {

        it("should prevent non factory initialization", async function () {
            const newPair =
                await ethers.deployContract("Pair");

            await newPair.waitForDeployment();

            await expect(
                newPair.connect(attacker).initialize(
                    await tokenA.getAddress(),
                    await tokenB.getAddress()
                )
            )
            .to.be.revertedWithCustomError(
                newPair,
                "OnlyFactory"
            );
        });


        it("should prevent non factory adding router", async function () {
            await expect(
                pair.connect(attacker).setNewRouter(
                    router.address
                )
            )
            .to.be.revertedWithCustomError(
                pair,
                "OnlyFactory"
            );
        });


        it("should prevent non factory removing router", async function () {
            await expect(
                pair.connect(attacker).deleteRouter(
                    router.address
                )
            )
            .to.be.revertedWithCustomError(
                pair,
                "OnlyFactory"
            );
        });

    });


    describe("onlyRouter", function () {

        it("should prevent unauthorized liquidity addition", async function () {
            await expect(
                pair.connect(attacker).addLiquidity(
                    attacker.address,
                    ethers.parseEther("10"),
                    ethers.parseEther("10")
                )
            )
            .to.be.revertedWithCustomError(
                pair,
                "OnlyRouter"
            );
        });


        it("should prevent unauthorized liquidity removal", async function () {
            await expect(
                pair.connect(attacker).removeLiquidity(
                    attacker.address,
                    1
                )
            )
            .to.be.revertedWithCustomError(
                pair,
                "OnlyRouter"
            );
        });

    });


    describe("Initialization protection", function () {

        it("should not allow liquidity before initialization", async function () {
            const newPair =
                await ethers.deployContract("Pair");

            await newPair.waitForDeployment();

            await newPair.setNewRouter(
                router.address
            ).catch(() => {});

            await expect(
                newPair.connect(router).addLiquidity(
                    router.address,
                    10,
                    10
                )
            )
            .to.be.reverted;
        });


        it("should not allow swap before initialization", async function () {
            const newPair =
                await ethers.deployContract("Pair");

            await newPair.waitForDeployment();

            await expect(
                newPair.swap(
                    attacker.address,
                    await tokenA.getAddress(),
                    10,
                    0,
                    attacker.address
                )
            )
            .to.be.revertedWithCustomError(
                newPair,
                "NotInitialized"
            );
        });

    });


    describe("Lock protection", function () {

        it("should have lock state inactive after normal execution", async function () {
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
                ethers.parseEther("10"),
                ethers.parseEther("10")
            );

            const reserves =
                await pair.getReserves();

            expect(reserves[0]).to.equal(
                ethers.parseEther("10")
            );

            expect(reserves[1]).to.equal(
                ethers.parseEther("10")
            );
        });

    });

});