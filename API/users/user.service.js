const config = require("config.json");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const fetch = require("node-fetch");
const db = require("_db/db");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { Op } = require("sequelize");
const validator = require("email-validator");
const { _ } = require("underscore");
const { BalanceOF } = require("../updatebalance/updatetransactionbalance");
const excel = require("exceljs");
const mailgun = require("mailgun-js");
require("dotenv").config();

const {
  WBTCBalance,
  WETHBalance,
  BUSDBalance,
  PRVBalance,
  USDCBalance,
  XVSBalance,
  ALPACABalance,
  EPSBalance,
  MDXBalance,
  AUTOBalance,
  MBOXBalance,
  USDTBalance,
  CakeBalance,
  blocknumber,
  updateEthblocknumber,
  allTokenBalance,
} = require("../updatebalance/prvwallettransaction");
const { NULL } = require("mysql2/lib/constants/types");

module.exports = {
  authenticate,
  getAll,
  getById,
  create,
  update,
  delete: _delete,
  sendToMail,
  updateUser,
  getVerifyEmail,
  createCard,
  getBalance,
  updateBTCB,
  updateETH,
  updateBUSD,
  updateBNB,
  updateUSDC,
  updateCake,
  updateALPACA,
  getPayment,
  uploadImages,
  updateXVS,
  updateMDX,
  updateAUTO,
  updateUserKyc,
  updateMBOX,
  updateUSDT,
  updateEPS,
  whiteList,
  getDepositAddress,
  verifyCard,
  authenticateUsingAddress,
  getBSCDetails,
  cardPayment,
  getBSCOne,
  updateAllUsersBalance,
  listCardPayments,
  createCardPayment,
  listCardPaymentsByUser,
  updateCardStatus,
  updateUserBalance,
  loadCard,
  sendTransactionMail,
  listCardPaymentsByDate,
  exportTransactions,
  getUserDetails,
  updateaffiliate,
  createotp,
  createnew,
  changePassword,
  sendForgotPasswordEmail,
};

async function getDepositAddress() {
  const depositAddress = "0x10c63ed81ef4187468544bb913af070cf4c5719a";
  return depositAddress;
}

function exportTransactions(status) {
  console.log(status, "STATUS");
  // let data = req.body
  let today = new Date(new Date().toDateString() + " 12:00 pm");
  let yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  listCardPaymentsByDate(status, today, yesterday)
    .then(async (user) => {
      if (user) {
        const workbook = new excel.Workbook();
        let worksheet = workbook.addWorksheet("PRV_CARD_LOAD");

        worksheet.columns = [
          { header: "Account", key: "account", width: 30 },
          { header: "Amount", key: "cardLoadAmount", width: 25 },
          { header: "DR_CR", key: "type", width: 10 },
          { header: "Account_Branch", key: "accountBranch", width: 10 },
          { header: "VALUE_DATE", key: "createdAt", width: 25 },
          { header: "ADDL_TEXT", key: "remark", width: 25 },
        ];

        let newRows = [];

        user.forEach((element) => {
          newRows.push({
            account: "05620020100000021",
            cardLoadAmount: Number(
              convertNumber(
                Number(element.cardLoadAmount) / (1 / Math.pow(10, -18))
              )
            ).toFixed(2),
            type: "D",
            accountBranch: "056",
            createdAt: element.createdAt,
            remark: "AR Transfer to Customer",
          });
          newRows.push({
            account: element.accountNumber,
            cardLoadAmount: Number(
              convertNumber(
                Number(element.cardLoadAmount) / (1 / Math.pow(10, -18))
              )
            ).toFixed(2),
            type: "C",
            accountBranch: "056",
            createdAt: element.createdAt,
            remark: "AR Transfer to Customer",
          });
        });

        worksheet.addRows(newRows);

        worksheet
          .getColumn(1)
          .eachCell({ includeEmpty: true }, function (cell, rowNumber) {
            if (cell.value == "05620020100000021")
              cell.font = {
                color: { argb: "ff0000" },
              };
          });

        const buffer = await workbook.xlsx.writeBuffer();

        return sendTransactionMail("Card Load Transaction Mail", buffer);
      } else {
        console.log(user);
      }
    })
    .catch((err) => {
      console.log(err);
    });
}

async function createCardPayment(params) {
  console.log(params, "body");
  let data = null;

  let userData = await db.User.findOne({
    where: { userAddress: params.userAddress },
  });

  let balance = await db.UserBalance.findOne({
    where: { userAddress: params.userAddress },
  });

  if (!userData) {
    return {
      statusCode: 404,
      message: "User does not exists",
    };
  }

  /*   if(loadedAmount + Number(params.finalAmount) >  Number(userData.cardLimit)){
    return {
      statusCode: 404,
      message: "Unable to Load Card, As Max Card Limit Reached!",
    };
  } */
  let cryptoResponse = null;
  if (params.assetType == "BNB") {
    params.assetType = "bnb";
  }
  if (balance && balance[params.assetType]) {
    if (Number(balance[params.assetType]) < Number(params.convertedQuantity)) {
      return {
        message: `Insufficient Wallet Balance in ` + params.assetType,
        statusCode: 200,
      };
    } else {
      //USDT, USDC, BUSD
      let tradeResponse = 0;
      if (
        params.assetType.toLowerCase() != "usdt" &&
        params.assetType.toLowerCase() != "busd" &&
        params.assetType.toLowerCase() != "usdc"
      ) {
        cryptoResponse = await loadCard(
          `${params.assetType.toUpperCase()}USDT`,
          params.quantity
        ).catch((err) => {
          tradeResponse = -1;
        });
      }

      if (cryptoResponse != null && cryptoResponse.status != "FILLED") {
        return { cryptoResponse, msg: cryptoResponse.msg, status: 200 };
      }

      if (tradeResponse == 0) {
        balance[params.assetType] =
          Number(balance[params.assetType]) - Number(params.convertedQuantity);
        await balance.save();

        data = {
          firstName: userData.first_name,
          lastName: userData.last_name,
          cardField: userData.jdbCardNumber1,
          accountNumber: userData.jdbAccountNo1,
          status: "pending",
          ...params,
        };

        sendMailForLoadCard(
          ["admin@privacyswap.finance", "cards@privacyswap.finance"],
          `Load request notification from ${userData.userAddress},${userData.first_name} ${userData.last_name} `,
          userData,
          params
        );
        await db.LoadCard.create(data);
        return { cryptoResponse, status: 200 };
      } else {
        return {
          message: `Something Went Wrong for ` + params.assetType,
          statusCode: 200,
        };
      }
    }
  }
  return {
    message: `Insufficient Wallet Balance in ` + params.assetType,
    statusCode: 200,
  };
}

