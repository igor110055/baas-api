const Web3 = require("web3");
const config = require('../../config.json');
const tokenABI = require('./tokenAbi.json');
const WBTC = config.WBTC;
const WETH = config.WETH;
const BUSD = config.BUSD;
const PRV = config.PRV;
const USDC = config.USDC;
const Cake = config.Cake;
const XVS = config.XVS;
const ALPACA = config.ALPACA;
const EPS = config.EPS;
const MDX = config.MDX;
const AUTO  = config.AUTO;
const MBOX = config.MBOX;
const USDT = config.USDT;
const httpEndPointInfura = config.connectionURL;
var web3 = new Web3(new Web3.providers.HttpProvider(httpEndPointInfura));
const httpEndPointInfuraBSC = config.connectionURL1;
var web3BSC = new Web3(new Web3.providers.HttpProvider(httpEndPointInfuraBSC));


module.exports = {
    BalanceOF:  async(req, res) => {
        try{
            let userAddress = '';
            if(!!req.query.userAddress){
                if(req.query.userAddress==null){
                    return res.send({"status": "false", "message": "userAddress not found"})
                } else {
                    userAddress = (req.query.userAddress);
                }    
            } else {
                return res.send({"status": "false", "message": "userAddress not found"})
            }
            
            var WBTCcontract = await new web3.eth.Contract(tokenABI,WBTC)
            let wbtcBalance = await WBTCcontract.methods.balanceOf(userAddress).call()

            var WETHcontract = await new web3.eth.Contract(tokenABI,WETH)
            let wethBalance = await WETHcontract.methods.balanceOf(userAddress).call()

            var BUSDcontract = await new web3BSC.eth.Contract(tokenABI,BUSD)
            let busdBalance = await BUSDcontract.methods.balanceOf(userAddress).call()

            var PRVcontract = await new web3BSC.eth.Contract(tokenABI,PRV)
            let prvBalance = await PRVcontract.methods.balanceOf(userAddress).call()

            let bnbBalance = await web3BSC.eth.getBalance(userAddress)

            var USDCcontract = await new web3BSC.eth.Contract(tokenABI,USDC)
            let USDCBalance = await USDCcontract.methods.balanceOf(userAddress).call()
            
            var Cakecontract = await new web3BSC.eth.Contract(tokenABI,Cake)
            let CakeBalance = await Cakecontract.methods.balanceOf(userAddress).call()
            
            var XVScontract = await new web3BSC.eth.Contract(tokenABI,XVS)
            let XVSBalance = await XVScontract.methods.balanceOf(userAddress).call()

            var ALPACAcontract = await new web3BSC.eth.Contract(tokenABI,ALPACA)
            let ALPACABalance = await ALPACAcontract.methods.balanceOf(userAddress).call()

            var EPScontract = await new web3BSC.eth.Contract(tokenABI,EPS)
            let EPSBalance = await EPScontract.methods.balanceOf(userAddress).call()

            var MDXcontract = await new web3BSC.eth.Contract(tokenABI,MDX)
            let MDXBalance = await MDXcontract.methods.balanceOf(userAddress).call()

            var AUTOcontract = await new web3BSC.eth.Contract(tokenABI,AUTO)
            let AUTOBalance = await AUTOcontract.methods.balanceOf(userAddress).call()

            var MBOXcontract = await new web3BSC.eth.Contract(tokenABI,MBOX)
            let MBOXBalance = await MBOXcontract.methods.balanceOf(userAddress).call()

            var USDTcontract = await new web3BSC.eth.Contract(tokenABI,USDT)
            let USDTBalance = await USDTcontract.methods.balanceOf(userAddress).call()

            res.send({"status":"true", "message": "Balance fetched successful" , 
                        "WBTC" : wbtcBalance, "WETH": wethBalance, "BNB" : bnbBalance, "BUSD": busdBalance, "PRV": prvBalance,
                        "USDC":USDCBalance, "Cake":CakeBalance, "XVS":XVSBalance, "ALPACA":ALPACABalance, "EPS":EPSBalance, 
                        "MDX":MDXBalance, "AUTO":AUTOBalance , "MBOX":MBOXBalance , "USDT":USDTBalance 
                    })
                            
        }catch(err){
            console.log("error in getting balance",err)
            res.send({"status":"false", "message":"error in getting balance", "error": err})
        }
    },
}