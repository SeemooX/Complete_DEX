// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Math.sol";

/// @title AMMMath
/// @notice General-purpose essential mathematical formulas for the DEX .
library AMMMath {
    /// @notice Returns the nearest integer value to the real square root value (rounding down)
    function ratio(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b != 0, "DIV_BY_ZERO");

        uint256 product = a * b;
        return Math.sqrt(product);
    }

    function computeLPShares(uint256 totalSupply, uint256 _reserveAdded0, uint256 reserve0) internal pure returns (uint256) {
        uint256 shares = (totalSupply * _reserveAdded0 / reserve0);
        return shares;
    }

    function computeRetreivalAmount(uint256 totalSupply, uint256 lpShares, uint256 reserve0, uint256 reserve1) internal pure returns (uint256, uint256) {
        uint256 amount0 = (lpShares * reserve0) / totalSupply;
        uint256 amount1 = (lpShares * reserve1) / totalSupply;

        return (amount0, amount1);
    }
}