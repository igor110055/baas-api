const Web3 = require("web3");
const config = require("../../config.json");
const { getBSCBalance } = require("../admin/admin.service");
const tokenABI = require("../token/tokenAbi.json");
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
const AUTO = config.AUTO;
const MBOX = config.MBOX;
const USDT = config.USDT;
const httpEndPointInfura = config.connectionURL;
var web3 = new Web3(new Web3.providers.HttpProvider(httpEndPointInfura));
const httpEndPointInfuraBSC = config.connectionURL1;
var web3BSC = new Web3(new Web3.providers.HttpProvider(httpEndPointInfuraBSC));

module.exports = {
  BalanceOF: async (req, newUser) => {
    try {
      let userAddress = "";
      if (req.query.userAddress) {
        if (req.query.userAddress == null) {
          return { status: "false", message: "userAddress not found" };
        } else {
          console.log("--------inside-Blockchain----------", req.query);
          userAddresswbtc = req.query.wbtcAddress;
          userAddressweth = req.query.wethAddress;
          userAddressbusd = req.query.busdAddress;
          userAddressprv = req.query.prvAddress;
          userAddressbnb = req.query.bnbAddress;
          userAddressUSDC = req.query.USDCAddress;
          userAddressCake = req.query.CakeAddress;
          userAddressXVS = req.query.XVSAddress;
          userAddressALPACA = req.query.ALPACAAddress;
          userAddressEPS = req.query.EPSAddress;
          userAddressMDX = req.query.MDXAddress;
          userAddressAUTO = req.query.AUTOAddress;
          userAddressMBOX = req.query.MBOXAddress;
          userAddressUSDT = req.query.USDTAddress;
        }
      } else {
        return { status: "false", message: "userAddress not found" };
      }

      let wbtcBalance = await getBSCBalance(userAddresswbtc,'WBTC');
      let wethBalance = await getBSCBalance(userAddressweth,'WETH');
      let busdBalance = await getBSCBalance(userAddressbusd,'BUSD');
      let prvBalance = await getBSCBalance(userAddressprv,'PRV');
      let USDCBalance = await getBSCBalance(userAddressprv,'CAKE');
      let CakeBalance = await getBSCBalance(userAddressprv,'CAKE');
      let XVSBalance = await getBSCBalance(userAddressprv,'XVS');
      let ALPACABalance = await getBSCBalance(userAddressprv,'ALPACA');
      let EPSBalance = await getBSCBalance(userAddressprv,'EPS');
      let MDXBalance = await getBSCBalance(userAddressprv,'MDX');
      let MBOXBalance = await getBSCBalance(userAddressprv,'MBOX');
      let USDTBalance = await getBSCBalance(userAddressprv,'USDT');

      

      /* console.log("--------WBTC----------");
      var WBTCcontract = await new web3.eth.Contract(tokenABI, WBTC);
      let wbtcBalance = await WBTCcontract.methods
        .balanceOf(userAddresswbtc)
        .call();
      console.log("--------WBTC-BALANCE----------", wbtcBalance);
      var WETHcontract = await new web3.eth.Contract(tokenABI, WETH);
      let wethBalance = await WETHcontract.methods
        .balanceOf(userAddressweth)
        .call();

      var BUSDcontract = await new web3BSC.eth.Contract(tokenABI, BUSD);
      let busdBalance = await BUSDcontract.methods
        .balanceOf(userAddressbusd)
        .call();

      var PRVcontract = await new web3BSC.eth.Contract(tokenABI, PRV);
      let prvBalance = await PRVcontract.methods
        .balanceOf(userAddressprv)
        .call();

      let bnbBalance = await web3BSC.eth.getBalance(userAddressbnb);

      var USDCcontract = await new web3BSC.eth.Contract(tokenABI, USDC);
      let USDCBalance = await USDCcontract.methods
        .balanceOf(userAddressUSDC)
        .call();

      var Cakecontract = await new web3BSC.eth.Contract(tokenABI, Cake);
      let CakeBalance = await Cakecontract.methods
        .balanceOf(userAddressCake)
        .call();

      var XVScontract = await new web3BSC.eth.Contract(tokenABI, XVS);
      let XVSBalance = await XVScontract.methods
        .balanceOf(userAddressXVS)
        .call();

      var ALPACAcontract = await new web3BSC.eth.Contract(tokenABI, ALPACA);
      let ALPACABalance = await ALPACAcontract.methods
        .balanceOf(userAddressALPACA)
        .call();

      var EPScontract = await new web3BSC.eth.Contract(tokenABI, EPS);
      let EPSBalance = await EPScontract.methods
        .balanceOf(userAddressEPS)
        .call();

      var MDXcontract = await new web3BSC.eth.Contract(tokenABI, MDX);
      let MDXBalance = await MDXcontract.methods
        .balanceOf(userAddressMDX)
        .call();

      var AUTOcontract = await new web3BSC.eth.Contract(tokenABI, AUTO);
      let AUTOBalance = await AUTOcontract.methods
        .balanceOf(userAddressAUTO)
        .call();

      var MBOXcontract = await new web3BSC.eth.Contract(tokenABI, MBOX);
      let MBOXBalance = await MBOXcontract.methods
        .balanceOf(userAddressMBOX)
        .call();

      var USDTcontract = await new web3BSC.eth.Contract(tokenABI, USDT);
      let USDTBalance = await USDTcontract.methods
        .balanceOf(userAddressUSDT)
        .call(); */

      const UserBalance = {
        status: "true",
        message: "Balance fetched successful",
        btcb: wbtcBalance,
        eth: wethBalance,
        bnb: bnbBalance,
        busd: busdBalance,
        PRV: prvBalance,
        USDC: USDCBalance,
        Cake: CakeBalance,
        XVS: XVSBalance,
        ALPACA: ALPACABalance,
        EPS: EPSBalance,
        MDX: MDXBalance,
        AUTO: AUTOBalance,
        MBOX: MBOXBalance,
        USDT: USDTBalance,
      };

      console.log(
        "---------------User Balance Fetched---------------",
        UserBalance
      );
      if (UserBalance.status == "true") {
        Object.assign(newUser, UserBalance);
      }

      console.log("NEW UPDATED BALANCE", newUser);
      await newUser.save();
      console.log(
        "---------------User-Balance-Updated-Successfully---------------"
      );
    } catch (err) {
      console.log("error in getting balance", err);
      return {
        status: "false",
        message: "error in getting balance",
        error: err,
      };
    }
  },
};
