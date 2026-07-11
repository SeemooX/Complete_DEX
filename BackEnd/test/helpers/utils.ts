// This here will contain reusable functions, like: approvee tokens, create liquidity, get pair address, move blockchain blocks ..

import hre from "hardhat";

const { ethers } = await hre.network.create();


export async function approveToken(
    token: any,
    owner: any,
    spender: string,
    amount: bigint
) {
    await token.connect(owner).approve(
        spender,
        amount
    );
}


export async function transferToken(
    token: any,
    from: any,
    to: string,
    amount: bigint
) {
    await token.connect(from).transfer(
        to,
        amount
    );
}


export async function getPair(
    factory: any,
    tokenA: any,
    tokenB: any
) {
    const address =
        await factory.getPool(
            await tokenA.getAddress(),
            await tokenB.getAddress()
        );

    return await ethers.getContractAt(
        "Pair",
        address
    );
}


export async function addLiquidity(
    router: any,
    user: any,
    tokenA: any,
    tokenB: any,
    amountA: bigint,
    amountB: bigint
) {
    await approveToken(
        tokenA,
        user,
        await router.getAddress(),
        amountA
    );

    await approveToken(
        tokenB,
        user,
        await router.getAddress(),
        amountB
    );

    await router.connect(user).addLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        amountA,
        amountB
    );
}


export async function addRouterPermission(
    factory: any,
    pair: any,
    router: any
) {
    await factory.addRouter(
        [await pair.getAddress()],
        await router.getAddress()
    );
}


export async function mineBlocks(
    blocks: number
) {
    for (let i = 0; i < blocks; i++) {
        await ethers.provider.send(
            "evm_mine",
            []
        );
    }
}


// Before:
/* 
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
 */

// With this file:

/* 
await addLiquidity(
    router,
    user,
    tokenA,
    tokenB,
    NORMAL_AMOUNT,
    NORMAL_AMOUNT
);
 */