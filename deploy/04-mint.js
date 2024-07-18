// each contract should mint NFT


const { network, deployments, ethers } = require("hardhat")
const { devChains } = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
    console.log("---------------------------")
    console.log("Running mint.js...")

    const { deploy, log } = deployments
    const deployer = (await getNamedAccounts()).deployer
    console.log("Mint deployer: ", deployer)

    const signer = await ethers.provider.getSigner();
    console.log("Mint signer: ", signer.address)


    // Basic NFT
    const BasicNFT = await deployments.get("BasicNFT");
    const BasicNFTContract = await ethers.getContractAt(
        BasicNFT.abi,
        BasicNFT.address,

    )
    const basicNFTtx = await BasicNFTContract.mintNFT()
    await basicNFTtx.wait(1)
    console.log("Basic NFT at index 0 has token URI: ", (await BasicNFTContract.tokenURI(0)))

    // Random NFT
    const RandomNFT = await deployments.get("RandomIPFS_NFT");
    const RandomNFTContract = await ethers.getContractAt(
        RandomNFT.abi,
        RandomNFT.address,
        signer
    )

    const mintFee = await RandomNFTContract.getMintFee()
    console.log("mint fee: ", mintFee)

    await new Promise(async (resolve, reject) => {
        setTimeout(resolve, 300000) // 5 mins
        RandomNFTContract.on("NFT_Minted", async () => {
            console.log("Resolving...")
            resolve()
        })

        const randomNFTtx = await RandomNFTContract.requestNFT({ value: mintFee.toString() })
        const randomNFTtxReciept = await randomNFTtx.wait(1)

        if (devChains.includes(network.name)) {
            const requestId = randomNFTtxReciept.logs[1].args.reqID.toString()
            console.log("requestId: ", requestId)

            const vrf = await deployments.get("VRFCoordinatorV2Mock");
            const vrfCoordinatorV2Mock = await ethers.getContractAt(
                vrf.abi,
                vrf.address,
                signer
            )
            console.log("target: ", RandomNFTContract.target)

            vrfCoordinatorV2Mock.fulfillRandomWords(requestId, RandomNFTContract.target)

            const tc = await RandomNFTContract.getTokenCounter()
            console.log("tc: ", tc)
            console.log("Random NFT at index 0 has token URI: ", (await RandomNFTContract.getNFT_TokenURIs(tc)))
        }
    })


    // Dynamic NFT
    const highValue = ethers.parseEther("4000")
    const dynamic = await deployments.get("DynamicNFT");
    const dynamicNFT = await ethers.getContractAt(
        dynamic.abi,
        dynamic.address,
        signer
    )
    const dynamicNFTtx = await dynamicNFT.mintNFT(highValue.toString())
    await dynamicNFTtx.wait(1)
    console.log("Dynamic NFT at index 0 has token URI: ", (await dynamicNFT.tokenURI(0)))

}

module.exports.tags = ["all", "mint"]