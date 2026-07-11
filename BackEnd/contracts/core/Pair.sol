// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../errors/Errors.sol";
import "../libraries/Math.sol";
import "../libraries/AMMMath.sol";

/// @title Pair
/// @notice This is the logic that the whole DEX depends on

contract Pair is ERC20, PairErrors {
    address public immutable factory;

    address private token0;
    address private token1;
    bool private initialized;
    uint256 private reserve0;
    uint256 private reserve1;
    bool private locked;

    mapping(address => bool) private routersAllowed;

    event LiquidityAdded(
        address indexed user,
        address indexed pool,
        address indexed firstToken,
        uint256 firstTokenAmount,
        address secondToken,
        uint256 secondTokenAmount
    );

    event LiquidityRemoved(
        address indexed user,
        address indexed pool,
        uint256 sharesRetrieved,
        address firstToken,
        uint256 firstTokenAmount,
        address secondToken,
        uint256 secondTokenAmount
    );

    event SwapExecuted(
        address indexed sender,
        address indexed inToken,
        address indexed outToken,
        uint256 amountIn,
        uint256 amountOut,
        address recipient
    );

    event RouterUpdated(
        address indexed router,
        bool allowed
    );

    constructor() ERC20("ETH-USDC LP", "ETHUSDC-LP") {
        factory = msg.sender;
    }

    function initialize(
        address _token0,
        address _token1
    ) external onlyFactory {
        if (_token0 == address(0) || _token1 == address(0)) {
            revert ZeroAddress();
        }

        if (_token0 == _token1) {
            revert IdenticalTokens();
        }

        if (initialized) {
            revert AlreadyInitialized();
        }

        token0 = _token0;
        token1 = _token1;

        initialized = true;
    }


    function addLiquidity(
        address to,
        uint256 amount0,
        uint256 amount1
    ) external onlyRouter lock {
        if (!initialized) {
            revert NotInitialized();
        }

        if (to == address(0)) {
            revert ZeroAddress();
        }

        if (amount0 == 0 || amount1 == 0) {
            revert InvalidAmount();
        }

        uint256 liquidity;
        if (totalSupply() == 0) {

            liquidity = AMMMath.ratio(
                amount0,
                amount1
            );
        } else {
            uint256 liquidity0 =
                AMMMath.computeLPShares(
                    totalSupply(),
                    amount0,
                    reserve0
                );
            uint256 liquidity1 =
                AMMMath.computeLPShares(
                    totalSupply(),
                    amount1,
                    reserve1
                );
            liquidity = liquidity0 < liquidity1 ? liquidity0 : liquidity1;
        }

        _mint(to, liquidity);

        sync();

        emit LiquidityAdded(
            to,
            address(this),
            token0,
            amount0,
            token1,
            amount1
        );
    }

    function removeLiquidity(
        address to,
        uint256 share
    ) external onlyRouter lock {
        if (!initialized) {
            revert NotInitialized();
        }

        if (to == address(0)) {
            revert ZeroAddress();
        }

        if (balanceOf(to) < share) {
            revert InsufficientBalance();
        }

        uint256 supply = totalSupply();

        (uint256 amount0, uint256 amount1) =AMMMath.computeRetrievalAmount(supply, share, reserve0, reserve1);


        transferFrom(to, address(this), share);

        _burn(address(this), share);

        _safeTransfer(token0, to, amount0);

        _safeTransfer(token1, to, amount1);

        sync();

        emit LiquidityRemoved(
            to,
            address(this),
            share,
            token0,
            amount0,
            token1,
            amount1
        );
    }

    function swap(
        address from,
        address token,
        uint256 amountIn,
        uint256 minOutAmount,
        address recipient
    ) external lock {
        if (!initialized) {
            revert NotInitialized();
        }

        if (token != token0 && token != token1) {
            revert InvalidToken();
        }

        if (amountIn == 0) {
            revert InvalidAmount();
        }

        if (recipient == address(0)) {
            revert ZeroAddress();
        }

        address outToken = token == token0 ? token1 : token0;


        (uint256 reserveIn, uint256 reserveOut) = getReserves(token, outToken);


        (uint256 amountAfterFee, uint256 amountOut) =AMMMath.swapOutput(amountIn, reserveIn, reserveOut);

        if (amountOut > reserveOut) {
            revert InsufficientLiquidity();
        }

        if (amountOut < minOutAmount) {
            revert SlippageExceeded();
        }

        _safeTransferFrom(
            token,
            from,
            address(this),
            amountIn
        );

        _safeTransfer(
            outToken,
            recipient,
            amountOut
        );

        /* if (reserveIn * reserveOut > (reserveIn + amountAfterFee) * (reserveOut - amountOut)) {
            revert InvalidK();
        } */

        sync();

        emit SwapExecuted(
            msg.sender,
            token,
            outToken,
            amountIn,
            amountOut,
            recipient
        );
    }

    function getReserves(
        address inToken,
        address outToken
    ) internal view returns(uint256, uint256) {
        return (
            IERC20(inToken).balanceOf(address(this)),
            IERC20(outToken).balanceOf(address(this))
        );
    }

    function sync() internal {
        reserve0 =
            IERC20(token0)
            .balanceOf(address(this));

        reserve1 =
            IERC20(token1)
            .balanceOf(address(this));
    }

    function getReserves() external view returns(uint256, uint256) {
        return (
            reserve0,
            reserve1
        );
    }

    function getToken0() external view returns(address) {
        return token0;
    }

    function getToken1() external view returns(address) {
        return token1;
    }

    function isRouterAllowed(address router) external view returns(bool) {
        return routersAllowed[router];
    }

    function setNewRouter(address router) external onlyFactory {
        routersAllowed[router] = true;

        emit RouterUpdated(
            router,
            true
        );
    }

    function deleteRouter(address router) external onlyFactory {
        routersAllowed[router] = false;

        emit RouterUpdated(
            router,
            false
        );
    }

    function _safeTransfer(
        address token,
        address to,
        uint256 amount
    ) internal {
        bool success = IERC20(token) .transfer(to, amount);
        if (!success) {
            revert TransferFailed();
        }
    }

    function _safeTransferFrom(
        address token,
        address from,
        address to,
        uint256 amount
    ) internal {
        bool success = IERC20(token).transferFrom(from, to, amount);
        if (!success) {
            revert TransferFailed();
        }
    }

    modifier onlyFactory() {
        if (msg.sender != factory) {
            revert OnlyFactory();
        }
        _;
    }

    modifier onlyRouter() {
        if (!routersAllowed[msg.sender]) {
            revert OnlyRouter();
        }
        _;
    }

    modifier lock() {
        if (locked) {
            revert Locked();
        }
        locked = true;
        _;
        locked = false;
    }
}