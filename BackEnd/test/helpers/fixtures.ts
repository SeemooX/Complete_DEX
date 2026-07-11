// The purpose of fixtures.ts is to stop repeating: deploying Factory, Router, tokens, pools, getting Pair instances, and preparing accounts

import hre from "hardhat";

const { ethers } = await hre.network.create();

export async function deployProtocolFixture() {
    const [owner, user, routerSigner, attacker] =
        await ethers.getSigners();

    const factory = await ethers.deployContract(
        "Factory"
    );

    await factory.waitForDeployment();


    const router = await ethers.deployContract(
        "Router",
        [
            await factory.getAddress()
        ]
    );

    await router.waitForDeployment();


    const tokenA = await ethers.deployContract(
        "TestToken1",
        [
            "Token A",
            "TKA",
            ethers.parseEther("10000"),
            ethers.parseEther("100000")
        ]
    );


    const tokenB = await ethers.deployContract(
        "TestToken2",
        [
            "Token B",
            "TKB",
            ethers.parseEther("10000"),
            ethers.parseEther("100000")
        ]
    );


    await tokenA.waitForDeployment();
    await tokenB.waitForDeployment();


    return {
        owner,
        user,
        routerSigner,
        attacker,
        factory,
        router,
        tokenA,
        tokenB
    };
}



export async function deployPoolFixture() {
    const protocol =
        await deployProtocolFixture();


    const {
        factory,
        router,
        tokenA,
        tokenB
    } = protocol;


    await factory.createPool(
        await tokenA.getAddress(),
        await tokenB.getAddress()
    );


    const pairAddress =
        await factory.getPool(
            await tokenA.getAddress(),
            await tokenB.getAddress()
        );


    const pair =
        await ethers.getContractAt(
            "Pair",
            pairAddress
        );


    await factory.addRouter(
        [pairAddress],
        await router.getAddress()
    );


    return {
        ...protocol,
        pair,
        pairAddress
    };
}

/* 
import { deployPoolFixture } from "../helpers/fixtures";

beforeEach(async function () {
    ({
        factory,
        router,
        pair,
        tokenA,
        tokenB,
        user
    } = await deployPoolFixture());
});
 */