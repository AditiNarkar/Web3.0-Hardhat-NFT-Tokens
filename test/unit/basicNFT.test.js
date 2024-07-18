const { network, ethers, deployments } = require("hardhat");
const { devChains } = require("../../helper-hardhat-config");
const { assert } = require("chai");

console.log("name: ", network.name)
console.log("network:", network)
!devChains.includes(network.name)
    ? describe.skip
    : describe(" Basic NFT Unit Tests...", () => {
        let deployer, basicNFTContract

        beforeEach(async () => {
            deployer = (await ethers.getSigners())[0]
            console.log(`UT Deployer: ${deployer}`)

            // set up a deterministic state for your smart contract deployments. 
            // ensures that the deployment scripts are only executed once per test run or per set of tests, and the state can be reused, which speeds up the testing process significantly.
            await deployments.fixture(["BasicNFT"])
            console.log(`Deployments; ${deployments}`)

            const myContract = await deployments.get("BasicNFT")
            console.log(`myContract; ${myContract}`)

            basicNFTContract = await ethers.getContractAt(
                myContract.abi,
                myContract.address
            )
        })

        describe("Contructor", () => {
            it("Initializes constructor correctly.", async () => {
                const name = await basicNFTContract.name()
                const symbol = await basicNFTContract.symbol()
                const TC = await basicNFTContract.getTokenCounter()
                assert.equal(name, "Doggie")
                assert.equal(symbol, "DOG")
                assert.equal(TC.toString(), "0")
            })
        })

        describe("Mint NFT", () => {
            beforeEach(async () => {
                const mintTx = await basicNFTContract.mintNFT()
                await mintTx.wait(1)
            })

            it("updates after minting", async () => {
                const tokenURI = await basicNFTContract.tokenURI(0)
                assert(tokenURI, basicNFTContract.TOKEN_URI())

                const TC = await basicNFTContract.getTokenCounter()
                assert(TC.toString(), "1")
            })

            it("Shows correct balance and owner of NFT", async () => {
                const balance = await basicNFTContract.balanceOf(deployer)
                assert(balance.toString(), "1")

                const owner = await basicNFTContract.ownerOf("0")
                assert(owner.toString(), deployer)
            })
        })
    })