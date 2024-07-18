// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "base64-sol/base64.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

event CreatedNFT(uint256 indexed tokenID, int256 highValue);

contract DynamicNFT is ERC721 {
    //mint -> create
    //storing SVG info
    //logic to toggle happy sad
    // base64 -> images to textual assets like HTML, CSS

    uint256 private s_tokenCounter;
    string private i_lowImgURI;
    string private i_highImgURI;
    string private constant base64Prefix = "data:image/svg+xml;base64,";
    AggregatorV3Interface internal immutable i_priceFeed;
    mapping(uint256 => int256) public s_tokenId_highvalue;

    constructor(
        address priceFeedAddress,
        string memory lowImg,
        string memory highImg
    ) ERC721("Dynamic NFT", "DNFT") {
        s_tokenCounter = 0;
        i_lowImgURI = imageToURI(lowImg);
        i_highImgURI = imageToURI(highImg);
        i_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    function imageToURI(string memory svg) public pure returns (string memory) {
        string memory base64Encoded = Base64.encode(
            bytes(string(abi.encodePacked(svg)))
        );
        // return string(abi.encodePacked(base64Prefix, base64Encoded));
        return string.concat(base64Prefix, base64Encoded);
    }

    function mintNFT(int256 highValue) public {
        s_tokenId_highvalue[s_tokenCounter] = highValue;
        _safeMint(msg.sender, s_tokenCounter);
        s_tokenCounter = s_tokenCounter + 1;
        emit CreatedNFT(s_tokenCounter, highValue);
    }

    function _baseURI() internal pure override returns (string memory) {
        return "data:application/json;base64,";
    }

    function tokenURI(
        uint256 tokenID
    ) public view override returns (string memory) {
        require(_exists(tokenID), "Non existent token");

        (, int256 price, , , ) = i_priceFeed.latestRoundData();
        string memory imageURI = i_lowImgURI;

        if (price >= s_tokenId_highvalue[tokenID]) {
            imageURI = i_highImgURI;
        }

        return
            string(
                abi.encodePacked(
                    _baseURI(),
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{ "name" : "',
                                name(),
                                '", "description" : "A NFT that changes on Chainlink Feed.", ',
                                '"attributes" : [{"trait_type": "happiness", "value" : 100 }], "image": "',
                                imageURI,
                                '"}'
                            )
                        )
                    )
                )
            );
    }


    function getLowImgURI() public view returns (string memory) {
        return i_lowImgURI;
    }

    function getHighImgURI() public view returns (string memory) {
        return i_highImgURI;
    }

    function getPriceFeed() public view returns (AggregatorV3Interface){
        return i_priceFeed;
    }

    function getTokenCounter() public view returns (uint256){
        return s_tokenCounter;
    }
}