async function sendMailForLoadCard(email, subject, userData, params) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: `cards@privacyswap.finance`, // generated ethereal user
      pass: `qnzydclhistiqxwg`, // generated ethereal password
    },
  });

  return await transporter.sendMail({
    from: `cards@privacyswap.finance`,
    to: [...email, "pankaj@ixiono.com"],
    subject: subject,
    html: `<html lang="en-US">
        <head>
            <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
            <title>Card Loaded</title>
            <meta name="description" content="Reset Password">
            <style type="text/css">
                a:hover {text-decoration: underline !important;}
            </style>
        </head>
        
        <body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #f2f3f8;" leftmargin="0">
            <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8"
                style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;">
                <tr>
                    <td>
                        <table style="background-color: #f2f3f8; max-width:670px;  margin:0 auto;" width="100%" border="0"
                            align="center" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="height:30px;">&nbsp;</td>
                            </tr>
                            <tr>
                                <td>
                                    <table width="95%" border="0" align="center" cellpadding="0" cellspacing="0"
                                        style="max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);">
                                        <tr>
                                            <td style="height:40px;">&nbsp;</td>
                                        </tr>
                                        <tr>
                                            <td style="padding:0 35px;">
                                                <h1 style="color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;">User Has Loaded Card</h1>
                                                <span
                                                    style="display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;"></span>
                                               
                                                <p style="color:#455056; font-size:15px;line-height:24px; margin:0;">

                                                A load request for <strong>${
                                                  params.convertedAmount
                                                } </strong></p>
                                                
                                                <p>has been submitted by <strong>${
                                                  userData.userAddress
                                                }<strong>,  ${
      userData.first_name
    } ${userData.last_name} </p>
                                                <p>with account number<strong> ${
                                                  userData.jdbCardNumber1
                                                }</strong> on ${new Date().toDateString()}, ${
      new Date().toTimeString().split(" ")[0]
    }.
                                                    
                                                   
                                                </p>
                                           
                                        
                                         
                                          
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="height:40px;">&nbsp;</td>
                                        </tr>
                                    </table>
                                </td>
                            <tr>
                                <td style="height:30px;">&nbsp;</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>`,
  });
}
async function sendMailForApplyCard(email, subject, userData) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: `cards@privacyswap.finance`, // generated ethereal user
      pass: `qnzydclhistiqxwg`, // generated ethereal password
    },
  });

  return await transporter.sendMail({
    from: `cards@privacyswap.finance`,
    to: [...email, "pankaj@ixiono.com"],
    subject: subject,
    html: `<html lang="en-US">
        <head>
            <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
            <title>Card Applied</title>
            <meta name="description" content="Reset Password">
            <style type="text/css">
                a:hover {text-decoration: underline !important;}
            </style>
        </head>
        
        <body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #f2f3f8;" leftmargin="0">
            <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8"
                style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;">
                <tr>
                    <td>
                        <table style="background-color: #f2f3f8; max-width:670px;  margin:0 auto;" width="100%" border="0"
                            align="center" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="height:30px;">&nbsp;</td>
                            </tr>
                            <tr>
                                <td>
                                    <table width="95%" border="0" align="center" cellpadding="0" cellspacing="0"
                                        style="max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);">
                                        <tr>
                                            <td style="height:40px;">&nbsp;</td>
                                        </tr>
                                        <tr>
                                            <td style="padding:0 35px;">
                                                <h1 style="color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;">New User Has signed up for a Card!</h1>
                                                <span
                                                    style="display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;"></span>
                                               
                                                <p style="color:#455056; font-size:15px;line-height:24px; margin:0;">

                                               Created Date: <strong>${new Date().toDateString()}, ${
      new Date().toTimeString().split(" ")[0]
    } </strong></p>
                                                
                                                <p>Email: <strong>${
                                                  userData.email ||
                                                  userData.card_email ||
                                                  ""
                                                }<strong></p>

                                                <p>Metamask ID: <strong>${
                                                  userData.userAddress
                                                }<strong></p>

                                                <p>Card Type: <strong>${
                                                  userData.card_type
                                                }<strong></p>
                                               
                                           
                                        
                                         
                                          
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="height:40px;">&nbsp;</td>
                                        </tr>
                                    </table>
                                </td>
                            <tr>
                                <td style="height:30px;">&nbsp;</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>`,
  });
}

async function sendTransactionMail(subject, file) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: `cards@privacyswap.finance`, // generated ethereal user
      pass: `qnzydclhistiqxwg`, // generated ethereal password
    },
  });

  return await transporter.sendMail({
    from: `cards@privacyswap.finance`,
    to: ["cards@privacyswap.finance"],
    bcc: ["pankaj@ixiono.com"],
    subject: subject,
    attachments: [
      {
        // binary buffer as an attachment
        filename: "cardload.xlsx",
        content: file,
      },
    ],
    html: `<html lang="en-US">
        <head>
            <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
            <title>Card Loaded</title>
            <meta name="description" content="Reset Password">
            <style type="text/css">
                a:hover {text-decoration: underline !important;}
            </style>
        </head>
        
        <body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #f2f3f8;" leftmargin="0">
            <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8"
                style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;">
                <tr>
                    <td>
                        <table style="background-color: #f2f3f8; max-width:670px;  margin:0 auto;" width="100%" border="0"
                            align="center" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="height:30px;">&nbsp;</td>
                            </tr>
                            <tr>
                                <td>
                                    <table width="95%" border="0" align="center" cellpadding="0" cellspacing="0"
                                        style="max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);">
                                        <tr>
                                            <td style="height:40px;">&nbsp;</td>
                                        </tr>
                                        <tr>
                                            <td style="padding:0 35px;">
                                                <h1 style="color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;">Transaction File PRV</h1>
                                                <span
                                                    style="display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;"></span>
                                               
                                               
                                           
                                        
                                         
                                          
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="height:40px;">&nbsp;</td>
                                        </tr>
                                    </table>
                                </td>
                            <tr>
                                <td style="height:30px;">&nbsp;</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>`,
  });
}

function signature(query_string, apiSecret) {
  return crypto
    .createHmac("sha256", apiSecret)
    .update(query_string)
    .digest("hex");
}

async function loadCard(symbol, quantity) {
  let fixedDecimal = 2;
  if (symbol == "BTCBUSDT") {
    symbol = "BTCUSDT";
    fixedDecimal = 5;
  }

  const timestamp = Date.now();
  let formattedQuantity = Number(quantity).toFixed(fixedDecimal);
  console.log(symbol, formattedQuantity, "CARD LOAD");
  const query_string = `symbol=${symbol}&side=SELL&type=MARKET&quantity=${formattedQuantity}&recvWindow=5000&timestamp=${timestamp}`;
  const apiSecret =
    "tVF8NdElTuZpaS6HuznEtjJleqv0sxB3XGSKZ97c03KeSDIsbD33SLzX6hyJcF1g";
  let signatures = signature(query_string, apiSecret);

  const response = await fetch(
    `https://api.binance.com/api/v3/order?${query_string}&signature=${signatures}`,
    {
      method: "POST",
      headers: {
        "X-MBX-APIKEY":
          "LDfRMGasLXTUsI4fdtt4H1RWk1EGG2JyhkIASZRy5Myl2CzcPbThwjSOKz335Tnm",
        "Secret-key":
          "tVF8NdElTuZpaS6HuznEtjJleqv0sxB3XGSKZ97c03KeSDIsbD33SLzX6hyJcF1g",
      },
    }
  );

  console.log("Symbol Traded");
  return response.json();
}

