const { network } = require("hardhat")
const { devChains, networkConfig } = require("../helper-hardhat-config.js")
const { verify } = require("../utils/verify.js")
const { storeImages, storeMetadata } = require("../utils/upload-To-Pinata.js")
require("dotenv").config()

const imageLoc = "./images/randomDogNFT"

const VRF_SUBSCRIPTION_FUND_AMT = ethers.parseEther("1") // 1 ETH or 1e18 ( 10^18) wei

const metadataTemplate = {
    name: "",
    description: "",
    imageURI: "",
    attributes: [{
        trait_type: "Cuteness",
        value: 100,
    }],
}

// get IPFS Hashes of images
let tokenURIs = [
    'ipfs://Qmf6BsW7NYaMhCuXdztXr9o5PjSKPAbKdnRgQrLdejnUTk',
    'ipfs://QmTnL9YdZmP9GnQJAMX5efQEXVAxVJhA2VDHFNo8kxJdBA',
    'ipfs://QmXRwwKKPDCjFPM5L2zvsL7gtxzTqj8B3unAHVtjnJJWKF'
]


module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    console.log(`deployer: ${deployer}`)

    const chainId = network.config.chainId;

    if (process.env.UPLOAD_TO_PINATA == "true") {
        tokenURIs = await handleTokenURIs()
    }

    let vrfCoordinatorV2Address, subscription_Id, vrfCoordinatorV2Mock

    log("Deploying RandomIPFS_NFT...")

    if (devChains.includes(network.name)) {
        const myContract = await deployments.get("VRFCoordinatorV2Mock");
        vrfCoordinatorV2Mock = await ethers.getContractAt(
            myContract.abi,
            myContract.address
        );

        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.target

        const transactionResponse = await vrfCoordinatorV2Mock.createSubscription()
        const transactionReceipt = await transactionResponse.wait()

        subscription_Id = transactionReceipt.logs[0].args.subId //createSubscription() creates an event and subId
        console.log("Deploy done.")

        console.log("Funding susbcription...")
        //Fund Subscription, needs LINK token on real network
        await vrfCoordinatorV2Mock.fundSubscription(subscription_Id, VRF_SUBSCRIPTION_FUND_AMT)
    }
    else {
        vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"]
        subscription_Id = networkConfig[chainId]["subscription_Id"]

        console.log("Deploying vrfCoordinatorV2Address: ", vrfCoordinatorV2Address)
    }


    const args = [
        vrfCoordinatorV2Address,
        networkConfig[chainId].keyHash,
        subscription_Id,
        networkConfig[chainId].callbackGasLimit,
        tokenURIs,
        networkConfig[chainId].mintFee
    ]
    const RandomNFTContract = await deploy("RandomIPFS_NFT", {
        from: deployer,
        args: args, // contract constructor parameters
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    console.log("RandomNFTContract: ", RandomNFTContract.address)

    if (devChains.includes(network.name)) {
        await vrfCoordinatorV2Mock.addConsumer(
            subscription_Id,
            RandomNFTContract.address
        )
    }


    // verify
    if (!devChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(RandomNFTContract.address, args)
    }
}



async function handleTokenURIs() {
    console.log("Storing Metadata")

    tokenURIs = []

    // store image in IPFS
    // store metadata in IPFS
    const { responses, files } = await storeImages(imageLoc)
    for (i in responses) {
        // create
        let metadata = { ...metadataTemplate }
        metadata.name = files[i].replace(".png", "")
        metadata.description = `Image of ${metadata.name}`
        metadata.imageURI = `ipfs://${responses[i].IpfsHash}`

        //upload JSON
        console.log("Uploading ", metadata.name, "...")
        const mdResponse = await storeMetadata(metadata)
        tokenURIs.push(`ipfs://${mdResponse.IpfsHash}`)
    }
    console.log("Token URIS: ", tokenURIs)
    return tokenURIs;
}


module.exports.tags = ["all", "random", "main"]