// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPair {

    event LiquidityAdded(address indexed user, address pool, address firstToken, uint256 firstTokenAmount, address secondToken, uint256 secondTokenAmount);
    event LiquidityRemoved(address indexed user, address pool, uint256 sharesRetreived, address firstToken, uint256 firstTokenAmount, address secondToken, uint256 secondTokenAmount);
    event SwapExecuted(address sender, address inToken, address ouToken, uint256 amountIn, uint256 amountOut, address recipient);


    function addLiquidity(uint256 _reserveAdded0, uint256 _reserveAdded1) external;

    function removeLiquidity(uint256 share) external;

    function swap(address token, uint256 amountIn, uint256 minOutAmount, address recipient) external;

    function getReserves() external view returns (uint256, uint256);

    function getToken0() external view returns (address);

    function getToken1() external view returns (address);
}