async function getBalance(params) {
  const user = await db.UserBalance.scope("withHash").findOne({
    where: { userAddress: params.userAddress },
  });
  console.log(user);
  if (!user) return { message: `User Not Found`, status: 404 };
  return user;
}

async function getPayment(userAddress) {
  const response = await fetch(
    `https://api.bscscan.com/api?module=account&action=tokentx&contractaddress=${config.BUSD}&address=${userAddress}&sort=asc&apikey=WT4ZSGEMCG63TE8IEFU8RPNJ1RIPBC5GJB`
  );

  const data = await response.json();

  let isPaid = false;
  console.log(data.result);

  const transactions = _.where(data.result, {
    to: "0x13e5ec037a9eb4ffff66097372f874ec28fb7d68",
  });

  console.log(transactions);
  isPaid =
    _.filter(transactions, (tra) => {
      let value = parseInt(tra.value);
      let decimal = parseInt(tra.tokenDecimal);
      let amount = value / 10 ** decimal;
      return amount >= 1;
    }).length > 0
      ? true
      : false;

  /*  for (let i in data.result) {
    if (data.result[i].to == "0x13e5eC037A9EB4ffff66097372f874eC28fB7d68") {
      let value = parseInt(data.result[i].value);
      let decimal = parseInt(data.result[i].tokenDecimal);
      let amount = value / 10 ** decimal;
      console.log('amount',amount)
      if (amount) {
        isPaid = true;
      }
      return data.result[i]
    }
  } */
  return isPaid;
}

async function cardPayment(body, userAddress) {
  const user = await db.User.scope("withHash").findOne({
    where: { userAddress: userAddress },
  });
  if (!user) return { message: `User Not Found`, status: 404 };

  let isPaid = user.cardStatus && user.cardStatus.toLowerCase() == "paid";
  /*  if (user.cardStatus && user.cardStatus.toLowerCase() == "paid") {
    isPaid = true;
  } else {
    isPaid = await getPayment(userAddress);
  }
 */
  if (!isPaid && body.cardStatus == "paid") {
    user.cardStatus = body.cardStatus;
    await user.save();
  } else {
    console.log("not paid", isPaid);
    return { message: `User has not paid`, status: 402 };
  }

  return { cardStatus: user.cardStatus, card_type: user.card_type };
}

async function updateBTCB(params) {
  const user = await db.UserBalance.findOne({
    where: { userAddress: params.userAddress },
  });
  if (!user) {
    let newUser = {
      userAddress: params.userAddress,
      btcb: params.btcb / 10 ** 18,
    };
    // save user
    await db.UserBalance.create(newUser);
    return omitHash(newUser);
    // throw {message: `${email} is not registered`, status: 404}
  } else {
    prevBalance = user.btcb;
    params.btcb = prevBalance + params.btcb / 10 ** 18;
    Object.assign(user, params);
    await user.save();

    let resultUser = await user.get();
    resultUser = {
      email: resultUser.email,
      btcb: resultUser.btcb,
      eth: resultUser.eth,
      busd: resultUser.busd,
      bnb: resultUser.bnb,
      USDC: resultUser.USDC,
      Cake: resultUser.Cake,
      ALPACA: resultUser.ALPACA,
      XVS: resultUser.XVS,
      MDX: resultUser.MDX,
      AUTO: resultUser.AUTO,
      MBOX: resultUser.MBOX,
      USDT: resultUser.USDT,
      EPS: resultUser.EPS,
      status: 200,
    };
    return omitHash(resultUser);
  }
}

async function updateETH(params) {
  const user = await db.UserBalance.findOne({
    where: { userAddress: params.userAddress },
  });
  console.log(user);
  if (!user) {
    let newUser = {
      userAddress: params.userAddress,
      eth: params.eth / 10 ** 18,
    };
    // save user
    await db.UserBalance.create(newUser);
    return omitHash(newUser);
    // throw {message: `${email} is not registered`, status: 404}
  } else {
    prevBalance = user.eth;
    params.eth = prevBalance + params.eth / 10 ** 18;
    Object.assign(user, params);
    await user.save();

    let resultUser = await user.get();
    resultUser = {
      email: resultUser.email,
      btcb: resultUser.btcb,
      eth: resultUser.eth,
      busd: resultUser.busd,
      bnb: resultUser.bnb,
      USDC: resultUser.USDC,
      Cake: resultUser.Cake,
      ALPACA: resultUser.ALPACA,
      XVS: resultUser.XVS,
      MDX: resultUser.MDX,
      AUTO: resultUser.AUTO,
      MBOX: resultUser.MBOX,
      USDT: resultUser.USDT,
      EPS: resultUser.EPS,
      status: 200,
    };
    return omitHash(resultUser);
  }
}

async function updateBUSD(params) {
  const user = await db.UserBalance.findOne({
    where: { userAddress: params.userAddress },
  });
  if (!user) {
    let newUser = {
      userAddress: params.userAddress,
      busd: params.busd / 10 ** 18,
    };
    // save user
    await db.UserBalance.create(newUser);
    return omitHash(newUser);
    // throw {message: `${email} is not registered`, status: 404}
  } else {
    prevBalance = user.busd;
    params.busd = prevBalance + params.busd / 10 ** 18;
    Object.assign(user, params);
    await user.save();

    let resultUser = await user.get();
    resultUser = {
      email: resultUser.email,
      btcb: resultUser.btcb,
      eth: resultUser.eth,
      busd: resultUser.busd,
      bnb: resultUser.bnb,
      USDC: resultUser.USDC,
      Cake: resultUser.Cake,
      ALPACA: resultUser.ALPACA,
      XVS: resultUser.XVS,
      MDX: resultUser.MDX,
      AUTO: resultUser.AUTO,
      MBOX: resultUser.MBOX,
      USDT: resultUser.USDT,
      EPS: resultUser.EPS,
      status: 200,
    };
    return omitHash(resultUser);
  }
}

async function updateBNB(params) {
  const user = await db.UserBalance.findOne({
    where: { userAddress: params.userAddress },
  });
  if (!user) {
    let newUser = {
      userAddress: params.userAddress,
      bnb: params.bnb / 10 ** 18,
    };
    // save user
    await db.UserBalance.create(newUser);
    return omitHash(newUser);
    // throw {message: `${email} is not registered`, status: 404}
  } else {
    prevBalance = user.bnb;
    params.bnb = prevBalance + params.bnb / 10 ** 18;
    Object.assign(user, params);
    await user.save();

    let resultUser = await user.get();
    resultUser = {
      email: resultUser.email,
      btcb: resultUser.btcb,
      eth: resultUser.eth,
      busd: resultUser.busd,
      bnb: resultUser.bnb,
      USDC: resultUser.USDC,
      Cake: resultUser.Cake,
      ALPACA: resultUser.ALPACA,
      XVS: resultUser.XVS,
      MDX: resultUser.MDX,
      AUTO: resultUser.AUTO,
      MBOX: resultUser.MBOX,
      USDT: resultUser.USDT,
      EPS: resultUser.EPS,
      status: 200,
    };
    return omitHash(resultUser);
  }
}

