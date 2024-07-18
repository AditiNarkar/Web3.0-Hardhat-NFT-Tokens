const { ethers } = require("hardhat")

const networkConfig = {
    31337: {
        name: "hardhat",
        mintFee: ethers.parseEther("0.01"),
        keyHash: "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae",
        callbackGasLimit: "500000",
        interval: "30"
    },
    11155111: {
        //from https://docs.chain.link/vrf/v2-5/supported-networks in Sepolia network
        name: "sepolia",
        vrfCoordinatorV2: "0x71959BFeFE5697696922735a5Fe0a639dA925437", // -> v2
        // vrfCoordinatorV2: "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B", // -> v2.5
        mintFee: ethers.parseEther("0.001"),
        keyHash: "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae",
        subscription_Id: "11964", // https://vrf.chain.link/sepolia/11964
        // subscription_Id: "11848", // from remix
        callbackGasLimit: "500000",
        interval: "30",
        ethUSDPriceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306"
    },

}

// chains that mocks are goin to be deployed on
const devChains = ["hardhat", "localhost"]
const DECIMALS = "18"
const INITIAL_ANS = ethers.parseUnits("2000", "ether")

module.exports = {
    networkConfig, devChains, DECIMALS, INITIAL_ANS
}