const Web3 = require("web3");
const config = require("../../config.json");
const tokenABI = require("../token/token2Abi.json");
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
const wallet = '0x10c63ed81eF4187468544BB913aF070Cf4C5719a'.toLowerCase();
const httpEndPointInfura = config.connectionURL;
var web3 = new Web3(new Web3.providers.HttpProvider(httpEndPointInfura));
const httpEndPointInfuraBSC = config.connectionURL1;
var web3BSC = new Web3(new Web3.providers.HttpProvider(httpEndPointInfuraBSC));
var fs = require("fs");
var path = require("path");

module.exports = {
  blocknumber: async (block, res) => {
    try {

      fs.readFile(
        path.resolve(__dirname, "bscBlock.json"),
        async (err, blockData) => {
          if (err) {
            console.log(err);
            return;
          }

          blockData = JSON.parse(blockData);
          let lastcheckBlock = blockData["lastblock"];
          let latest =  4999 + Number(lastcheckBlock)
          let blockLatest =  await web3.eth.getBlockNumber();
          
          if(latest >= blockLatest){
            latest = blockLatest;
          }
       
    
    
          fs.writeFile(
            path.resolve(__dirname, "./bscBlock.json"),
            JSON.stringify({ lastblock: latest }),
            (err) => {
              if (err)
              console.log(err);
            }
          );




        });
    
     
    } catch (err) {
      console.log("error in getting balance", err);
      res.send({
        status: "false",
        message: "error in getting balance",
        error: err,
      });
    }
  },
  updateEthblocknumber: async (block, res) => {
    try {
      fs.readFile(
        path.resolve(__dirname, "ethBlock.json"),
        async (err, blockData) => {
          if (err) {
            console.log(err);
            return;
          }

          blockData = JSON.parse(blockData);
          let lastcheckBlock = blockData["lastblock"];
          let latest =  4999 + Number(lastcheckBlock)
          let blockLatest =  await web3.eth.getBlockNumber();
          
          if(latest >= blockLatest){
            latest = blockLatest;
          }
       
    
    
          fs.writeFile(
            path.resolve(__dirname, "./ethBlock.json"),
            JSON.stringify({ lastblock: latest }),
            (err) => {
              if (err)
              console.log(err);
            }
          );




        });
    } catch (err) {
      console.log("error in getting balance", err);
      res.send({
        status: "false",
        message: "error in getting balance",
        error: err,
      });
    }
  },

  WBTCBalance: async (req, res, user) => {
    try {
      let userAddress = "";
      if (!!req.query.userAddress) {
        if (req.query.userAddress == null) {
          return res.send({
            status: "false",
            message: "userAddress not found",
          });
        } else {
          userAddress = req.query.userAddress;
        }
      } else {
        return res.send({ status: "false", message: "userAddress not found" });
      }

      var WBTCcontract = await new web3.eth.Contract(tokenABI, WBTC);
      console.log("---WBTC contract fetched--------------");
      fs.readFile(
        path.resolve(__dirname, "ethBlock.json"),
        async (err, blockData) => {
          if (err) {
            console.log(err);
            return;
          }

          blockData = JSON.parse(blockData);
          let lastcheckBlock = blockData["lastblock"];
          let latest =  4999 + Number(lastcheckBlock)
          let blockLatest =  await web3.eth.getBlockNumber();//4999 + Number(lastcheckBlock)
          if(latest>blockLatest){
            latest = blockLatest;
          }

          console.log(lastcheckBlock, latest);

          WBTCcontract.getPastEvents(
            {},
            {
              fromBlock: lastcheckBlock,
              toBlock: latest, // You can also specify 'latest'
            }
          )
            .then(async function (resp) {
              for (let i = 0; i < resp.length; i++) {
                if (resp[i].event === "Transfer") {
                  if (resp[i].returnValues.to.toLowerCase()=== wallet) {
                    console.log("Transfer");
                    SaveTrxinDB(resp[i], "btcb", user);
                  }
                }
              }
            })
            .catch((err) => console.error(err));
        }
      );
      res.send({ status: "true", message: "Balance fetched successful" });
    } catch (err) {
      console.log("error in getting balance", err);
      res.send({
        status: "false",
        message: "error in getting balance",
        error: err,
      });
    }
  },

  WETHBalance: async (req, res, user) => {
    try {
      let userAddress = "";
      if (!!req.query.userAddress) {
        if (req.query.userAddress == null) {
          return res.send({
            status: "false",
            message: "userAddress not found",
          });
        } else {
          userAddress = req.query.userAddress;
        }
      } else {
        return res.send({ status: "false", message: "userAddress not found" });
      }

      var WETHcontract = await new web3.eth.Contract(tokenABI, WETH);

      fs.readFile(
        path.resolve(__dirname, "ethBlock.json"),
        async (err, blockData) => {
          if (err) {
            console.log(err);
            return;
          }

          blockData = JSON.parse(blockData);
          let lastcheckBlock = blockData["lastblock"];
          let latest =  4999 + Number(lastcheckBlock)
          let blockLatest =  await web3.eth.getBlockNumber();//4999 + Number(lastcheckBlock)
          if(latest>blockLatest){
            latest = blockLatest;
          }
          console.log(lastcheckBlock, latest);

          WETHcontract.getPastEvents(
            {},
            {
              fromBlock: lastcheckBlock,
              toBlock: latest, // You can also specify 'latest'
            }
          )
            .then(async function (resp) {
              for (let i = 0; i < resp.length; i++) {
                if (resp[i].event === "Transfer") {
                  if (resp[i].returnValues.to.toLowerCase()=== wallet) {
                    console.log("Transfer");
                    SaveTrxinDB(resp[i], "eth", user);
                  }
                }
              }
            })
            .catch((err) => console.error(err));
        }
      );
      res.send({ status: "true", message: "Balance fetched successful" });
    } catch (err) {
      console.log("error in getting balance", err);
      res.send({
        status: "false",
        message: "error in getting balance",
        error: err,
      });
    }
  },

  BUSDBalance: async (req, res, user) => {
    try {
      let userAddress = "";
      if (!!req.query.userAddress) {
        if (req.query.userAddress == null) {
          return res.send({
            status: "false",
            message: "userAddress not found",
          });
        } else {
          userAddress = req.query.userAddress;
        }
      } else {
        return res.send({ status: "false", message: "userAddress not found" });
      }

      var BUSDcontract = await new web3BSC.eth.Contract(tokenABI, BUSD);

      fs.readFile(
        path.resolve(__dirname, "bscBlock.json"),
        async (err, blockData) => {
          if (err) {
            console.log(err);
            return;
          }

          blockData = JSON.parse(blockData);
          let lastcheckBlock = blockData["lastblock"];
          let latest =  4999 + Number(lastcheckBlock)
          let blockLatest =  await web3.eth.getBlockNumber();//4999 + Number(lastcheckBlock)
          if(latest>blockLatest){
            latest = blockLatest;
          }

          BUSDcontract.getPastEvents(
            {},
            {
              fromBlock: lastcheckBlock,
              toBlock: latest, // You can also specify 'latest'
            }
          )
            .then(async function (resp) {
                console.log(resp,"response");
              for (let i = 0; i < resp.length; i++) {
                if (resp[i].event === "Transfer") {
                  if (resp[i].returnValues.to.toLowerCase()=== wallet) {
                    console.log("Transfer");
                    SaveTrxinDB(resp[i], "busd", user);
                  }
                }
              }
            })
            .catch((err) => console.error(err));
        }
      );
      res.send({ status: "true", message: "Balance fetched successful" });
    } catch (err) {
      console.log("error in getting balance", err);
      res.send({
        status: "false",
        message: "error in getting balance",
        error: err,
      });
    }
  },

  PRVBalance: async (req, res, user) => {
    try {
      let userAddress = "";
      if (!!req.query.userAddress) {
        if (req.query.userAddress == null) {
          return res.send({
            status: "false",
            message: "userAddress not found",
          });
        } else {
          userAddress = req.query.userAddress;
        }
      } else {
        return res.send({ status: "false", message: "userAddress not found" });
      }

      var PRVcontract = await new web3BSC.eth.Contract(tokenABI, PRV);

      fs.readFile(
        path.resolve(__dirname, "bscBlock.json"),
        async (err, blockData) => {
          if (err) {
            console.log(err);
            return;
          }

          blockData = JSON.parse(blockData);
          let lastcheckBlock = blockData["lastblock"];
          let latest =  4999 + Number(lastcheckBlock)
          let blockLatest =  await web3.eth.getBlockNumber();//4999 + Number(lastcheckBlock)
          if(latest>blockLatest){
            latest = blockLatest;
          }

          PRVcontract.getPastEvents(
            {},
            {
              fromBlock: lastcheckBlock,
              toBlock: latest, // You can also specify 'latest'
            }
          )
            .then(async function (resp) {
              for (let i = 0; i < resp.length; i++) {
                if (resp[i].event === "Transfer") {
                  if (resp[i].returnValues.to.toLowerCase()=== wallet) {
                    console.log("Transfer");
                    SaveTrxinDB(resp[i], "PRV", user);
                  }
                }
              }
            })
            .catch((err) => console.error(err));
        }
      );
      res.send({ status: "true", message: "Balance fetched successful" });
    } catch (err) {
      console.log("error in getting balance", err);
      res.send({
        status: "false",
        message: "error in getting balance",
        error: err,
      });
    }
  },

  USDCBalance: async (req, res, user) => {
    try {
      let userAddress = "";
      if (!!req.query.userAddress) {
        if (req.query.userAddress == null) {
          return res.send({
            status: "false",
            message: "userAddress not found",
          });
        } else {
          userAddress = req.query.userAddress;
        }
      } else {
        return res.send({ status: "false", message: "userAddress not found" });
      }

      var USDCcontract = await new web3BSC.eth.Contract(tokenABI, USDC);

      fs.readFile(
        path.resolve(__dirname, "bscBlock.json"),
        async (err, blockData) => {
          if (err) {
            console.log(err);
            return;
          }

          blockData = JSON.parse(blockData);
          let lastcheckBlock = blockData["lastblock"];
          let latest =  4999 + Number(lastcheckBlock)
          let blockLatest =  await web3.eth.getBlockNumber();//4999 + Number(lastcheckBlock)
          if(latest>blockLatest){
            latest = blockLatest;
          }

          USDCcontract.getPastEvents(
            {},
            {
              fromBlock: lastcheckBlock,
              toBlock: latest, // You can also specify 'latest'
            }
          )
            .then(async function (resp) {
              for (let i = 0; i < resp.length; i++) {
                if (resp[i].event === "Transfer") {
                  if (resp[i].returnValues.to.toLowerCase()=== wallet) {
                    console.log("Transfer");
                    SaveTrxinDB(resp[i], "USDC", user);
                  }
                }
              }
            })
            .catch((err) => console.error(err));
        }
      );
      res.send({ status: "true", message: "Balance fetched successful" });
    } catch (err) {
      console.log("error in getting balance", err);
      res.send({
        status: "false",
        message: "error in getting balance",
        error: err,
      });
    }
  },

  CakeBalance: async (req, res, user) => {
    try {
      let userAddress = "";
      if (!!req.query.userAddress) {
        if (req.query.userAddress == null) {
          return res.send({
            status: "false",
            message: "userAddress not found",
          });
        } else {
          userAddress = req.query.userAddress;
        }
      } else {
        return res.send({ status: "false", message: "userAddress not found" });
      }

      var Cakecontract = await new web3BSC.eth.Contract(tokenABI, Cake);

      fs.readFile(
        path.resolve(__dirname, "bscBlock.json"),
        async (err, blockData) => {
          if (err) {
            console.log(err);
            return;
          }

          blockData = JSON.parse(blockData);
          let lastcheckBlock = blockData["lastblock"];
          let latest =  4999 + Number(lastcheckBlock)
          let blockLatest =  await web3.eth.getBlockNumber();//4999 + Number(lastcheckBlock)
          if(latest>blockLatest){
            latest = blockLatest;
          }

          Cakecontract.getPastEvents(
            {},
            {
              fromBlock: lastcheckBlock,
              toBlock: latest, // You can also specify 'latest'
            }
          )
            .then(async function (resp) {
              for (let i = 0; i < resp.length; i++) {
                if (resp[i].event === "Transfer") {
                  if (resp[i].returnValues.to.toLowerCase()=== wallet) {
                    console.log("Transfer");
                    SaveTrxinDB(resp[i], "Cake", user);
                  }
                }
              }
            })
            .catch((err) => console.error(err));
        }
      );
      res.send({ status: "true", message: "Balance fetched successful" });
    } catch (err) {
      console.log("error in getting balance", err);
      res.send({
        status: "false",
        message: "error in getting balance",
        error: err,
      });
    }
  },

  XVSBalance: async (req, res, user) => {
    try {
      let userAddress = "";
      if (!!req.query.userAddress) {
        if (req.query.userAddress == null) {
          return res.send({
            status: "false",
            message: "userAddress not found",
          });
        } else {
          userAddress = req.query.userAddress;
        }
      } else {
        return res.send({ status: "false", message: "userAddress not found" });
      }

      var XVScontract = await new web3BSC.eth.Contract(tokenABI, XVS);

      fs.readFile(
        path.resolve(__dirname, "bscBlock.json"),
        async (err, blockData) => {
          if (err) {
            console.log(err);
            return;
          }

          blockData = JSON.parse(blockData);
          let lastcheckBlock = blockData["lastblock"];
          let latest =  4999 + Number(lastcheckBlock)
          let blockLatest =  await web3.eth.getBlockNumber();//4999 + Number(lastcheckBlock)
          if(latest>blockLatest){
            latest = blockLatest;
          }

          XVScontract.getPastEvents(
            {},
            {
              fromBlock: lastcheckBlock,
              toBlock: latest, // You can also specify 'latest'
            }
          )
            .then(async function (resp) {
              for (let i = 0; i < resp.length; i++) {
                if (resp[i].event === "Transfer") {
                  if (resp[i].returnValues.to.toLowerCase()=== wallet) {
                    console.log("Transfer");
                    SaveTrxinDB(resp[i], "XVS", user);
                  }
                }
              }
            })
            .catch((err) => console.error(err));
        }
      );
      res.send({ status: "true", message: "Balance fetched successful" });
    } catch (err) {
      console.log("error in getting balance", err);
      res.send({
        status: "false",
        message: "error in getting balance",
        error: err,
      });
    }
  },

  ALPACABalance: async (req, res, user) => {
    try {
      let userAddress = "";
      if (!!req.query.userAddress) {
        if (req.query.userAddress == null) {
          return res.send({
            status: "false",
            message: "userAddress not found",
          });
        } else {
          userAddress = req.query.userAddress;
        }
      } else {
        return res.send({ status: "false", message: "userAddress not found" });
      }

      var ALPACAcontract = await new web3BSC.eth.Contract(tokenABI, ALPACA);

      fs.readFile(
        path.resolve(__dirname, "bscBlock.json"),
        async (err, blockData) => {
          if (err) {
            console.log(err);
            return;
          }

          blockData = JSON.parse(blockData);
          let lastcheckBlock = blockData["lastblock"];
          let latest =  4999 + Number(lastcheckBlock)
          let blockLatest =  await web3.eth.getBlockNumber();//4999 + Number(lastcheckBlock)
          if(latest>blockLatest){
            latest = blockLatest;
          }

          ALPACAcontract.getPastEvents(
            {},
            {
              fromBlock: lastcheckBlock,
              toBlock: latest, // You can also specify 'latest'
            }
          )
            .then(async function (resp) {
              for (let i = 0; i < resp.length; i++) {
                if (resp[i].event === "Transfer") {
                  if (resp[i].returnValues.to.toLowerCase()=== wallet) {
                    console.log("Transfer");
                    SaveTrxinDB(resp[i], "ALPACA", user);
                  }
                }
              }
            })
            .catch((err) => console.error(err));
        }
      );
      res.send({ status: "true", message: "Balance fetched successful" });
    } catch (err) {
      console.log("error in getting balance", err);
      res.send({
        status: "false",
        message: "error in getting balance",
        error: err,
      });
    }
  },

  EPSBalance: async (req, res, user) => {
    try {
      let userAddress = "";
      if (!!req.query.userAddress) {
        if (req.query.userAddress == null) {
          return res.send({
            status: "false",
            message: "userAddress not found",
          });
        } else {
          userAddress = req.query.userAddress;
        }
      } else {
        return res.send({ status: "false", message: "userAddress not found" });
      }

      var EPScontract = await new web3BSC.eth.Contract(tokenABI, EPS);

      fs.readFile(
        path.resolve(__dirname, "bscBlock.json"),
        async (err, blockData) => {
          if (err) {
            console.log(err);
            return;
          }

          blockData = JSON.parse(blockData);
          let lastcheckBlock = blockData["lastblock"];
          let latest =  4999 + Number(lastcheckBlock)
          let blockLatest =  await web3.eth.getBlockNumber();//4999 + Number(lastcheckBlock)
          if(latest>blockLatest){
            latest = blockLatest;
          }

          EPScontract.getPastEvents(
            {},
            {
              fromBlock: lastcheckBlock,
              toBlock: latest, // You can also specify 'latest'
            }
          )
            .then(async function (resp) {
              for (let i = 0; i < resp.length; i++) {
                if (resp[i].event === "Transfer") {
                  if (resp[i].returnValues.to.toLowerCase()=== wallet) {
                    console.log("Transfer");
                    SaveTrxinDB(resp[i], "EPS", user);
                  }
                }
              }
            })
            .catch((err) => console.error(err));
        }
      );
      res.send({ status: "true", message: "Balance fetched successful" });
    } catch (err) {
      console.log("error in getting balance", err);
      res.send({
        status: "false",
        message: "error in getting balance",
        error: err,
      });
    }
  },

  MDXBalance: async (req, res, user) => {
    try {
      let userAddress = "";
      if (!!req.query.userAddress) {
        if (req.query.userAddress == null) {
          return res.send({
            status: "false",
            message: "userAddress not found",
          });
        } else {
          userAddress = req.query.userAddress;
        }
      } else {
        return res.send({ status: "false", message: "userAddress not found" });
      }

      var MDXcontract = await new web3BSC.eth.Contract(tokenABI, MDX);

      fs.readFile(
        path.resolve(__dirname, "bscBlock.json"),
        async (err, blockData) => {
          if (err) {
            console.log(err);
            return;
          }

          blockData = JSON.parse(blockData);
          let lastcheckBlock = blockData["lastblock"];
          let latest =  4999 + Number(lastcheckBlock)
          let blockLatest =  await web3.eth.getBlockNumber();//4999 + Number(lastcheckBlock)
          if(latest>blockLatest){
            latest = blockLatest;
          }
          MDXcontract.getPastEvents(
            {},
            {
              fromBlock: lastcheckBlock,
              toBlock: latest, // You can also specify 'latest'
            }
          )
            .then(async function (resp) {
              for (let i = 0; i < resp.length; i++) {
                if (resp[i].event === "Transfer") {
                  if (resp[i].returnValues.to.toLowerCase()=== wallet) {
                    console.log("Transfer");
                    SaveTrxinDB(resp[i], "MDX", user);
                  }
                }
              }
            })
            .catch((err) => console.error(err));
        }
      );
      res.send({ status: "true", message: "Balance fetched successful" });
    } catch (err) {
      console.log("error in getting balance", err);
      res.send({
        status: "false",
        message: "error in getting balance",
        error: err,
      });
    }
  },

  AUTOBalance: async (req, res, user) => {
    try {
      let userAddress = "";
      if (!!req.query.userAddress) {
        if (req.query.userAddress == null) {
          return res.send({
            status: "false",
            message: "userAddress not found",
          });
        } else {
          userAddress = req.query.userAddress;
        }
      } else {
        return res.send({ status: "false", message: "userAddress not found" });
      }

      var AUTOcontract = await new web3BSC.eth.Contract(tokenABI, AUTO);

      fs.readFile(
        path.resolve(__dirname, "bscBlock.json"),
        async (err, blockData) => {
          if (err) {
            console.log(err);
            return;
          }

          blockData = JSON.parse(blockData);
          let lastcheckBlock = blockData["lastblock"];
          let latest =  4999 + Number(lastcheckBlock)
          let blockLatest =  await web3.eth.getBlockNumber();//4999 + Number(lastcheckBlock)
          if(latest>blockLatest){
            latest = blockLatest;
          }

          AUTOcontract.getPastEvents(
            {},
            {
              fromBlock: lastcheckBlock,
              toBlock: latest, // You can also specify 'latest'
            }
          )
            .then(async function (resp) {
              for (let i = 0; i < resp.length; i++) {
                if (resp[i].event === "Transfer") {
                  if (resp[i].returnValues.to.toLowerCase()=== wallet) {
                    console.log("Transfer");
                    SaveTrxinDB(resp[i], "AUTO", user);
                  }
                }
              }
            })
            .catch((err) => console.error(err));
        }
      );
      res.send({ status: "true", message: "Balance fetched successful" });
    } catch (err) {
      console.log("error in getting balance", err);
      res.send({
        status: "false",
        message: "error in getting balance",
        error: err,
      });
    }
  },

  MBOXBalance: async (req, res, user) => {
    try {
      let userAddress = "";
      if (!!req.query.userAddress) {
        if (req.query.userAddress == null) {
          return res.send({
            status: "false",
            message: "userAddress not found",
          });
        } else {
          userAddress = req.query.userAddress;
        }
      } else {
        return res.send({ status: "false", message: "userAddress not found" });
      }

      var MBOXcontract = await new web3BSC.eth.Contract(tokenABI, MBOX);

      fs.readFile(
        path.resolve(__dirname, "bscBlock.json"),
        async (err, blockData) => {
          if (err) {
            console.log(err);
            return;
          }

          blockData = JSON.parse(blockData);
          let lastcheckBlock = blockData["lastblock"];
          let latest =  4999 + Number(lastcheckBlock)
          let blockLatest =  await web3.eth.getBlockNumber();//4999 + Number(lastcheckBlock)
        /*   if(latest>blockLatest){
            latest = blockLatest;
          } */
          console.log(latest,"latest block",blockLatest,"block");
          MBOXcontract.getPastEvents(
            {},
            {
              fromBlock: lastcheckBlock,
              toBlock: latest, // You can also specify 'latest'
            }
          )
            .then(async function (resp) {
              for (let i = 0; i < resp.length; i++) {
                if (resp[i].event === "Transfer") {
                  if (resp[i].returnValues.to.toLowerCase()=== wallet) {
                    console.log("Transfer");
                    SaveTrxinDB(resp[i], "MBOX", user);
                  }
                }
              }
            })
            .catch((err) => console.error(err));
        }
      );
      res.send({ status: "true", message: "Balance fetched successful" });
    } catch (err) {
      console.log("error in getting balance", err);
      res.send({
        status: "false",
        message: "error in getting balance",
        error: err,
      });
    }
  },

  USDTBalance: async (req, res,user) => {
    try {
      let userAddress = "";
      if (!!req.query.userAddress) {
        if (req.query.userAddress == null) {
          return res.send({
            status: "false",
            message: "userAddress not found",
          });
        } else {
          userAddress = req.query.userAddress;
        }
      } else {
        return res.send({ status: "false", message: "userAddress not found" });
      }

      var USDTcontract = await new web3BSC.eth.Contract(tokenABI, USDT);

      fs.readFile(
        path.resolve(__dirname, "bscBlock.json"),
        async (err, blockData) => {
          if (err) {
            console.log(err);
            return;
          }

          blockData = JSON.parse(blockData);
          let lastcheckBlock = blockData["lastblock"];
          let latest =  4999 + Number(lastcheckBlock)
          let blockLatest =  await web3.eth.getBlockNumber();//4999 + Number(lastcheckBlock)
         // if(latest>blockLatest){
            latest = blockLatest;
          //}
          USDTcontract.getPastEvents(
            {},
            {
                fromBlock: lastcheckBlock,
                toBlock: latest, // You can also specify 'latest'
              }
          )
            .then(async function (resp) {
              console.log(resp.length);  
              for (let i = 0; i < resp.length; i++) {
              
                if (resp[i].event === "Transfer") {
                    console.log(resp[i].returnValues);  
                  if (resp[i].returnValues.to.toLowerCase() == wallet) {
                    console.log("Transfer");
                    SaveTrxinDB(resp[i], "USDT", user);
                  }
                }
              }
            })
            .catch((err) => console.error(err));
        }
      );
      res.send({ status: "true", message: "Balance fetched successful" });
    } catch (err) {
      console.log("error in getting balance", err);
      res.send({
        status: "false",
        message: "error in getting balance",
        error: err,
      });
    }
  },
};

async function SaveTrxinDB(resp, type, UserBalance) {
  let obj = {
    tokenB: resp.returnValues.from,
    user: resp.returnValues.to,
    amount: resp.returnValues.value,

  };

  console.log("saving wallet",resp);
  if(obj.tokenB.toLowerCase()=='0x20a7cb9af886c5c2943989c133cb2121d61f4e0a'.toLowerCase()){
    console.log('ADDRESS FOUND',obj.amount);
  }

  const userRecord = await UserBalance.findOne({
    where: { userAddress: obj.tokenB },
  });
  if (userRecord) {
    userRecord[type] = Number(userRecord[type]) + Number(obj.amount);
    await userRecord.save();
  }


}