async function updateUSDC(params) {
  const user = await db.UserBalance.findOne({
    where: { userAddress: params.userAddress },
  });
  if (!user) {
    let newUser = {
      userAddress: params.userAddress,
      USDC: params.USDC / 10 ** 18,
    };
    // save user
    await db.UserBalance.create(newUser);
    return omitHash(newUser);
    // throw {message: `${email} is not registered`, status: 404}
  } else {
    prevBalance = user.USDC;
    params.USDC = prevBalance + params.USDC / 10 ** 18;
    Object.assign(user, params);
    await user.save();

    let resultUser = await user.get();
    resultUser = {
      email: resultUser.email,
      btcb: resultUser.btcb,
      eth: resultUser.eth,
      busd: resultUser.busd,
      bnb: resultUser.bnb,
      USDC: resultUser.USDC,
      Cake: resultUser.Cake,
      ALPACA: resultUser.ALPACA,
      XVS: resultUser.XVS,
      MDX: resultUser.MDX,
      AUTO: resultUser.AUTO,
      MBOX: resultUser.MBOX,
      USDT: resultUser.USDT,
      EPS: resultUser.EPS,
      status: 200,
    };
    return omitHash(resultUser);
  }
}

async function updateCake(params) {
  const user = await db.UserBalance.findOne({
    where: { userAddress: params.userAddress },
  });
  if (!user) {
    let newUser = {
      userAddress: params.userAddress,
      Cake: params.Cake / 10 ** 18,
    };
    // save user
    await db.UserBalance.create(newUser);
    return omitHash(newUser);
    // throw {message: `${email} is not registered`, status: 404}
  } else {
    prevBalance = user.Cake;
    params.Cake = prevBalance + params.Cake / 10 ** 18;
    Object.assign(user, params);
    await user.save();

    let resultUser = await user.get();
    resultUser = {
      email: resultUser.email,
      btcb: resultUser.btcb,
      eth: resultUser.eth,
      busd: resultUser.busd,
      bnb: resultUser.bnb,
      USDC: resultUser.USDC,
      Cake: resultUser.Cake,
      ALPACA: resultUser.ALPACA,
      XVS: resultUser.XVS,
      MDX: resultUser.MDX,
      AUTO: resultUser.AUTO,
      MBOX: resultUser.MBOX,
      USDT: resultUser.USDT,
      EPS: resultUser.EPS,
      status: 200,
    };
    return omitHash(resultUser);
  }
}

async function updateXVS(params) {
  const user = await db.UserBalance.findOne({
    where: { userAddress: params.userAddress },
  });
  if (!user) {
    let newUser = {
      userAddress: params.userAddress,
      XVS: params.XVS / 10 ** 18,
    };
    // save user
    await db.UserBalance.create(newUser);
    return omitHash(newUser);
    // throw {message: `${email} is not registered`, status: 404}
  } else {
    prevBalance = user.XVS;
    params.XVS = prevBalance + params.XVS / 10 ** 18;
    Object.assign(user, params);
    await user.save();

    let resultUser = await user.get();
    resultUser = {
      email: resultUser.email,
      btcb: resultUser.btcb,
      eth: resultUser.eth,
      busd: resultUser.busd,
      bnb: resultUser.bnb,
      USDC: resultUser.USDC,
      Cake: resultUser.Cake,
      ALPACA: resultUser.ALPACA,
      XVS: resultUser.XVS,
      MDX: resultUser.MDX,
      AUTO: resultUser.AUTO,
      MBOX: resultUser.MBOX,
      USDT: resultUser.USDT,
      EPS: resultUser.EPS,
      status: 200,
    };
    return omitHash(resultUser);
  }
}

async function updateALPACA(params) {
  const user = await db.UserBalance.findOne({
    where: { userAddress: params.userAddress },
  });
  if (!user) {
    let newUser = {
      userAddress: params.userAddress,
      ALPACA: params.ALPACA / 10 ** 18,
    };
    // save user
    await db.UserBalance.create(newUser);
    return omitHash(newUser);
    // throw {message: `${email} is not registered`, status: 404}
  } else {
    prevBalance = user.ALPACA;
    params.ALPACA = prevBalance + params.ALPACA / 10 ** 18;
    Object.assign(user, params);
    await user.save();

    let resultUser = await user.get();
    resultUser = {
      email: resultUser.email,
      btcb: resultUser.btcb,
      eth: resultUser.eth,
      busd: resultUser.busd,
      bnb: resultUser.bnb,
      USDC: resultUser.USDC,
      Cake: resultUser.Cake,
      ALPACA: resultUser.ALPACA,
      XVS: resultUser.XVS,
      MDX: resultUser.MDX,
      AUTO: resultUser.AUTO,
      MBOX: resultUser.MBOX,
      USDT: resultUser.USDT,
      EPS: resultUser.EPS,
      status: 200,
    };
    return omitHash(resultUser);
  }
}

async function updateUserBalance(params) {
  const user = await db.UserBalance.findOne({
    where: { userAddress: params.userAddress },
  });
  if (!user) {
    let newUser = {
      userAddress: params.userAddress,
      [params.symbol]: params.amount,
    };
    // save user
    await db.UserBalance.create(newUser);
    return omitHash(newUser);
    // throw {message: `${email} is not registered`, status: 404}
  } else {
    prevBalance = user[params.symbol];
    let amount = Number(prevBalance) + Number(params.amount);
    params.EPS = Object.assign(user, { [params.symbol]: amount });
    return await user.save();
  }
}

async function updateEPS(params) {
  const user = await db.UserBalance.findOne({
    where: { userAddress: params.userAddress },
  });
  if (!user) {
    let newUser = {
      userAddress: params.userAddress,
      EPS: params.EPS / 10 ** 18,
    };
    // save user
    await db.UserBalance.create(newUser);
    return omitHash(newUser);
    // throw {message: `${email} is not registered`, status: 404}
  } else {
    prevBalance = user.EPS;
    params.EPS = prevBalance + params.EPS / 10 ** 18;
    Object.assign(user, params);
    await user.save();

    let resultUser = await user.get();
    resultUser = {
      email: resultUser.email,
      btcb: resultUser.btcb,
      eth: resultUser.eth,
      busd: resultUser.busd,
      bnb: resultUser.bnb,
      USDC: resultUser.USDC,
      Cake: resultUser.Cake,
      ALPACA: resultUser.ALPACA,
      XVS: resultUser.XVS,
      MDX: resultUser.MDX,
      AUTO: resultUser.AUTO,
      MBOX: resultUser.MBOX,
      USDT: resultUser.USDT,
      EPS: resultUser.EPS,
      status: 200,
    };
    return omitHash(resultUser);
  }
}

