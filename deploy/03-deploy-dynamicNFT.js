const { network } = require("hardhat")
const { devChains, networkConfig } = require("../helper-hardhat-config.js")
const { verify } = require("../utils/verify.js")
const fs = require("fs")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    console.log(`deployer: ${deployer}`)
    const chainId = network.config.chainId

    let priceFeedAddress

    if (devChains.includes(network.name)) {
        const priceFeed = await deployments.get("MockV3Aggregator")
        priceFeedAddress = priceFeed.address
    }
    else {
        priceFeedAddress = networkConfig[chainId]["ethUSDPriceFeed"]
    }

    const lowImg = fs.readFileSync("./images/dynamicNFT/frown.svg", { encoding: "utf-8" })
    const highImg = fs.readFileSync("./images/dynamicNFT/happy.svg", { encoding: "utf-8" })

    const args = [priceFeedAddress, lowImg, highImg]

    const dynamicNFTContract = await deploy("DynamicNFT", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (!devChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(dynamicNFTContract.address, args)
    }

    log("------------------------------")

}

module.exports.tags = ["all", "dynamic", "main"]