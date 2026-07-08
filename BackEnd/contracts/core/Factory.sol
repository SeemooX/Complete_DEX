// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Pair.sol";
import "../libraries/RouterLibrary.sol";
import "../interfaces/IPair.sol";
import "../errors/Errors.sol";

contract Factory is FactoryErrors {
    address public immutable owner;

    // token0 => token1 => pair
    mapping(address => mapping(address => address)) private pools;

    address[] private allPools;

    event PoolCreated(
        address indexed token0,
        address indexed token1,
        address pair
    );

    event RouterAdded(address indexed router);
    event RouterRemoved(address indexed router);

    constructor() {
        owner = msg.sender;
    }

    function createPool(
        address token0,
        address token1
    ) external returns (address pair) {
        if (token0 == address(0) || token1 == address(0)) {
            revert ZeroAddress();
        }

        if (token0 == token1) {
            revert IdenticalAddresses();
        }

        // Normalize token ordering
        (address t0, address t1) = RouterLibrary.sortTokens(token0, token1);

        if (pools[t0][t1] != address(0)) {
            revert PoolAlreadyExists();
        }

        // Deploy Pair
        pair = address(new Pair());

        // Initialize Pair
        Pair(pair).initialize(t0, t1);

        pools[t0][t1] = pair;
        pools[t1][t0] = pair;

        allPools.push(pair);

        emit PoolCreated(t0, t1, pair);
    }

    function getPool(
        address token0,
        address token1
    ) external view returns (address) {
        (address t0, address t1) = RouterLibrary.sortTokens(token0, token1);

        return pools[t0][t1];
    }

    function getPools() external view returns (address[] memory) {
        return allPools;
    }

    function allPoolsLength() external view returns (uint256) {
        return allPools.length;
    }

    function addRouter(
        address[] calldata providedPools,
        address router
    ) external onlyOwner {
        for (uint256 i; i < providedPools.length; ++i) {
            IPair(providedPools[i]).setNewRouter(router);
        }

        emit RouterAdded(router);
    }

    function removeRouter(
        address[] calldata providedPools,
        address router
    ) external onlyOwner {
        for (uint256 i; i < providedPools.length; ++i) {
            IPair(providedPools[i]).deleteRouter(router);
        }

        emit RouterRemoved(router);
    }

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert NotOwner();
        }
        _;
    }
}