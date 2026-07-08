// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Pair.sol";
import "../libraries/RouterLibrary.sol";
import "../errors/Errors.sol";

contract Factory is Errors {
    // token0 => token1 => pair address
    mapping(address => mapping(address => address)) private pools;

    address[] private allPools;

    function createPool(address token0, address token1) external returns (address pair){
        require(token0 != address(0) && token1 != address(0), "ZERO_ADDRESS");
        require(token0 != token1, "IDENTICAL_ADDRESSES");

        // Normalize order, since it gives one source of truth. And also better gas optimization
        (address t0, address t1) = RouterLibrary.sortTokens(token0, token1);

        require(pools[t0][t1] == address(0), "POOL_EXISTS");

        // Deploy the Pair contract
        pair = address(new Pair());

        // Initialize Pair with tokens
        Pair(pair).initialize(t0, t1);

        pools[t0][t1] = pair;
        pools[t1][t0] = pair;
        allPools.push(pair);
    }

    function getPool(address token0, address token1) external view returns (address){
        (address t0, address t1) = RouterLibrary.sortTokens(token0, token1);

        return pools[t0][t1];
    }

    function getPools() external view returns (address[] memory) {
        return allPools;
    }
}