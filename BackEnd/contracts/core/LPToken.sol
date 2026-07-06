// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LPToken is ERC20, Ownable {

    uint256 public immutable maxSupply;
    uint256 public mintCooldownBlocks = 50;
    uint256 public lastMintBlock;

    error MaxSupplyExceeded();
    error MintCooldownActive();

    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        uint256 _maxSupply
    ) ERC20(name, symbol) Ownable(msg.sender) { // For the we put hte msg.sender, but later we will put the Pool contract address as the owner

        require(_maxSupply >= initialSupply, "max < initial");

        maxSupply = _maxSupply;

        _mint(msg.sender, initialSupply);
    }

    // Owner mint with restrictions
    function mint(address to, uint256 amount) external onlyOwner {

        if (block.number < lastMintBlock + mintCooldownBlocks) {
            revert MintCooldownActive();
        }

        if (totalSupply() + amount > maxSupply) {
            revert MaxSupplyExceeded();
        }

        lastMintBlock = block.number;

        _mint(to, amount);
    }

    // Burn function, just delegates the call to ERC20 contract
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    // Admin control
    function setCooldown(uint256 blocks_) external onlyOwner {
        mintCooldownBlocks = blocks_;
    }
}