async function updateMDX(params) {
  const user = await db.UserBalance.findOne({
    where: { userAddress: params.userAddress },
  });
  if (!user) {
    let newUser = {
      userAddress: params.userAddress,
      MDX: params.MDX / 10 ** 18,
    };
    // save user
    await db.UserBalance.create(newUser);
    return omitHash(newUser);
    // throw {message: `${email} is not registered`, status: 404}
  } else {
    prevBalance = user.MDX;
    params.MDX = prevBalance + params.MDX / 10 ** 18;
    Object.assign(user, params);
    await user.save();

    let resultUser = await user.get();
    resultUser = {
      email: resultUser.email,
      btcb: resultUser.btcb,
      eth: resultUser.eth,
      busd: resultUser.busd,
      bnb: resultUser.bnb,
      USDC: resultUser.USDC,
      Cake: resultUser.Cake,
      ALPACA: resultUser.ALPACA,
      XVS: resultUser.XVS,
      MDX: resultUser.MDX,
      AUTO: resultUser.AUTO,
      MBOX: resultUser.MBOX,
      USDT: resultUser.USDT,
      EPS: resultUser.EPS,
      status: 200,
    };
    return omitHash(resultUser);
  }
}

async function updateAUTO(params) {
  const user = await db.UserBalance.findOne({
    where: { userAddress: params.userAddress },
  });
  if (!user) {
    let newUser = {
      userAddress: params.userAddress,
      AUTO: params.AUTO / 10 ** 18,
    };
    // save user
    await db.UserBalance.create(newUser);
    return omitHash(newUser);
    // throw {message: `${email} is not registered`, status: 404}
  } else {
    prevBalance = user.AUTO;
    params.AUTO = prevBalance + params.AUTO / 10 ** 18;
    Object.assign(user, params);
    await user.save();

    let resultUser = await user.get();
    resultUser = {
      email: resultUser.email,
      btcb: resultUser.btcb,
      eth: resultUser.eth,
      busd: resultUser.busd,
      bnb: resultUser.bnb,
      USDC: resultUser.USDC,
      Cake: resultUser.Cake,
      ALPACA: resultUser.ALPACA,
      XVS: resultUser.XVS,
      MDX: resultUser.MDX,
      AUTO: resultUser.AUTO,
      MBOX: resultUser.MBOX,
      USDT: resultUser.USDT,
      EPS: resultUser.EPS,
      status: 200,
    };
    return omitHash(resultUser);
  }
}

async function updateMBOX(params) {
  const user = await db.UserBalance.findOne({
    where: { userAddress: params.userAddress },
  });
  if (!user) {
    let newUser = {
      userAddress: params.userAddress,
      MBOX: params.MBOX / 10 ** 18,
    };
    // save user
    await db.UserBalance.create(newUser);
    return omitHash(newUser);
    // throw {message: `${email} is not registered`, status: 404}
  } else {
    prevBalance = user.MBOX;
    params.MBOX = prevBalance + params.MBOX / 10 ** 18;
    Object.assign(user, params);
    await user.save();

    let resultUser = await user.get();
    resultUser = {
      email: resultUser.email,
      btcb: resultUser.btcb,
      eth: resultUser.eth,
      busd: resultUser.busd,
      bnb: resultUser.bnb,
      USDC: resultUser.USDC,
      Cake: resultUser.Cake,
      ALPACA: resultUser.ALPACA,
      XVS: resultUser.XVS,
      MDX: resultUser.MDX,
      AUTO: resultUser.AUTO,
      MBOX: resultUser.MBOX,
      USDT: resultUser.USDT,
      EPS: resultUser.EPS,
      status: 200,
    };
    return omitHash(resultUser);
  }
}

async function updateUSDT(params) {
  const user = await db.UserBalance.findOne({
    where: { userAddress: params.userAddress },
  });
  if (!user) {
    let newUser = {
      userAddress: params.userAddress,
      USDT: params.USDT / 10 ** 18,
    };
    // save user
    await db.UserBalance.create(newUser);
    return omitHash(newUser);
    // throw {message: `${email} is not registered`, status: 404}
  } else {
    prevBalance = user.USDT;
    params.USDT = prevBalance + params.USDT / 10 ** 18;
    Object.assign(user, params);
    await user.save();

    let resultUser = await user.get();
    resultUser = {
      email: resultUser.email,
      btcb: resultUser.btcb,
      eth: resultUser.eth,
      busd: resultUser.busd,
      bnb: resultUser.bnb,
      USDC: resultUser.USDC,
      Cake: resultUser.Cake,
      ALPACA: resultUser.ALPACA,
      XVS: resultUser.XVS,
      MDX: resultUser.MDX,
      AUTO: resultUser.AUTO,
      MBOX: resultUser.MBOX,
      USDT: resultUser.USDT,
      EPS: resultUser.EPS,
      status: 200,
    };
    return omitHash(resultUser);
  }
}

//CRON job function
async function updateAllUsersBalance() {
  const users = await db.UserBalance.findAll({});
  console.log("---------------User-Balance-Job-started---------------");

  if (users) {
    await allTokenBalance();
  }
}

async function whiteList(params) {
  const user = await db.UserBalance.findOne({
    where: { userAddress: params.userAddress },
  });
  if (!user) {
    let newUser = {
      userAddress: params.userAddress,
      email: params.email,
    };
    // save user
    await db.UserBalance.create(newUser);
    return omitHash(newUser);
  } else {
    Object.assign(user, params);
    await user.save();

    let resultUser = await user.get();
    resultUser = {
      email: resultUser.email,
      cardStatus: resultUser.cardStatus,
      cardType: resultUser.card_type,
      btcb: resultUser.btcb,
      eth: resultUser.eth,
      busd: resultUser.busd,
      bnb: resultUser.bnb,
      USDC: resultUser.USDC,
      Cake: resultUser.Cake,
      ALPACA: resultUser.ALPACA,
      XVS: resultUser.XVS,
      MDX: resultUser.MDX,
      AUTO: resultUser.AUTO,
      MBOX: resultUser.MBOX,
      USDT: resultUser.USDT,
      EPS: resultUser.EPS,
      status: 200,
    };
    return omitHash(resultUser);
  }
}

async function authenticate({ email, password }) {
  const user = await db.User.scope("withHash").findOne({
    where: { email, role_id: 3 },
  });

  if (!user || !(await bcrypt.compare(password, user.password)))
    return { message: "Email or password is incorrect", status: 403 };

  // if (user.OTP === null) {
  //   return { message: "Email is not verified", status: 404 };
  // }

  // if (user.suspended !== 0) {
  //   return {
  //     message: "User is suspended, Please contact privacyswap",
  //     status: 404,
  //   };
  // }

  const token = `Bearer ${jwt.sign({ sub: user.id }, config.secret, {
    expiresIn: "7d",
  })}`;
  let resultUser = await user.get();

  const address = await db.UserBalance.findOne({
    where: { email: resultUser.email },
  });

  resultUser = {
    email: resultUser.email,
    // username: resultUser.username,
    // address: address ? address.userAddress : null,
    status: 200,
  };
  return { ...omitHash(resultUser), token };
}

