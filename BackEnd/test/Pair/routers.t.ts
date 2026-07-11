import { expect } from "chai";
import hre from "hardhat";

const { ethers } = await hre.network.create();

describe("Pair - Routers", function () {
    let factory: any;
    let pair: any;

    let owner: any;
    let router: any;
    let attacker: any;

    let tokenA: any;
    let tokenB: any;

    beforeEach(async function () {
        [owner, router, attacker] = await ethers.getSigners();

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


    describe("setNewRouter()", function () {

        it("should allow Factory to add router", async function () {
            await pair.setNewRouter(
                router.address
            );

            expect(
                await pair.isRouterAllowed(
                    router.address
                )
            ).to.equal(true);
        });


        it("should emit RouterUpdated when adding router", async function () {
            await expect(
                pair.setNewRouter(
                    router.address
                )
            )
            .to.emit(pair, "RouterUpdated")
            .withArgs(
                router.address,
                true
            );
        });


        it("should reject non Factory adding router", async function () {
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

    });


    describe("deleteRouter()", function () {

        beforeEach(async function () {
            await pair.setNewRouter(
                router.address
            );
        });


        it("should allow Factory to remove router", async function () {
            await pair.deleteRouter(
                router.address
            );

            expect(
                await pair.isRouterAllowed(
                    router.address
                )
            ).to.equal(false);
        });


        it("should emit RouterUpdated when removing router", async function () {
            await expect(
                pair.deleteRouter(
                    router.address
                )
            )
            .to.emit(pair, "RouterUpdated")
            .withArgs(
                router.address,
                false
            );
        });


        it("should reject non Factory removing router", async function () {
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


    describe("Router state", function () {

        it("should return false for unknown router", async function () {
            expect(
                await pair.isRouterAllowed(
                    attacker.address
                )
            ).to.equal(false);
        });


        it("should allow multiple routers", async function () {
            await pair.setNewRouter(
                router.address
            );

            await pair.setNewRouter(
                attacker.address
            );

            expect(
                await pair.isRouterAllowed(
                    router.address
                )
            ).to.equal(true);

            expect(
                await pair.isRouterAllowed(
                    attacker.address
                )
            ).to.equal(true);
        });

    });

});