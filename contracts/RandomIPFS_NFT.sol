//  This contract allows users to mint NFTs with random attributes (dog breeds) using Chainlink VRF to ensure randomness.
// Users pay a fee to mint NFTs, and the randomness determines the breed.
// The contract owner can withdraw the collected fees, and the breeds have different chances of being selected.

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {VRFConsumerBaseV2} from "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import {VRFCoordinatorV2Interface} from "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol"; // for owner access

error RandomIPFS_NFT__RangeOutOfBounds();
error RandomIPFS_NFT__NotEnoughETH();
error RandomIPFS_NFT__WithdrawFailed();

contract RandomIPFS_NFT is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
    // when we mint an NFT, we will trigger Chainlink VRF call to get a random number
    // using that number, we will get random NFT
    // that NFT can be any 1 of the 3 dog breeds: Pug(Rare), Shiba Inu(Middle), St. Bernard(common)

    //users have to pay to mint an NFT
    // contract owner withdraws this money

    // Type Declaration ENUM
    enum Breed {
        PUG,
        SHIBA_INU,
        ST_BERNARD
    }

    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_keyHash;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;
    uint256 internal i_mintFee;

    // reqID Mapping
    mapping(uint256 => address) public s_reqID_caller;

    // NFT Variables
    uint256 public s_tokenCounter;
    uint256 internal constant MAX_CHANCE_VALUE = 100;
    string[] internal s_NFT_TokenURIs; // holds IPFS addresses

    // events
    event NFT_Requested(uint256 indexed reqID, address requester);
    event NFT_Minted(Breed breed, address minter);

    constructor(
        address vrfCoordinatorV2, // contract
        bytes32 keyHash,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        string[3] memory NFT_TokenURIs, // holds IPFS addresses
        uint256 mintFee
    ) VRFConsumerBaseV2(vrfCoordinatorV2) ERC721("Random IPFS NFT", "RIN") {
        // ERC721URIStorage still extends ERC721.sol, so we can call its constructor
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_keyHash = keyHash;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        i_mintFee = mintFee;
        s_NFT_TokenURIs = NFT_TokenURIs;
    }

    function requestNFT() public payable returns (uint256 requestID) {
        if (msg.value < i_mintFee) {
            revert RandomIPFS_NFT__NotEnoughETH();
        }
        requestID = i_vrfCoordinator.requestRandomWords(
            i_keyHash, // gasLane -> maximum gas price you are willing to pay for a request in wei
            i_subscriptionId, // subscription ID that this contract uses for funding requests
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit, // limit for how much gas to use for the callback request to fulfillRandomWords()
            NUM_WORDS // how many random numbers we want
        );
        s_reqID_caller[requestID] = msg.sender; // who calls RandomIPFS_NFT Contract

        emit NFT_Requested(requestID, msg.sender);
    }

    function fulfillRandomWords(
        uint256 requestID,
        uint256[] memory randomWords
    ) internal override {
        //assign dogs
        // only to the person who called requestNFT with that requestID
        address contractOwner = s_reqID_caller[requestID];
        uint256 newTokenID = s_tokenCounter;

        uint256 moddedChance = randomWords[0] % MAX_CHANCE_VALUE; // always between 0 to 99

        Breed breed = getBreedFromNumber(moddedChance);

        _safeMint(contractOwner, newTokenID);

        // ERC721URIStorage has fucntion _setTokenURI but ERC721 doesnt
        _setTokenURI(newTokenID, s_NFT_TokenURIs[uint256(breed)]); // uint256(breed) -> returns index

        s_tokenCounter += s_tokenCounter;

        emit NFT_Minted(breed, contractOwner);
    }

    function getBreedFromNumber(
        uint256 moddedChance
    ) public pure returns (Breed) {
        uint256[3] memory chanceArray = getChanceArray();
        uint256 sum = 0;
        for (uint256 i = 0; i < chanceArray.length; i++) {
            if (moddedChance >= sum && moddedChance < chanceArray[i]) {
                return Breed(i);
            }
            sum += chanceArray[i];
        }
        revert RandomIPFS_NFT__RangeOutOfBounds();
    }

    // pure functions do not read from the blockchain state, meaning they do not access any state variables
    function getChanceArray() public pure returns (uint256[3] memory) {
        return [10, 30, MAX_CHANCE_VALUE]; // sum logic
        // Pug -> 0 to 10 // (10%)
        // Shiba Inu -> 10 to 30 // (30-10)20%
        // St. Bernard -> 30 to 100 // (100-40)60%
    }

    function withdraw() public onlyOwner {
        uint256 amt = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: amt}("");
        if (!success) {
            revert RandomIPFS_NFT__WithdrawFailed();
        }
    }

    // function tokenURI(uint256) public view override returns (string memory) {} // ERC721URIStorage already has it.

    function getMintFee() public view returns (uint256) {
        return i_mintFee;
    }

    function getNFT_TokenURIs(uint256 i) public view returns (string memory) {
        return s_NFT_TokenURIs[i];
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }
}
