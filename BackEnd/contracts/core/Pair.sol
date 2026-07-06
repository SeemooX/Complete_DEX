// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../libraries/Math.sol";
import "../libraries/AMMMath.sol";

/// @title Pair
/// @notice This is the logic that the whole DEX depends on

contract Pair is ERC20 {
    address public immutable factory;

    address private token0;
    address private token1;
    bool private initialized;
    uint256 private reserve0;
    uint256 private reserve1;
    bool private locked; // For reenterancy

    event LiquidityAdded(address indexed user, address pool, address firstToken, uint256 firstTokenAmount, address secondToken, uint256 secondTokenAmount);

    event LiquidityRemoved(address indexed user, address pool, uint256 sharesRetreived, address firstToken, uint256 firstTokenAmount, address secondToken, uint256 secondTokenAmount);

    constructor() ERC20("ETH-USDC LP", "ETHUSDC-LP") {
        factory = msg.sender;
    }

    function initialize(address _token0, address _token1) external onlyFactory{ // The address nomalization, is alread done by the factory when calling this
        require(_token0 != address(0) && _token1 != address(0), "Token address must not be a null address");
        require(_token0 != _token1, "Tokens addresses must be different");
        if(initialized == true) {
            revert();
        }
        
        token0 = _token0;
        token1 = _token1;

        initialized = true; 
    }

    function addLiquidity(uint256 _reserveAdded0, uint256 _reserveAdded1) external lock {
        require(initialized, "The Pool contract still not intialized");
        require(_reserveAdded0 != 0 && _reserveAdded1!= 0, "You must provide tokens to put in the pool");

        // Set up the LPShares representing the tokens
        uint256 LPShares; // Used for later access will be cheap, we wont calculate again at the second if
        if(totalSupply() == 0) {
            LPShares = AMMMath.ratio(_reserveAdded0, _reserveAdded1);
        } else {
            // Compute the users LPtoken share, and add it to the total LPtoken supply
            if(((totalSupply() * _reserveAdded0) / reserve0) >= ((totalSupply() * _reserveAdded1) / reserve1)) {
                LPShares = AMMMath.computeLPShares(totalSupply(), _reserveAdded0, reserve0);
            }
        }

        // The user already approved this pool contract to spend this amount of tokens
        bool success0 = IERC20(token0).transferFrom(msg.sender, address(this), _reserveAdded0);
        bool success1 = IERC20(token1).transferFrom(msg.sender, address(this), _reserveAdded1);
        require(success0 && success1, "Something happends with the transfer of tokens");

        // Adding the reserve, and sending the amount from the sender to this Pair contract
        sync();

        // Adding the new shares to existing once
        _mint(msg.sender, LPShares);

        emit LiquidityAdded(msg.sender, address(this), token0, _reserveAdded0, token1, _reserveAdded1);
    }

    function removeLiquidity(uint256 share) external lock{
        require(initialized, "The Pool contract still not intialized");
        require(balanceOf(msg.sender) >= share, "Insufficient LP balance");
        
        uint256 totalSupply = totalSupply();
        (uint256 amount0, uint256 amount1) = AMMMath.computeRetreivalAmount(totalSupply, share, reserve0, reserve1);

        _burn(msg.sender, share); // If transfer faild the whole transaction will revert, so it is better to burn first

        bool success0 = IERC20(token0).transfer(address(this), msg.sender, amount0);
        bool success1 = IERC20(token1).transfer(address(this), msg.sender, amount1);
        require(success0 && success1, "Something happends with the transfer of tokens");

        sync();

        emit LiquidityRemoved(msg.sender, address(this), share, token0, amount0, token1, amount1);
    }

    function sync() internal {
        reserve0 = IERC20(token0).balanceOf(address(this));
        reserve1 = IERC20(token1).balanceOf(address(this));
    }

    function getReserves() external view returns (uint256, uint256) {
        return (reserve0, reserve1);
    }
    
    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory");
        _;
    }

    modifier lock() {
        require(!locked, "LOCKED");
        locked = true;
        _;
        locked = false;
    }
}