
// same as hardhat-simple-storage deploy.js
const { run } = require("hardhat");

async function verify(contractAddress, args) {
    console.log("Verifying, please wait...");
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args
        })
    }
    catch (e) {
        console.warn("verification error: ", e)
    }
}

module.exports = { verify }