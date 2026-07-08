// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IFactory.sol";
import "../interfaces/IPair.sol";
import "../libraries/RouterLibrary.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Router {
    address private immutable factory;

    constructor(address _factory) {
        factory = _factory;
    }

    function addLiquidity(address tokenX, address tokenY, uint256 amountXDesired, uint256 amountYDesired) external {
        require(tokenX != tokenY, "Identical tokens");
        require(amountXDesired > 0 && amountYDesired > 0, "Zero amount");
        address poolAddress = IFactory.getPool(tokenX, tokenY);
        require(poolAddress != address(0), "There is no pool of this tokens");

        // Transfering funds from the user to the deployed pair contract
        bool success0 = IERC20(tokenX).transferFrom(msg.sender, poolAddress, amountXDesired);
        bool success1 = IERC20(tokenY).transferFrom(msg.sender, poolAddress, amountYDesired);
        require(success0 && success1, "Something happends with the transfer of tokens");

        if(tokenX == IPair(poolAddress).getToken0()) {
            IPair(poolAddress).addLiquidity(msg.sender, amountXDesired, amountYDesired);
        } else {
            IPair(poolAddress).addLiquidity(msg.sender, amountYDesired, amountXDesired);
        }
    }

    // It needs before "await lpToken.approve(pairAddress, share)"
    function removeLiquidity(address tokenX, address tokenY, uint256 share) external {
        require(tokenX != tokenY, "Identical tokens");
        address poolAddress = IFactory.getPool(tokenX, tokenY);
        require(poolAddress != address(0), "There is no pool of this tokens");

        IPair(poolAddress).removeLiquidity(share);
    }

    function swapExactTokensForTokens(address token, address toToken, uint256 amountIn, uint256 minOutAmount, address recipient) {
        require(token != toToken, "Identical tokens");
        require(amountIn > 0, "The value in entered has to be greater than 0");
        address poolAddress = IFactory.getPool(token, toToken);
        require(poolAddress != address(0), "There is no pool of this tokens");
        
        IPair(poolAddress).swap(msg.sender, token, amountIn, minOutAmount, recipient);
    }

    /*
        swapTokensForExactTokens() // The out has to be exact

        swapExactETHForTokens() // The in has to be exact

        swapExactTokensForETH() // The in has to be exact

        swapETHForExactTokens() // The out has to be exact
     */
}