const { network } = require("hardhat")
const { devChains } = require("../helper-hardhat-config.js")
const { verify } = require("../utils/verify.js")

module.exports = async ({ getNamedAccounts, deployments}) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    console.log(`Basic NFT deployer: ${deployer}`)

    log("Deploying BasicNFT...")
    const args = []
    const basicNFT = await deploy("BasicNFT", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if(!devChains.includes(network.name) && process.env.ETHERSCAN_API_KEY){
        console.log("Verifying...")
        await verify(basicNFT.address, args)
    }
    console.log("--------------------")
}

module.exports.tags = ["all", "BasicNFT", "main"] // important for deployments.fixture