// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// https://eips.ethereum.org/EIPS/eip-721
// https://docs.openzeppelin.com/contracts/4.x/ -> Implementations of standards like ERC20 and ERC721.

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract BasicNFT is ERC721 {
    string public constant TOKEN_URI =
        "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json";

    uint256 private s_tokenCounter;

    constructor() ERC721("Doggie", "DOG") { // NFT name, NFT symbol
        s_tokenCounter = 0;
    }

    // create NFT
    function mintNFT() public returns (uint256){ 
        _safeMint(msg.sender, s_tokenCounter); // inbuilt function
        s_tokenCounter = s_tokenCounter + 1;
        return s_tokenCounter;
    }

    function tokenURI(uint256 /*tokenId*/) public pure override returns (string memory){ // override function // called in _safeMint()
        return TOKEN_URI;
    }

    function getTokenCounter() public view returns (uint256){
        return s_tokenCounter;
    }
}