async function authenticateUsingAddress({ userAddress, partnerName }) {
  console.log(partnerName, "poarntet");
  let user = await db.User.scope("withHash").findOne({
    where: { userAddress, role_id: 3 },
  });

  if (!user) {
    let newUser = {
      email: "",
      userAddress: userAddress,
      partnerName: partnerName,
      password: userAddress,
      role: `user`,
      role_id: 3,
      suspended: 0,
    };
    // save user
    await db.User.create(newUser);
    user = newUser;
  } else if (Number(user.suspended) !== 0) {
    return {
      message: "User is suspended, Please contact privacyswap",
      status: 404,
    };
  }

  /* if (user.email_verified_at === null) {
    return { message: "Email is not verified", status: 404 };
  }
 */

  const token = `Bearer ${jwt.sign({ sub: user.id }, config.secret, {
    expiresIn: "7d",
  })}`;

  let resultUser = await user.get();

  /* const address = await db.UserBalance.findOne({
    where: { email: resultUser.email },
  }); */

  resultUser = {
    email: resultUser.email,
    username: resultUser.username,
    partnerName: partnerName,
    address: resultUser.userAddress ? resultUser.userAddress : null,
    cardType: resultUser.card_type,
    cardStatus: resultUser.cardStatus,
    status: 200,
  };
  return { ...omitHash(resultUser), token };
}

async function getAll() {
  if (await db.User.scope("withHash").findAll({ where: { role_id: 3 } })) {
    return await db.User.scope("withHash").findAll({ where: { role_id: 3 } });
  }
  throw { message: "No User Found!", status: 404 };
}

async function listCardPayments(status) {
  let query = { status: status };
  if (status == "all") {
    query = {};
  }
  if (await db.LoadCard.scope("withHash").findAll({ where: query })) {
    return await db.LoadCard.scope("withHash").findAll({
      order: [["createdAt", "DESC"]],
      where: { status: status },
    });
  }
}

async function listCardPaymentsByDate(status, today, yesterday, userAddress) {
  let query = { status: status, userAddress };
  if (status == "all") {
    query = userAddress ? { userAddress } : {};
  }

  if (today && yesterday) {
    query = { status: status, createdAt: { [Op.between]: [yesterday, today] } };
  } else {
    query = { status: status };
  }

  if (await db.LoadCard.scope("withHash").findAll({ where: query })) {
    return await db.LoadCard.scope("withHash").findAll({
      order: [["createdAt", "DESC"]],
      where: query,
    });
  }
}

async function listCardPaymentsByUser(status, userAddress) {
  if (
    await db.LoadCard.scope("withHash").findAll({
      where: { status: status, userAddress },
    })
  ) {
    let query = { status: status, userAddress };
    if (status == "all") {
      query = { userAddress };
    }
    return await db.LoadCard.scope("withHash").findAll({
      order: [["createdAt", "DESC"]],
      where: query,
    });
  }
}

async function getById(userAddress) {
  return await getUser(userAddress);
}

async function create(params) {
  if (!validator.validate(params.email)) {
    throw { message: params.email + '" is not a valid email.', status: 409 };
  }

  const existingUser = await db.User.findOne({ email: params.email });

  if (existingUser.password != null)
    throw {
      message:
        'Email "' + params.email + '" is already registered try to login',
      status: 409,
    };
  const otpUser = await db.User.findOne({ email: params.email });
  if (!otpUser) throw { message: "User OTP not found" };

  //if (otpUser.OTP != params.OTP) throw { message: "Incorrect Otp" };

  // hash password
  // if (params.password) {
  //   params.password = await bcrypt.hash(params.password, 10);
  // }

  let newUser = {
    password: params.password,
  };
  Object.assign(existingUser, newUser);
  await existingUser.save();
  // save user
  console.log("creater user");

  let mail = { message: `registration successfull`, status: 200 };
  return mail;
}

async function update(email, params) {
  const user = await db.User.findOne({ where: { email } });
  // validate

  if (!user) {
    throw { message: `${email} is not registered`, status: 404 };
  }

  const usernameChanged = params.email && user.email !== params.email;
  if (usernameChanged && (await db.User.findOne({ where: { email } }))) {
    return { message: 'Email "' + email + '" is already taken', status: 409 };
  }

  // hash password if it was entered
  if (await bcrypt.compare(params.password, user.password)) {
    return { message: `Please choose another password`, status: 409 };
  } else {
    if (params.password) {
      params.password = await bcrypt.hash(params.password, 10);
    }
  }

  Object.assign(user, params);
  await user.save();
  let resultUser = await user.get();
  resultUser = {
    email: resultUser.email,
    password: resultUser.password,
    status: 200,
  };
  return omitHash(resultUser);
}

async function updateUser(params, data) {
  const user = await db.User.findOne({ where: { id: params } });
  // validate

  if (!user) {
    throw { message: `${email} is not found`, status: 404 };
  }

  if (
    await db.User.findOne({ where: { jdbCardNumber1: data.jdbCardNumber1 } })
  ) {
    throw { message: `${data.jdbCardNumber1} is already exist`, status: 404 };
  }

  Object.assign(user, data);
  await user.save();
  let resultUser = await user.get();
  resultUser = {
    ...data,
    status: 200,
  };
  return omitHash(resultUser);
}

async function updateUserKyc(userAddress, data) {
  const user = await db.User.findOne({ where: { userAddress: userAddress } });
  // validate

  if (!user) {
    throw { message: `${userAddress} is not found`, status: 404 };
  }

  if (data.hasOwnProperty("staking") || data.hasOwnProperty("stakeapprove")) {
    data.stakedate = new Date().toUTCString();
    console.log(data.stakedate);
  }
  console.log(data.stakedate);
  Object.assign(user, data);
  await user.save();
  let resultUser = await user.get();
  resultUser = {
    ...data,
    status: 200,
  };
  return omitHash(resultUser);
}

async function updateCardStatus(cardId, data) {
  const user = await db.LoadCard.findOne({ where: { id: cardId } });
  // validate

  if (!user) {
    throw { message: `${userAddress} is not found`, status: 404 };
  }

  Object.assign(user, data);
  await user.save();
  let resultUser = await user.get();
  resultUser = {
    ...data,
    status: 200,
  };
  return resultUser;
}

async function getBSCDetails() {
  const BSC = await db.BSCFee.scope("withHash").findAll();
  // console.log(await db.User.findOne({ email: data.email }));
  if (!BSC) {
    return { message: "Not Found", status: 404 };
  }
  return BSC;
}

async function getBSCOne(params) {
  const user = await db.BSCFee.scope("withHash").findOne();

  // console.log(await db.User.findOne({ email: data.email }));
  if (!user) {
    return { message: "Not Found", status: 404 };
  }
  return user;
}

