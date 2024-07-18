// Pinata makes it simple to store and retrieve media on IPFS and build social applications 
// The Pinata NodeJS SDK provides the quickest / easiest path for interacting with the Pinata API.

const pinataSDK = require("@pinata/sdk")
const path = require("path")
const fs = require("fs")
require("dotenv").config()

const PINATA_API_KEY = process.env.PINATA_API_KEY
const PINATA_API_SECRET = process.env.PINATA_API_SECRET
const pinata = new pinataSDK(PINATA_API_KEY, PINATA_API_SECRET)

async function storeImages(location) {
    const imgPath = path.resolve(location)
    const files = fs.readdirSync(imgPath)
    console.log(`files: ${files}`)

    let responses = []
    for(i in files){
        console.log(`Working on ${i}...`)
        const readStream = fs.createReadStream(`${imgPath}/${files[i]}`)
        const options = {
            pinataMetadata: {
                name: files[i],
            },
        }
        try{    
            const response = await pinata.pinFileToIPFS(readStream, options)
            responses.push(response)
        }
        catch (error){
            console.log("uploadd:", error)
        }
    }
    return { responses, files }
}


async function storeMetadata(metadata){
    try{
        const response = await pinata.pinJSONToIPFS(metadata)
        return response
    }
    catch(e){
        console.log(e)
    }
    return null
}


module.exports ={ storeImages, storeMetadata}