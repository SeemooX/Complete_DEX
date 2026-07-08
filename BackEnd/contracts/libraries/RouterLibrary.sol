// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library RouterLibrary {
    function findPool(address[] memory pools, address thePool) internal pure returns (bool) {
        for(uint256 i = 0; i < pools.length; i++) {
            if(thePool == pools[i]) {
                return true;
            }
        }

        return false;
    }

    function sortTokens(address tokenX, address tokenY) internal pure returns (address, address) {
        return tokenX < tokenY ? (tokenX, tokenY) : (tokenY, tokenX);
    }
}