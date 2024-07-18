const { ethers } = require("hardhat")
const { devChains, DECIMALS, INITIAL_ANS } = require("../helper-hardhat-config")

const BASE_FEE = ethers.parseEther("0.20") // 0.25 is premium, it costs 0.20 LINK or 0.24 ETH per request
const GAS_PRICE_LINK = 1e9 // 1000000000  // 0.000000001 LINK per gas // calculated value based on gas price of chain based on ETH value

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    console.log("Mocks deployer: ", deployer)

    if (devChains.includes(network.name)) {
        log("Local Network.")
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: [BASE_FEE, GAS_PRICE_LINK] // constructor parameters
        })

        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_ANS] // constructor parameters
        })

        log("Mocks Deployed.")
        log("------------------")
    }
}
module.exports.tags = ["all", "mocks"]