async function verifyCard(params, data) {
  const user = await db.User.findOne({
    where: {
      userAddress: params.userAddress,
      jdbCardNumber1: data.jdbCardNumber1,
    },
  });
  if (user) {
    console.warn("User is Available");

    const newData = {
      card_img: data.card_img,
      card_activated: 2,
    };
    if (user.card_activated === 2) {
      return { message: "Your card has been activated by admin", status: 450 };
    }

    if (user.card_activated === 1) {
      return { message: "Card is already activated", status: 208 };
    }
    Object.assign(user, newData);
    await user.save();
    let resultUser = await user.get();
    resultUser = {
      ...data,
    };
    // return omitHash(resultUser);
    return { message: "Card Activated Successfully.", status: 200 };
  } else {
    console.log("Please check card number, you have entered!");
    return {
      message: "Please check the userAddress & card number, you have entered!",
      status: 404,
    };
  }
}
async function getVerifyEmail(params) {
  const user = await db.User.findOne({ where: { email: params.email } });
  // validate
  console.log(params);
  params = {
    email: params.email,
    email_verified_at: new Date().toISOString(),
  };
  Object.assign(user, params);
  await user.save();
  let resultUser = await user.get();
  resultUser = {
    email: resultUser.email,
    email_verified_at: resultUser.email_verified_at,
    status: 200,
  };
  console.log(resultUser.email_verified_at);
  await sendVerifySuccesfullMail(
    params.email,
    "Registration Completed",
    resultUser.email
  );
  return resultUser;
}
async function sendToMail(params) {
  if (!(await db.User.findOne({ where: { email: params.email } }))) {
    throw { message: `${params.email} is not registered`, status: 404 };
  }
  let url = `http://localhost:5000`;
  const user = await db.User.findOne({ where: { email: params.email } });
  // validate
  // console.log(user.email)
  let token = {
    userId: user.email,
    token: `${crypto.randomBytes(32).toString("hex")}/${user.email}`,
  };
  // console.log(token)
  const link = `${url}/password-reset?id=${user.id}&email=${token.token}`;
  await sendMail(params.email, "Password reset", link);
  let mail = { message: `Mail Sent Successfully`, status: 200 };
  return mail;
  // copy params to user and save
}

async function _delete(id) {
  const user = await getUser(id);
  await user.destroy();
}

// helper functions

async function getUser(userAddress) {
  const user = await db.User.scope("withHash").findOne({
    where: { userAddress },
  });
  if (!user) return { message: `User Not Found`, status: 404 };
  return user;
}

async function getUserDetails(userAddress) {
  const user = await db.User.scope("withHash").findAll({});

  return user;
}

function omitHash(user) {
  const { hash, ...userWithoutHash } = user;
  return userWithoutHash;
}

async function createCard(params) {
  const user = await getUser(params.userAddress);

  let currentUser = await db.User.findOne({
    where: { userAddress: params.userAddress, role_id: 3 },
  });
  // console.log(currentUser.dataValues.card_applied === 1)
  if (
    !(await db.User.findOne({
      where: { userAddress: params.userAddress, role_id: 3 },
    }))
  ) {
    throw { message: `${params.userAddress} not found!`, status: 404 };
  }

  /* if (currentUser.dataValues.cardCount === 1) {
      throw {
        message: `Card is already applied for ${params.email}`,
        status: 201,
      };
    } */

  let newCard = {
    ...params,
    card_applied: 1,
    cardCount: 1,
    card_email: params.card_email,
  };
  Object.assign(user, newCard);
  await user.save();
  let resultUser = await user.get();

  sendMailForApplyCard(
    ["cards@privacyswap.finance", "pankaj@ixiono.com"],
    `A New User Has signed up for a Card! ${params.card_email || ""} `,
    resultUser
  );

  return omitHash(resultUser);
}

async function uploadImages(userAddress, files) {
  const user = await getUser(userAddress);

  let currentUser = await db.User.findOne({
    where: { userAddress: userAddress, role_id: 3 },
  });
  // console.log(currentUser.dataValues.card_applied === 1)
  if (
    !(await db.User.findOne({
      where: { userAddress: userAddress, role_id: 3 },
    }))
  ) {
    throw { message: `${userAddress} not found!`, status: 404 };
  }

  /* if (currentUser.dataValues.cardCount === 1) {
      throw {
        message: `Card is already applied for ${params.email}`,
        status: 201,
      };
    } */

  let newCard = {
    userAddress: userAddress,
    card_img: files[0],
  };
  Object.assign(user, newCard);
  await user.save();
  let resultUser = await user.get();
  return omitHash(resultUser);
}

