// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

interface FactoryErrors {
    error ZeroAddress();
    error IdenticalAddresses();
    error PoolAlreadyExists();
    error NotOwner();
}

interface PairErrors {
    error ZeroAddress();
    error IdenticalTokens();
    error AlreadyInitialized();
    error NotInitialized();
    error InvalidAmount();
    error InvalidToken();
    error InsufficientBalance();
    error InsufficientLiquidity();
    error SlippageExceeded();
    error InvalidK();
    error TransferFailed();
    error OnlyFactory();
    error OnlyRouter();
    error Locked();
}