// constants.ts will contain reusable values: initial supplies, liquidity amounts, swap amounts, addresses, and common numbers

import hre from "hardhat";

const { ethers } = await hre.network.create();

export const TOKEN_A_NAME = "Token A";
export const TOKEN_A_SYMBOL = "TKA";

export const TOKEN_B_NAME = "Token B";
export const TOKEN_B_SYMBOL = "TKB";


export const INITIAL_SUPPLY =
    ethers.parseEther("10000");

export const MAX_SUPPLY =
    ethers.parseEther("100000");


export const SMALL_AMOUNT =
    ethers.parseEther("10");

export const NORMAL_AMOUNT =
    ethers.parseEther("100");

export const LARGE_AMOUNT =
    ethers.parseEther("1000");


export const LIQUIDITY_AMOUNT_A =
    ethers.parseEther("1000");

export const LIQUIDITY_AMOUNT_B =
    ethers.parseEther("1000");


export const SWAP_AMOUNT =
    ethers.parseEther("10");


export const HIGH_SLIPPAGE =
    ethers.parseEther("100000");


export const ZERO =
    0;