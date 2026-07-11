import { expect } from "chai";
import hre from "hardhat";

const { ethers } = await hre.network.create();

describe("Router - Deployment", function () {
    let factory: any;
    let router: any;

    let owner: any;

    beforeEach(async function () {
        [owner] = await ethers.getSigners();

        factory = await ethers.deployContract(
            "Factory"
        );

        await factory.waitForDeployment();

        router = await ethers.deployContract(
            "Router",
            [
                await factory.getAddress()
            ]
        );

        await router.waitForDeployment();
    });


    describe("Constructor", function () {

        it("should deploy Router successfully", async function () {
            expect(
                await router.getAddress()
            ).to.not.equal(
                ethers.ZeroAddress
            );
        });


        it("should initialize with factory address", async function () {
            const tokenA =
                await ethers.deployContract(
                    "TestToken1",
                    [
                        "Token A",
                        "TKA",
                        ethers.parseEther("1000"),
                        ethers.parseEther("10000")
                    ]
                );

            const tokenB =
                await ethers.deployContract(
                    "TestToken2",
                    [
                        "Token B",
                        "TKB",
                        ethers.parseEther("1000"),
                        ethers.parseEther("10000")
                    ]
                );


            await tokenA.waitForDeployment();
            await tokenB.waitForDeployment();


            await factory.createPool(
                await tokenA.getAddress(),
                await tokenB.getAddress()
            );


            const pool =
                await factory.getPool(
                    await tokenA.getAddress(),
                    await tokenB.getAddress()
                );


            expect(pool).to.not.equal(
                ethers.ZeroAddress
            );
        });


        it("should have different address from Factory", async function () {
            expect(
                await router.getAddress()
            ).to.not.equal(
                await factory.getAddress()
            );
        });

    });

});