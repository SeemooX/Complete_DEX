import { expect } from "chai";
import hre from "hardhat";

const { ethers } = await hre.network.create();

describe("Pair - Deployment", function () {
    let factory: any;
    let pair: any;

    let owner: any;
    let attacker: any;

    let tokenA: any;
    let tokenB: any;

    beforeEach(async function () {
        [owner, attacker] = await ethers.getSigners();

        factory = await ethers.deployContract(
            "Factory"
        );

        await factory.waitForDeployment();

        tokenA = await ethers.deployContract(
            "TestToken1",
            [
                "Token A",
                "TKA",
                ethers.parseEther("1000"),
                ethers.parseEther("10000"),
            ]
        );

        tokenB = await ethers.deployContract(
            "TestToken2",
            [
                "Token B",
                "TKB",
                ethers.parseEther("1000"),
                ethers.parseEther("10000"),
            ]
        );

        await Promise.all([
            tokenA.waitForDeployment(),
            tokenB.waitForDeployment(),
        ]);
    });

    async function deployPair() {
        pair = await ethers.deployContract(
            "Pair"
        );

        await pair.waitForDeployment();

        return pair;
    }

    describe("Constructor", function () {
        it("should deploy Pair successfully", async function () {
            const pair = await deployPair();

            expect(
                await pair.getAddress()
            ).to.not.equal(
                ethers.ZeroAddress
            );
        });

        it("should set Factory address", async function () {
            const pair = await deployPair();

            expect(
                await pair.factory()
            ).to.equal(
                owner.address
            );
        });
    });

    describe("initialize()", function () {
        it("should initialize token addresses", async function () {
            const pair = await deployPair();

            await pair.initialize(
                await tokenA.getAddress(),
                await tokenB.getAddress()
            );

            expect(
                await pair.getToken0()
            ).to.not.equal(
                ethers.ZeroAddress
            );

            expect(
                await pair.getToken1()
            ).to.not.equal(
                ethers.ZeroAddress
            );
        });

        it("should reject zero address token", async function () {
            const pair = await deployPair();

            await expect(
                pair.initialize(
                    ethers.ZeroAddress,
                    await tokenB.getAddress()
                )
            )
            .to.be.revertedWithCustomError(
                pair,
                "ZeroAddress"
            );
        });

        it("should reject identical tokens", async function () {
            const pair = await deployPair();

            await expect(
                pair.initialize(
                    await tokenA.getAddress(),
                    await tokenA.getAddress()
                )
            ).to.be.revertedWithCustomError(
                pair,
                "IdenticalTokens"
            );
        });

        it("should not allow initialization twice", async function () {
            const pair = await deployPair();

            await pair.initialize(
                await tokenA.getAddress(),
                await tokenB.getAddress()
            );

            await expect(
                pair.initialize(
                    await tokenA.getAddress(),
                    await tokenB.getAddress()
                )
            ).to.be.revertedWithCustomError(
                pair,
                "AlreadyInitialized"
            );
        });

        it("should only allow Factory to initialize", async function () {
            const pair = await deployPair(); // The factory/owner is the one deploying

            // In here the Attacker is trying to initialize instead of the factory/owner
            await expect(
                pair
                .connect(attacker)
                .initialize(
                    await tokenA.getAddress(),
                    await tokenB.getAddress()
                )
            ).to.be.revertedWithCustomError(
                pair,
                "OnlyFactory"
            );
        });
    });

    describe("Initial state", function () {
        it("should start with zero reserves", async function () {
            const pair = await deployPair();

            const reserves = await pair.getReserves();

            expect(
                reserves[0]
            ).to.equal(0);

            expect(
                reserves[1]
            ).to.equal(0);

        });

        it("should start with zero LP supply", async function () {
            const pair = await deployPair();

            expect(
                await pair.totalSupply()
            ).to.equal(0);
        });

        it("should not allow routers initially", async function () {
            const pair = await deployPair();

            expect(
                await pair.isRouterAllowed(
                    attacker.address
                )
            ).to.equal(false);
        });
    });
});