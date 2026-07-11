import { expect } from "chai";
import hre from "hardhat";

const { ethers } = await hre.network.create();

describe("Factory - Routers", function () {
    let factory: any;

    let owner: any;
    let router: any;
    let attacker: any;

    let tokenA: any;
    let tokenB: any;
    let tokenC: any;

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

    async function createOnePool() {
        await factory.createPool(
            await tokenA.getAddress(),
            await tokenB.getAddress()
        );

        return await factory.getPool(
            await tokenA.getAddress(),
            await tokenB.getAddress()
        );
    }

    describe("addRouter()", function () {
        it("should allow owner to add router", async function () {
            const pool = await createOnePool();

            await factory.addRouter(
                [pool],
                router.address
            );

            const pair = await ethers.getContractAt(
                "Pair",
                pool
            );

            expect(
                await pair.isRouterAllowed(
                    router.address
                )
            ).to.equal(true);
        });

        it("should emit RouterAdded event", async function () {
            const pool = await createOnePool();

            await expect(
                factory.addRouter(
                    [pool],
                    router.address
                )
            )
                .to.emit(
                    factory,
                    "RouterAdded"
                )
                .withArgs(
                    router.address
                );
        });

        it("should add router to multiple pools", async function () {
            await factory.createPool(
                await tokenA.getAddress(),
                await tokenB.getAddress()
            );

            await factory.createPool(
                await tokenA.getAddress(),
                await tokenC.getAddress()
            );

            const pools = [...await factory.getPools()]; // We loop over the returned Result, and copy each element to the brand new array

            await factory.addRouter(
                pools,
                router.address
            );

            for (const pool of pools) {
                const pair = await ethers.getContractAt(
                    "Pair",
                    pool
                );

                expect(
                    await pair.isRouterAllowed(
                        router.address
                    )
                ).to.equal(true);
            }
        });

        it("should reject non-owner adding router", async function () {
            const pool = await createOnePool();

            await expect(
                factory
                    .connect(attacker)
                    .addRouter(
                        [pool],
                        router.address
                    )
            )
                .to.be.revertedWithCustomError(
                    factory,
                    "NotOwner"
                );
        });
    });

    describe("removeRouter()", function () {

        beforeEach(async function () {
            const pool = await createOnePool();

            await factory.addRouter(
                [pool],
                router.address
            );
        });

        it("should allow owner to remove router", async function () {
            const pool = await factory.getPool(
                await tokenA.getAddress(),
                await tokenB.getAddress()
            );

            await factory.removeRouter(
                [pool],
                router.address
            );

            const pair = await ethers.getContractAt(
                    "Pair",
                    pool
                );

            expect(
                await pair.isRouterAllowed(
                    router.address
                )
            ).to.equal(false);
        });

        it("should emit RouterRemoved event", async function () {
            const pool =
                await factory.getPool(
                    await tokenA.getAddress(),
                    await tokenB.getAddress()
                );

            await expect(
                factory.removeRouter(
                    [pool],
                    router.address
                )
            )
                .to.emit(
                    factory,
                    "RouterRemoved"
                )
                .withArgs(
                    router.address
                );
        });

        it("should reject non-owner removing router", async function () {
            const pool =
                await factory.getPool(
                    await tokenA.getAddress(),
                    await tokenB.getAddress()
                );

            await expect(
                factory
                    .connect(attacker)
                    .removeRouter(
                        [pool],
                        router.address
                    )
            ).to.be.revertedWithCustomError(
                    factory,
                    "NotOwner"
                );
        });
    });
});