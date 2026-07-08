// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IFactory {
    function createPool(address token0, address token1) external returns (address);
    function getPool(address token0, address token1) external view returns (address);
    function getPools() external view returns (address[] memory);
}