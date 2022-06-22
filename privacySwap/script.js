var Web3 = require("web3");
const fetch = require('node-fetch');
const path = require('path');
var fs = require('fs').promises;

var cronJob = require('cron').CronJob;

const web3 = new Web3(new Web3.providers.HttpProvider('https://bsc-dataseed.binance.org/'));

var cronJ1 = new cronJob("*/1 * * * *", async function () {
    checkPending()
}, undefined, true, "GMT");


async function checkPending() {
    tokenBlockData = await fs.readFile(path.resolve(__dirname, 'blockdata.json'), "binary");
    tokenBlockData = JSON.parse(tokenBlockData)
    tokenLastBlock = tokenBlockData["lastblock"]

    const latest = await web3.eth.getBlockNumber();
    console.log(tokenLastBlock, latest)
    tokenBlockData["lastblock"] = latest;

    response = await fetch(`https://api.bscscan.com/api?module=account&action=tokentx&address=0x64aD58E3002E6569C9dAcD317D92Fe82b2862f36&startblock=${tokenLastBlock}&sort=asc&apikey=WT4ZSGEMCG63TE8IEFU8RPNJ1RIPBC5GJB`)
    data = await response.json()
    result = data["result"]
    for (i = 0; i < result.length; i++)
        updateTokenBalance(result[i])


    response = await fetch(`https://api.bscscan.com/api?module=account&action=txlist&address=0x64aD58E3002E6569C9dAcD317D92Fe82b2862f36&startblock=${tokenLastBlock}&sort=asc&apikey=WT4ZSGEMCG63TE8IEFU8RPNJ1RIPBC5GJB`)
    data = await response.json()
    result = data["result"]
    for (i = 0; i < result.length; i++)
        updateBNBBalance(result[i])

    fs.writeFile(path.resolve(__dirname, 'blockdata.json'), JSON.stringify(tokenBlockData), (err) => {
        if (err);
        console.log(err);
    });
}

function updateTokenBalance(input) {

    sender = input["from"]
    receiver = input["to"]
    tokenAddress = input["contractAddress"]
    amount = input["value"]

    if (receiver != 0x64aD58E3002E6569C9dAcD317D92Fe82b2862f36)
        return;

    //TODO: Look into database and find to whom sender(address) is whitlisted;
    // return @name: username to whom sender address is whitelisted

    if (tokenAddress = "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c") {
        // TODO: update BTCB balance of this user(@name) in database
        // newBalance= prevBalance + amount/1e18
    } else if (tokenAddress = "0x2170ed0880ac9a755fd29b2688956bd959f933f8") {
        // TODO: update ETH balance of this user(@name) in database
        // newBalance= prevBalance + amount/1e18
    } else if (tokenAddress = "0xe9e7cea3dedca5984780bafc599bd69add087d56") {
        // TODO: update BUSD balance of this user(@name) in database
        // newBalance= prevBalance + amount/1e18
    }else if (tokenAddress = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d") {
        // TODO: update BUSD balance of this user(@name) in database
        // newBalance= prevBalance + amount/1e18
    }else if (tokenAddress = "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82") {
        // TODO: update BUSD balance of this user(@name) in database
        // newBalance= prevBalance + amount/1e18
    }else if (tokenAddress = "0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63") {
        // TODO: update BUSD balance of this user(@name) in database
        // newBalance= prevBalance + amount/1e18
    }else if (tokenAddress = "0x8F0528cE5eF7B51152A59745bEfDD91D97091d2F") {
        // TODO: update BUSD balance of this user(@name) in database
        // newBalance= prevBalance + amount/1e18
    }else if (tokenAddress = "0xA7f552078dcC247C2684336020c03648500C6d9F") {
        // TODO: update BUSD balance of this user(@name) in database
        // newBalance= prevBalance + amount/1e18
    }else if (tokenAddress = "0x9C65AB58d8d978DB963e63f2bfB7121627e3a739") {
        // TODO: update BUSD balance of this user(@name) in database
        // newBalance= prevBalance + amount/1e18
    }else if (tokenAddress = "0xa184088a740c695E156F91f5cC086a06bb78b827") {
        // TODO: update BUSD balance of this user(@name) in database
        // newBalance= prevBalance + amount/1e18
    }else if (tokenAddress = "0x3203c9E46cA618C8C1cE5dC67e7e9D75f5da2377") {
        // TODO: update BUSD balance of this user(@name) in database
        // newBalance= prevBalance + amount/1e18
    }else if (tokenAddress = "0x55d398326f99059fF775485246999027B3197955") {
        // TODO: update BUSD balance of this user(@name) in database
        // newBalance= prevBalance + amount/1e18
    }




}

function updateBNBBalance(input) {

    sender = input["from"]
    receiver = input["to"]
    tokenAddress = input["contractAddress"]
    amount = input["value"]

    if (receiver != 0x64aD58E3002E6569C9dAcD317D92Fe82b2862f36 && tokenAddress != "")
        return;

    //TODO: Look into database and find to whom sender(address) is whitlisted;
    // return @name: username to whom sender address is whitelisted

    // TODO: update BNB balance of this user(@name) in database
    // newBalance= prevBalance + amount/1e18






}
cronJ1.start();
