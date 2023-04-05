import { ethers } from "ethers"
import { setTimeout } from "timers/promises"
import { BridgeTimelockController__factory, ERC20__factory } from "./typechain-types"

if (!process.env.NETWORK_1_BRIDGE_ADDRESS
    || !process.env.NETWORK_2_BRIDGE_ADDRESS
    || !process.env.OPERATOR_PRIVATE_KEY
    || !process.env.NETWORK_1_JSON_RPC_URL
    || !process.env.NETWORK_2_JSON_RPC_URL
    || !process.env.NETWORK_1_CHAIN_ID
    || !process.env.NETWORK_2_CHAIN_ID) {
    console.log("please define all environment variables!")

}

const NETWORK_1_BRIDGE_ADDRESS = process.env.NETWORK_1_BRIDGE_ADDRESS ?? ""
const NETWORK_2_BRIDGE_ADDRESS = process.env.NETWORK_2_BRIDGE_ADDRESS ?? ""
const OPERATOR_PRIVATE_KEY = process.env.OPERATOR_PRIVATE_KEY ?? ""
const NETWORK_1_JSON_RPC_URL = process.env.NETWORK_1_JSON_RPC_URL ?? ""
const NETWORK_2_JSON_RPC_URL = process.env.NETWORK_2_JSON_RPC_URL ?? ""
const NETWORK_1_CHAIN_ID = process.env.NETWORK_1_CHAIN_ID ?? ""
const NETWORK_2_CHAIN_ID = process.env.NETWORK_2_CHAIN_ID ?? ""

const wallet = new ethers.Wallet(OPERATOR_PRIVATE_KEY)

const network1Provider = new ethers.providers.JsonRpcProvider(NETWORK_1_JSON_RPC_URL)
const network1Signer = wallet.connect(network1Provider)

const network2Provider = new ethers.providers.JsonRpcProvider(NETWORK_2_JSON_RPC_URL)
const network2Signer = wallet.connect(network2Provider)

const bridge1 = BridgeTimelockController__factory.connect(NETWORK_1_BRIDGE_ADDRESS, network1Signer)
const bridge2 = BridgeTimelockController__factory.connect(NETWORK_2_BRIDGE_ADDRESS, network2Signer)

//set up 1-2-initialize-relayer
const sourceTransferInitFilter1 = bridge1.filters.SourceTransferInit()
bridge1.on(sourceTransferInitFilter1, async (recipient, targetToken, targetChainId, value, commitment, sender, sourceToken) => {
    try {
        const token = await ERC20__factory.connect(targetToken, network2Signer)
        const tx1 = await token.increaseAllowance(bridge2.address, value, { gasLimit: 21000 * 10 })
        const txReceipt1 = await tx1.wait()

        const tx = await bridge2.forwardTransferFromOtherChain(recipient, targetToken, value, commitment, sender, sourceToken, NETWORK_1_CHAIN_ID, { gasLimit: 21000 * 10 })
        const txReceipt = await tx.wait()
        console.log(txReceipt)
    } catch (error) {
        console.error(error)
    }
})

//set up 2-1-initialize-relayer
const sourceTransferInitFilter2 = bridge2.filters.SourceTransferInit()
bridge2.on(sourceTransferInitFilter2, async (recipient, targetToken, targetChainId, value, commitment, sender, sourceToken) => {
    try {
        const token = await ERC20__factory.connect(targetToken, network1Signer)
        const tx1 = await token.increaseAllowance(bridge1.address, value, { gasLimit: 21000 * 10 })
        const txReceipt1 = await tx1.wait()

        const tx = await bridge1.forwardTransferFromOtherChain(recipient, targetToken, value, commitment, sender, sourceToken, NETWORK_2_CHAIN_ID, { gasLimit: 21000 * 10 })
        const txReceipt = await tx.wait()
        console.log(txReceipt)
    } catch (error) {
        console.error(error)
    }
})

//set up 1-2-finalize-relayer
const destinationTransferFinalizedFilter1 = bridge1.filters.DestinationTransferFinalized()
bridge2.on(destinationTransferFinalizedFilter1, async (commitment, preImageSalt, sender, sourceToken, value, sourceChainId) => {
    const tx = await bridge1.finalizeTransferToOtherChain(commitment, preImageSalt, sender, sourceToken, value, { gasLimit: 21000 * 10 })
    const txReceipt = await tx.wait()
    console.log(txReceipt)
})

//set up 2-1-finalize-relayer
const destinationTransferFinalizedFilter2 = bridge2.filters.DestinationTransferFinalized()
bridge1.on(destinationTransferFinalizedFilter2, async (commitment, preImageSalt, sender, sourceToken, value, sourceChainId) => {
    const tx = await bridge2.finalizeTransferToOtherChain(commitment, preImageSalt, sender, sourceToken, value, { gasLimit: 21000 * 10 })
    const txReceipt = await tx.wait()
    console.log(txReceipt)
})

const run = async () => {
    while (true) {
        console.log("still running")
        await setTimeout(1000000)
    }
}

run().catch(console.error)