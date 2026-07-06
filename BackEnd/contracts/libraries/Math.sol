// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Math
/// @notice General-purpose mathematical helper functions.
library Math {
    /// @notice Returns the smaller of two numbers.
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    /// @notice Returns the larger of two numbers.
    function max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? a : b;
    }

    /// @notice Returns the absolute value of a signed integer.
    function abs(int256 x) internal pure returns (uint256) {
        unchecked {
            return uint256(x >= 0 ? x : -x);
        }
    }

    /// @notice Integer square root (rounds down).
    /// @dev Uses the Babylonian method.
    function sqrt(uint256 x) internal pure returns (uint256 y) {
        if (x == 0) return 0;
        if (x <= 3) return 1;

        uint256 z = (x + 1) / 2;
        y = x;

        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }

    /// @notice Returns the average of two numbers without overflow.
    function average(uint256 a, uint256 b) internal pure returns (uint256) {
        return (a & b) + ((a ^ b) >> 1);
    }

    /// @notice Returns ceil(a / b).
    function ceilDiv(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b != 0, "Math: division by zero");
        return a == 0 ? 0 : ((a - 1) / b) + 1;
    }

    /// @notice Returns x².
    function square(uint256 x) internal pure returns (uint256) {
        return x * x;
    }

    /// @notice Returns x³.
    function cube(uint256 x) internal pure returns (uint256) {
        return x * x * x;
    }

    /// @notice Returns true if x is even.
    function isEven(uint256 x) internal pure returns (bool) {
        return x % 2 == 0;
    }

    /// @notice Returns true if x is odd.
    function isOdd(uint256 x) internal pure returns (bool) {
        return x % 2 == 1;
    }

    /// @notice Returns the percentage of a value.
    /// @param value The base value.
    /// @param percentage Percentage using whole numbers (e.g. 5 = 5%).
    function percentage(
        uint256 value,
        uint256 percentage
    ) internal pure returns (uint256) {
        return (value * percentage) / 100;
    }

    /// @notice Returns floor(log2(x)).
    function log2(uint256 x) internal pure returns (uint256 result) {
        require(x > 0, "Math: log2(0)");

        while (x > 1) {
            x >>= 1;
            result++;
        }
    }

    /// @notice Clamps a value between a minimum and maximum.
    function clamp(
        uint256 value,
        uint256 minValue,
        uint256 maxValue
    ) internal pure returns (uint256) {
        require(minValue <= maxValue, "Math: invalid range");

        if (value < minValue) return minValue;
        if (value > maxValue) return maxValue;
        return value;
    }
}