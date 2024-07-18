const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Random IPFS NFT Unit Tests", function () {
        let randomIpfsNft, deployer, vrfCoordinatorV2Mock

        beforeEach(async () => {
            accounts = await ethers.getSigners()
            deployer = accounts[0]
            await deployments.fixture(["mocks", "random"])

            const myContract = await deployments.get("RandomIPFS_NFT")
            randomIpfsNft = await ethers.getContractAt(
                myContract.abi,
                myContract.address
            )

            const myContract2 = await deployments.get("VRFCoordinatorV2Mock")
            vrfCoordinatorV2Mock = await ethers.getContractAt(
                myContract2.abi,
                myContract2.address
            )

        })

        describe("constructor", () => {
            it("sets starting values correctly", async function () {
                const NFT_tokens = await randomIpfsNft.getNFT_TokenURIs(0)
                const isInitialized = await randomIpfsNft.getInitialized()
                assert(NFT_tokens.includes("ipfs://"))
                assert.equal(isInitialized, true)
            })
        })

        describe("requestNFT", () => {
            it("fails if payment isn't sent with the request", async function () {
                await expect(randomIpfsNft.requestNFT()).to.be.revertedWith(
                    "RandomIPFS_NFT__NotEnoughETH"
                )
            })
            it("reverts if payment amount is less than the mint fee", async function () {
                const fee = await randomIpfsNft.getMintFee()
                await expect(
                    randomIpfsNft.requestNFT({
                        value: fee.sub(ethers.utils.parseEther("0.001")),
                    })
                ).to.be.revertedWith("RandomIPFS_NFT__NotEnoughETH")
            })
            it("emits an event and kicks off a random word request", async function () {
                const fee = await randomIpfsNft.getMintFee()
                await expect(randomIpfsNft.requestNFT({ value: fee.toString() })).to.emit(
                    randomIpfsNft,
                    "NFT_Requested"
                )
            })
        })
        describe("fulfillRandomWords", () => {
            it("mints NFT after random number is returned", async function () {
                await new Promise(async (resolve, reject) => {
                    randomIpfsNft.once("NFT_Minted", async (tokenId, breed, minter) => {
                        try {
                            const tokenUri = await randomIpfsNft.tokenURI(tokenId.toString())
                            const tokenCounter = await randomIpfsNft.getTokenCounter()
                            const dogUri = await randomIpfsNft.getNFT_TokenURIs(breed.toString());
                            assert.equal(tokenUri.toString().includes("ipfs://"), true)
                            assert.equal(dogUri.toString(), tokenUri.toString())
                            assert.equal(+tokenCounter.toString(), +tokenId.toString() + 1)
                            assert.equal(minter, deployer.address)
                            resolve()
                        } catch (e) {
                            console.log(e)
                            reject(e)
                        }
                    })
                    try {
                        const fee = await randomIpfsNft.getMintFee()
                        const requestNFTResponse = await randomIpfsNft.requestNFT({
                            value: fee.toString(),
                        })
                        const requestNFTReceipt = await requestNFTResponse.wait(1)
                        await vrfCoordinatorV2Mock.fulfillRandomWords(
                            requestNFTReceipt.logs[1].args.requestId,
                            randomIpfsNft.address
                        )
                    } catch (e) {
                        console.log(e)
                        reject(e)
                    }
                })
            })
        })
        describe("getBreedFromNumber", () => {
            it("should return pug if moddedRng < 10", async function () {
                const expectedValue = await randomIpfsNft.getBreedFromNumber(7)
                assert.equal(0, expectedValue)
            })
            it("should return shiba-inu if moddedRng is between 10 - 39", async function () {
                const expectedValue = await randomIpfsNft.getBreedFromNumber(21)
                assert.equal(1, expectedValue)
            })
            it("should return st. bernard if moddedRng is between 40 - 99", async function () {
                const expectedValue = await randomIpfsNft.getBreedFromNumber(77)
                assert.equal(2, expectedValue)
            })
            it("should revert if moddedRng > 99", async function () {
                await expect(randomIpfsNft.getBreedFromNumber(100)).to.be.revertedWith(
                    "RandomIPFS_NFT__RangeOutOfBounds"
                )
            })
        })
    })