async function sendMail(email, subject, text) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: `cards@privacyswap.finance`, // generated ethereal user
      pass: `qnzydclhistiqxwg`, // generated ethereal password
    },
  });

  return await transporter.sendMail({
    from: `cards@privacyswap.finance`,
    to: email,
    subject: subject,
    html: `<html lang="en-US">
        <head>
            <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
            <title>Reset Password Email Template</title>
            <meta name="description" content="Reset Password">
            <style type="text/css">
                a:hover {text-decoration: underline !important;}
            </style>
        </head>
        
        <body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #f2f3f8;" leftmargin="0">
            <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8"
                style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;">
                <tr>
                    <td>
                        <table style="background-color: #f2f3f8; max-width:670px;  margin:0 auto;" width="100%" border="0"
                            align="center" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="height:30px;">&nbsp;</td>
                            </tr>
                            <tr>
                                <td>
                                    <table width="95%" border="0" align="center" cellpadding="0" cellspacing="0"
                                        style="max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);">
                                        <tr>
                                            <td style="height:40px;">&nbsp;</td>
                                        </tr>
                                        <tr>
                                            <td style="padding:0 35px;">
                                                <h1 style="color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;">You have
                                                    requested to reset your password</h1>
                                                <span
                                                    style="display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;"></span>
                                                <p style="color:#455056; font-size:15px;line-height:24px; margin:0;">
                                                    We cannot simply send you your old password. A unique link to reset your
                                                    password has been generated for you. To reset your password, click the
                                                    following link and follow the instructions.
                                                </p>
                                                <p style="color:#455056; font-size:15px;line-height:24px; margin:0;">
                                                    ${text}
                                                </p>
                                                <a href="${text}"
                                                    style="background:#20e277;text-decoration:none !important; font-weight:500; margin-top:35px; color:#fff;text-transform:uppercase; font-size:14px;padding:10px 24px;display:inline-block;border-radius:50px;">Reset
                                                    Password</a>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="height:40px;">&nbsp;</td>
                                        </tr>
                                    </table>
                                </td>
                            <tr>
                                <td style="height:30px;">&nbsp;</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>`,
  });
}
async function sendVerifyMail(email, subject, text) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: `cards@privacyswap.finance`, // generated ethereal user
      pass: `qnzydclhistiqxwg`, // generated ethereal password
    },
  });

  return await transporter
    .sendMail({
      from: `cards@privacyswap.finance`,
      to: email,
      subject: subject,
      html: `<html lang="en-US">
    <head>
        <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
        <title>Reset Password Email Template</title>
        <meta name="description" content="Verify Email">
        <style type="text/css">
            a:hover {text-decoration: underline !important;}
        </style>
    </head>
    
    <body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #f2f3f8;" leftmargin="0">
        <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8"
            style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;">
            <tr>
                <td>
                    <table style="background-color: #f2f3f8; max-width:670px;  margin:0 auto;" width="100%" border="0"
                        align="center" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="height:30px;">&nbsp;</td>
                        </tr>
                        <tr>
                            <td>
                                <table width="95%" border="0" align="center" cellpadding="0" cellspacing="0"
                                    style="max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);">
                                    <tr>
                                        <td style="height:40px;">&nbsp;</td>
                                    </tr>
                                    <tr>
                                        <td style="padding:0 35px;">
                                            <p style="color:#1e1e2d; font-weight:500; margin:0;font-size:14px;font-family:'Rubik',sans-serif;">
                                            One quick step is needed to complete your PrivacySwap card member account.

                                           
                                                
                                            </p>
                                            <br/>
                                            <br/>
                                            <p style="color:#1e1e2d; font-weight:500; margin:0;font-size:14px;font-family:'Rubik',sans-serif;">
                                               

                                                Let’s make sure this is the right email address for you by clicking on the button below.
                                                
                                            </p>
                                            <p style="text-align:center">
                                            Your OTP is ${text}
                                            </p>

                                           
                                            <br/>
                                            <p>Regards,<br/>
                                                PrivacySwap Team</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="height:40px;">&nbsp;</td>
                                    </tr>
                                </table>
                            </td>
                        <tr>
                            <td style="height:30px;">&nbsp;</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>`,
    })
    .catch((err) => {
      console.log("mail not sent", err);
    });
}
async function sendVerifySuccesfullMail(email, subject, user) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: `cards@privacyswap.finance`, // generated ethereal user
      pass: `qnzydclhistiqxwg`, // generated ethereal password
    },
  });

  return await transporter.sendMail({
    from: `cards@privacyswap.finance`,
    to: email,
    subject: subject,
    html: `<html lang="en-US">
        <head>
            <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
            <title>Reset Password Email Template</title>
            <meta name="description" content="Verify Email">
            <style type="text/css">
                a:hover {text-decoration: underline !important;}
            </style>
        </head>
        
        <body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #f2f3f8;" leftmargin="0">
            <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8"
                style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;">
                <tr>
                    <td>
                        <table style="background-color: #f2f3f8; max-width:670px;  margin:0 auto;" width="100%" border="0"
                            align="center" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="height:30px;">&nbsp;</td>
                            </tr>
                            <tr>
                                <td>
                                    <table width="95%" border="0" align="center" cellpadding="0" cellspacing="0"
                                        style="max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);">
                                        <tr>
                                            <td style="height:40px;">&nbsp;</td>
                                        </tr>
                                        <tr>
                                            <td style="padding:0 35px;">
                                                <h1 style="color:#1e1e2d; font-weight:500; margin:0;font-size:19px;font-family:'Rubik',sans-serif;">Dear ${user}</h1>
                                              
                                                <span
                                                    style="display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;"></span>
                                                <p style="color:#455056; font-size:15px;line-height:24px; margin:0;">
                                                Thank you for signing up on our platform. Your registration is successful!
                                                </p>
                                                <p>Regards,<br/>
                                                PrivacySwap Team</p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="height:40px;">&nbsp;</td>
                                        </tr>
                                    </table>
                                </td>
                            <tr>
                                <td style="height:30px;">&nbsp;</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>`,
  });
}
async function updateaffiliate(userAddress, params) {
  const user = await db.User.findOne({ where: { userAddress } });
  // validate
  if (!user) {
    return { message: `${userAddress} is not registered`, status: 404 };
  }

  const newData = {
    affiliate: params.affiliate,
  };

  console.log(user.userAddress);
  Object.assign(user, newData);
  await user.save();

  let resultUserDb = await user.get();
  let resultUser = {
    status: 200,
    data: resultUserDb.affiliate,
  };
  return await resultUser;
}
async function createotp(params) {
  if (!validator.validate(params.email)) {
    throw { message: params.email + '" is not a valid email.', status: 409 };
  }
  const existingUser = await db.User.findOne({
    where: { email: params.email },
  });
  let Otp = Math.floor(1000 + Math.random() * 9000);
  const email = params.email;
  if (existingUser) {
    existingUser.OTP = Otp;
    await existingUser.save();
  } else {
    const newotp = {
      email,
      OTP: Otp,
      role: `user`,
      role_id: 3,
    };
    const otp = new db.User(newotp);
    await otp.save();
  }
  // save user
  //await db.User.create(newUser);
  console.log("creater user");

  let token = {
    userId: existingUser.email,
    token: `${crypto.randomBytes(32).toString("hex")}`,
  };
  console.log("creater user");
  console.log("create-user ==>", params.email);
  await sendOtpMail(
    params.email,
    Otp,
    `Welcome to BaaS. Use code ${Otp} to verify your email`
  );
  console.log("mail sent");
  let mail = { message: `Verification Mail Sent Successfully`, status: 200 };
  return mail;
}
async function createnew(params) {
  const user = await db.User.findOne({ where: { email: params.email } });
  if (user.OTP !== params.OTP) {
    return { message: "otp incorrect" };
  } else if (user.password !== null) {
    return { message: "email already registered try to login" };
  } else {
    params.password = await bcrypt.hash(params.password, 10);

    const result = await db.User.update(
      { password: params.password },
      { where: { email: params.email } }
    );
    let mails = { message: `registration successfull`, status: 200 };
    return mails;
  }
}

async function sendOtpMail(email, OTP, text) {
  const mg = mailgun({
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
  });

  const data = {
    from: `No-Reply <${process.env.MAILGUN_EMAIL}>`,
    to: email,
    subject: "Welcome to BAAS",
    text: `Welcome to BaaS. Use code ${OTP} to verify your email`,
  };

  mg.messages().send(data, (error, body) => {
    console.log("Message sent!\nBody =>", body);
  });
}

async function sendForgotPasswordEmail(params) {
  const user = await db.User.findOne({ where: { email: params.email } });

  if (!user) {
    throw { message: `${params.email} is not registered`, status: 404 };
  }

  user = await db.User.findOne({ where: { email: params.email } });

  let Otp = Math.floor(1000 + Math.random() * 9000);

  user.OTP = Otp;
  await user.save();

  const mg = mailgun({
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
  });

  const data = {
    from: `No-Reply <${process.env.MAILGUN_EMAIL}>`,
    to: email,
    subject: "Reset Password",
    text: `Dear User,\nUse code ${Otp} to reset your email`,
  };

  mg.messages().send(data, (error, body) => {
    console.log("Message sent!\nBody =>", body);
  });
}

async function changePassword(params) {
  const user = await db.User.findOne({ where: { email: params.email } });
  if (user.OTP !== params.OTP) {
    return { message: "otp incorrect" };
  } else {
    params.password = await bcrypt.hash(params.password, 10);

    const result = await db.User.update(
      { password: params.password },
      { where: { email: params.email } }
    );
    let mails = { message: `Password reset successfull`, status: 200 };
    return mails;
  }
}
