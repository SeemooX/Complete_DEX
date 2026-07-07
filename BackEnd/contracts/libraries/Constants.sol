// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library Constants {

    uint256 private constant FEE = 30;
    uint256 private constant FEE_SCALE = 10_000;

    function getFee() internal pure returns (uint256) {
        return FEE;
    }

    function getFeeScale() internal pure returns (uint256) {
        return FEE_SCALE;
    } 

}