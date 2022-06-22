const express = require("express");
const router = express.Router();
const Joi = require("joi");
const fetch = require("node-fetch");
const validateRequest = require("_middleware/validate-request");
const {
  authorizeUser,
  authorizeAdmin,
  authRole,
} = require("_middleware/authorize");
const userService = require("./user.service");
const { ROLE } = require("../../_role/role.dto");
const path = require("path");
const token = require("../token/token");
const ejs = require("ejs");
const adminService = require("../admin/admin.service");
const { getAllBalance } = require("../admin/admin.service");
const { getPayment, updateAllUsersBalance } = require("./user.service");
const excel = require("exceljs");
const moment = require("moment");

// routes
router.post("/login", authenticateSchema, authenticate);
router.post("/loginWithAddress", authenticateUsingAddress);
router.post("/register",  register);
router.post("/uploadImages", uploadImages);
router.get("/current", authorizeUser(), getCurrent);
router.get("/partner/:partner", partnerExists);
router.get("/verify-link/:email", verifyEmail);
router.get("/getOne/:userAddress", authorizeUser(), getById);
router.post("/forgotPasswordLink", sendMail);
router.put("/forgotPassword/:email", update);
router.get("/walletAmount", authorizeUser(), token.BalanceOF);
router.put("/applyForCard", registerSchemaForCard, createCard);
router.post("/cardPayment/:userAddress", cardPayment);
router.get("/pending-cardpayments/:status", listCardPayments);
router.get("/pending-cardpayments/export/:status/:users", exportCardPayments);
router.get("/cardload/export/:status/:users", exportCardLoad);
router.get("/exportTransactions/:status", exportTransactions);
router.get(
  "/user-cardpayments/:status/:userAddress",
  authorizeUser(),
  listCardPaymentsByUser
);
router.post("/updateCardStatus/:cardId", updateCardStatus);
router.post("/updateStakeStatus/:userAddress", updateStakeStatus);
router.post("/createCardPayment", createCardPayment);
router.get("/walletBalance/:userAddress", getBalance);
router.get("/whiteList", whiteList);
router.get("/updateBTCB", updateBTCB);
router.get("/updateUser/:uuid", authorizeUser(), updateUser);
router.put("/updateUserByAdmin/:uuid", updateUser);
router.get("/updateETH", updateETH);
router.get("/updateBUSD", updateBUSD);
router.get("/updateBNB", updateBNB);
router.get("/updateUSDC", updateUSDC);
router.get("/updateCake", updateCake);
router.get("/updateALPACA", updateALPACA);
router.get("/updateXVS", updateXVS);
router.get("/updateMDX", updateMDX);
router.get("/updateAUTO", updateAUTO);
router.get("/updateMBOX", updateMBOX);
router.get("/updateUSDT", updateUSDT);
router.get("/updateEPS", updateEPS);
router.post("/updateUserBalance", updateUserBalance);

router.get("/getPayment", (req) => getPayment(req.query.userAddress));

router.get("/getDepositAddress", getDepositAddress);
router.put("/verifyCard/:userAddress", verifyCard);
router.get("/getBSCDetails", getBSCDetails);
router.get("/getBSCOne", getBSCOne);
router.post("/eu/token", getEuToken);
router.post("/eu/import-screening/:token/:userAddress", getEuScreening);
router.get("/testCardLoad", loadCard);
router.put("/updateaffiliate/:userAddress", updateaffiliate);
router.post("/send-otp", registerotpSchema, send_otp);
router.post("/sendForgotPasswordEmail", sendForgotPasswordEmail);
router.post("/changePassword",  changePassword);

function loadCard(req, res, next) {
  userService
    .loadCard(req.query.symbol, req.query.quantity)
    .then((user) => {
      res.send(user);
    })
    .catch((err) => {
      console.log(err, "error");
      if (err.status !== undefined) {
        res.status(err.status).send(err);
      } else {
        res.send(err);
      }
      next;
    });
}

function exportCardLoad(req, res, next) {
  userService
    .listCardPaymentsByDate(req.params.status)
    .then((user) => {
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

        user = user.filter((item) =>
          req.params.users.split(",").includes(item.id)
        );
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

        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=" + "cardload.xlsx"
        );

        return workbook.xlsx.write(res).then(function () {
          res.status(200).end();
        });
      } else {
        console.log(user);
      }
    })
    .catch((err) => {
      console.log(err);
      if (!err) {
        res.send(err);
      } else {
        res.status(200).send(err);
      }
      next;
    });
}

function createCardPayment(req, res, next) {
  console.log("create payment");

  /*   let end = new Date();
  let start = new Date(new Date().toDateString() + " 12:00 pm");
  start.setDate(1); */

  /*  userService.listCardPaymentsByDate(status, start, end, req.body.userAddress).then(
    async (user) => {
      let loadedAmount = 0;
      if (user) {

        loadedAmount = user.reduce((a,b)=>Number(a.finalAmount) + Number(b.finalAmount)); */

  userService
    .createCardPayment(req.body)
    .then((user) => {
      console.log(user);
      if (!user.statusCode) {
        res.json({
          user,
          message: "created successful",
          status: 200,
        });
      } else {
        res.status(user.statusCode).json(user);
      }
    })
    .catch((err) => {
      console.log(err, "error");
      if (err.status !== undefined) {
        res.status(err.status).send(err);
      } else {
        res.send(err);
      }
      next;
    });
  /*    }
    }
  ); */
}

function getEuToken(req, ress, next) {
  var qs = require("querystring");
  var http = require("https");

  var options = {
    method: "POST",
    hostname: "eu.compliance-link.com",
    port: null,
    path: "/AuthServer/oauth/token",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      authorization: "Basic RGlzcnVwdEFQSTpEQHMyUnUwcDJ0SQ==",
      "cache-control": "no-cache",
      "postman-token": "d1cb0d2a-7401-7452-9252-751d4a068fb6",
    },
    insecureHTTPParser: true,
  };

  var reqs = http.request(options, function (res) {
    var chunks = [];

    res.on("data", function (chunk) {
      chunks.push(chunk);
    });

    res.on("end", async function () {
      var body = Buffer.concat(chunks);

      ress.json(JSON.parse(body.toString()));
    });
  });

  reqs.write(
    qs.stringify({ grant_type: "client_credentials", scope: "EXTERNAL" })
  );
  reqs.end();
}

function getEuScreening(req, ress, next) {
  var qs = require("querystring");
  var http = require("https");

  var options = {
    method: "POST",
    hostname: "eu.compliance-link.com",
    port: null,
    path: "/asm-screening-api/v2/import-screening",
    headers: {
      "Content-Type": "application/json",
      authorization: "Bearer " + req.params.token,
      "cache-control": "no-cache",
      "postman-token": "d1cb0d2a-7401-7452-9252-751d4a068fb6",
    },
    insecureHTTPParser: true,
  };

  var reqs = http.request(options, function (res) {
    var chunks = [];

    res.on("data", function (chunk) {
      chunks.push(chunk);
    });

    res.on("end", async function () {
      var body = Buffer.concat(chunks);

      let responseData = JSON.parse(body.toString());

      if (responseData && responseData.screeningStatus == "success") {
        await userService.updateUserKyc(req.params.userAddress, {
          is_kyc_approved: "1",
        });
      }
      ress.json(JSON.parse(body.toString()));
    });
  });

  reqs.write(JSON.stringify(req.body));
  reqs.end();
}

async function getDepositAddress(req, res, next) {
  address = await userService.getDepositAddress();
  res.status(200).send({ address: address });
}

function getBalance(req, res, next) {
  userService
    .getBalance(req.params)
    .then((user) => {
      if (!user.status) {
        res.status(200).send(user);
      } else {
        res.status(200).send(user);
      }
    })
    .catch((err) => {
      console.log(err);
      if (!err.status) {
        res.status(400).send(err);
      } else {
        res.status(400).json(err);
      }
      next;
    });
}

function getBSCDetails(req, res, next) {
  userService
    .getBSCDetails()
    .then((user) => {
      res.status(200).send(user);
    })
    .catch((err) => {
      // console.log(err);
      if (!err.status) {
        res.status(400).send(err);
      } else {
        res.status(400).json(err);
      }
      next;
    });
}

function partnerExists(req, res, next) {
  adminService
    .partnerExists(req.params.partner)
    .then((user) => {
      console.log(user);
      if (!user.status) {
        res.status(200).send(user);
      } else {
        res.status(200).send(user);
      }
    })
    .catch((err) => {
      console.log(err);
      if (!err.status) {
        res.status(404).send(err);
      } else {
        res.status(err.status).json(err);
      }
      next;
    });
}

function getBSCOne(req, res, next) {
  userService
    .getBSCOne(req.params)
    .then((user) => {
      res.status(200).send(user);
    })
    .catch((err) => {
      // console.log(err);
      if (!err.status) {
        res.status(400).send(err);
      } else {
        res.status(400).json(err);
      }
      next;
    });
}

function updateBTCB(req, res, next) {
  userService
    .updateBTCB(req.query)
    .then((user) => {
      res.status(200).send(user);
    })
    .catch((err) => {
      res.status(400).send(err);
      next;
    });
}

function updateUser(req, res, next) {
  userService
    .updateUser(req.params.uuid, req.body)
    .then((user) => {
      res.status(200).send(user);
    })
    .catch((err) => {
      res.status(400).send(err);
      next;
    });
}
function updateCardStatus(req, res, next) {
  userService
    .updateCardStatus(req.params.cardId, req.body)
    .then((user) => {
      res.status(200).send(user);
    })
    .catch((err) => {
      res.status(400).send(err);
      next;
    });
}

function updateStakeStatus(req, res, next) {
  userService;
  userService
    .updateUserKyc(req.params.userAddress, req.body)
    .then((user) => {
      res.status(200).send(user);
    })
    .catch((err) => {
      res.status(400).send(err);
      next;
    });
}

function updateETH(req, res, next) {
  userService
    .updateETH(req.query)
    .then((user) => {
      res.status(200).send(user);
    })
    .catch((err) => {
      res.status(400).send(err);
      next;
    });
}

function updateBUSD(req, res, next) {
  userService
    .updateBUSD(req.query)
    .then((user) => {
      res.status(200).send(user);
    })
    .catch((err) => {
      res.status(400).send(err);
      next;
    });
}

function updateBNB(req, res, next) {
  userService
    .updateBNB(req.query)
    .then((user) => {
      res.status(200).send(user);
    })
    .catch((err) => {
      res.status(400).send(err);
      next;
    });
}

function updateUSDC(req, res, next) {
  userService
    .updateUSDC(req.query)
    .then((user) => {
      res.status(200).send(user);
    })
    .catch((err) => {
      res.status(400).send(err);
      next;
    });
}

function updateCake(req, res, next) {
  userService
    .updateCake(req.query)
    .then((user) => {
      res.status(200).send(user);
    })
    .catch((err) => {
      res.status(400).send(err);
      next;
    });
}

function updateALPACA(req, res, next) {
  userService
    .updateALPACA(req.query)
    .then((user) => {
      res.status(200).send(user);
    })
    .catch((err) => {
      res.status(400).send(err);
      next;
    });
}

function updateXVS(req, res, next) {
  userService
    .updateXVS(req.query)
    .then((user) => {
      res.status(200).send(user);
    })
    .catch((err) => {
      res.status(400).send(err);
      next;
    });
}

function updateMDX(req, res, next) {
  userService
    .updateMDX(req.query)
    .then((user) => {
      res.status(200).send(user);
    })
    .catch((err) => {
      res.status(400).send(err);
      next;
    });
}

function updateAUTO(req, res, next) {
  userService
    .updateAUTO(req.query)
    .then((user) => {
      res.status(200).send(user);
    })
    .catch((err) => {
      res.status(400).send(err);
      next;
    });
}

function updateMBOX(req, res, next) {
  userService
    .updateMBOX(req.query)
    .then((user) => {
      res.status(200).send(user);
    })
    .catch((err) => {
      res.status(400).send(err);
      next;
    });
}

function updateUSDT(req, res, next) {
  userService
    .updateUSDT(req.query)
    .then((user) => {
      res.status(200).send(user);
    })
    .catch((err) => {
      res.status(400).send(err);
      next;
    });
}

function updateEPS(req, res, next) {
  userService
    .updateEPS(req.query)
    .then((user) => {
      res.status(200).send(user);
    })
    .catch((err) => {
      res.status(400).send(err);
      next;
    });
}

function updateUserBalance(req, res, next) {
  userService
    .updateUserBalance(req.query)
    .then((user) => {
      res.status(200).send(user);
    })
    .catch((err) => {
      res.status(400).send(err);
      next;
    });
}

function whiteList(req, res, next) {
  userService
    .whiteList(req.query)
    .then((user) => {
      res.status(200).send(user);
    })
    .catch((err) => {
      res.status(400).send(err);
      next;
    });
}

function verifyEmail(req, res, next) {
  userService
    .getVerifyEmail(req.params)
    .then((user) => {
      res.sendFile(path.join(__dirname + "/thankyou.html"));
    })
    .catch(next);
}

function authenticateSchema(req, res, next) {
  const schema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}

function authenticateSchemaWithAddress(req, res, next) {
  const schema = Joi.object({
    userAddress: Joi.string().required(),
    partnerName: Joi.string(),
  });
  validateRequest(req, next, schema);
}

function authenticate(req, res, next) {
  userService
    .authenticate(req.body)
    .then((user) => {
      res.status(user.status).json(user);
    })
    .catch((err) => {
      res.status(err.status).send(err);
      next;
    });
}

function authenticateUsingAddress(req, res, next) {
  console.log("user here");
  userService
    .authenticateUsingAddress(req.body)
    .then((user) => {
      res.status(user.status).json(user);
    })
    .catch((err) => {
      console.log(err);
      res.status(400).send(err);
      next;
    });
}

function registerSchemaForCard(req, res, next) {
  const schema = Joi.object({
    title: Joi.string().required(),
    id_type: Joi.string().required(),
    id_no: Joi.string().required(),
    id_issued_date: Joi.string().required(),
    gender: Joi.string().required(),
    marital_status: Joi.string().required(),
    mailing_address_line_1: Joi.string().required(),
    passport_expiry_date: Joi.string().required(),
    emergency_contact_person: Joi.string().required(),
    emergency_contact_telephone_number: Joi.number().required(),
    place_of_id_issued: Joi.string().required(),
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    contactNumber: Joi.number().required(),
    dob: Joi.string().required(),
    email: Joi.string().required(),
    userAddress: Joi.string().required(),
    card_email: Joi.string().required(),
    card_type: Joi.string().required(),
    address1: Joi.string().required(),
    state: Joi.string().required(),
    pincode: Joi.number().required(),
    city: Joi.string().required(),
    countryName: Joi.string().required(),
    nationality: Joi.string().required(),
    passport_id: Joi.string().required(),
    img_sign: Joi.string().required(),
    passport_file_signature: Joi.string().required(),
    passport_file_signature_biopic: Joi.string(),
    residence_city: Joi.string().required(),
    residence_countryName: Joi.string().required(),
    residence_pincode: Joi.string().required(),
    residence_state: Joi.string().required(),
    countryCode: Joi.number().required(),
    emergencycountryCode: Joi.number().required(),
    affiliate: Joi.boolean().required()
  });
  validateRequest(req, next, schema);
}

function registerSchema(req, res, next) {
  const schema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().min(6).required(),
    OTP:Joi.number().required()
  });
  validateRequest(req, next, schema);
}
function registerotpSchema(req, res, next) {
  const schema = Joi.object({
    email: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}
function register(req, res, next) {
  userService
    .createnew(req.body)
    .then((user) => {
      if (!user.status) {
          console.log(user, 'user');
          res.send(user);
      } else {
          res.status(200).send(user);
      }
  })
  .catch((err) => {
      // console.log(err);
      if (!err.status) {
          res.send(err);
      } else {
          res.status(400).send(err);
      }
      next;
  });
}
function changePassword(req, res, next) {
  userService
    .changePassword(req.body)
    .then((user) => {
      if (!user.status) {
          console.log(user, 'user');
          res.send(user);
      } else {
          res.status(200).send(user);
      }
  })
  .catch((err) => {
      // console.log(err);
      if (!err.status) {
          res.send(err);
      } else {
          res.status(400).send(err);
      }
      next;
  });
}
function send_otp(req, res, next) {
  userService
    .createotp(req.body)
    .then((user) => {
      if (!user.status) {
          console.log(user, 'user');
          res.send(user);
      } else {
          res.status(200).send(user);
      }
  })
  .catch((err) => {
      // console.log(err);
      if (!err.status) {
          res.send(err);
      } else {
          res.status(400).send(err);
      }
      next;
  });
}

function verifyCard(req, res, next) {
  userService
    .verifyCard(req.params, req.body)
    .then((user) => {
      res.send(user);
    })
    .catch((err) => {
      res.send(err);
    });
}

function getAll(req, res, next) {
  userService
    .getAll()
    .then((users) => res.json(users))
    .catch((err) => {
      res.send(err);
      next;
    });
}

function getCurrent(req, res, next) {
  res.json(req.user);
}

function getById(req, res, next) {
  userService
    .getById(req.params.userAddress)
    .then((user) => {
      if (!user.status) {
        res.status(200).send(user);
      } else {
        res.status(user.status).send(user);
      }
    })
    .catch((err) => {
      if (!err.status) {
        res.status(404).send(err);
      } else {
        res.status(err.status).json(err);
      }
      next;
    });
}

function uploadImages(req, res, next) {
  userService
    .uploadImages(req.query.userAddress, req.files)
    .then((user) => {
      res.json({ message: "Image Uploaded Successfully.", status: 200 });
      if (user) {
        res.status(user.status).send(user);
      } else {
        res.json({ message: "Image Uploaded Successfully.", status: 200 });
      }
    })
    .catch((err) => {
      console.log(err);
      if (!err) {
        res.send(err);
      } else {
        res.status(200).send(err);
      }
      next;
    });
}

function createCard(req, res, next) {
  // let data = req.body
  userService
    .createCard(req.body)
    .then((user) => {
      res.json({ message: "Card Applied Successfully.", status: 200 });
      if (user) {
        res.status(user.status).send(user);
      } else {
        res.json({ message: "Card Applied Successfully.", status: 200 });
      }
    })
    .catch((err) => {
      console.log(err);
      if (!err) {
        res.send(err);
      } else {
        res.status(200).send(err);
      }
      next;
    });
}

function cardPayment(req, res, next) {
  // let data = req.body
  userService
    .cardPayment(req.body, req.params.userAddress)
    .then((user) => {
      // res.json({ message: "Card Payment Successful", status: 200 });
      if (user.status) {
        res.status(user.status).send(user);
      } else {
        res.json({ message: "Card Payment Successful", status: 200 });
      }
    })
    .catch((err) => {
      console.log(err);
      if (!err) {
        res.send(err);
      } else {
        res.status(200).send(err);
      }
      next;
    });
}

function listCardPayments(req, res, next) {
  // let data = req.body
  userService
    .listCardPayments(req.params.status)
    .then((user) => {
      // res.json({ message: "Card Payment Successful", status: 200 });
      res.status(200).json(user);
    })
    .catch((err) => {
      console.log(err);
      if (!err) {
        res.send(err);
      } else {
        res.status(200).send(err);
      }
      next;
    });
}

function getFormattedDate(date) {
  let d = new Date(date),
    dformat =
      [
        (d.getMonth() + 1).padLeft(),
        d.getDate().padLeft(),
        d.getFullYear(),
      ].join("/") +
      " " +
      [
        d.getHours().padLeft(),
        d.getMinutes().padLeft(),
        d.getSeconds().padLeft(),
      ].join(":");

  return dformat;
}

function convert(n) {
  var sign = +n < 0 ? "-" : "",
    toStr = n.toString();
  if (!/e/i.test(toStr)) {
    return n;
  }
  var [lead, decimal, pow] = n
    .toString()
    .replace(/^-/, "")
    .replace(/^([0-9]+)(e.*)/, "$1.$2")
    .split(/e|\./);
  return +pow < 0
    ? sign +
        "0." +
        "0".repeat(Math.max(Math.abs(pow) - 1 || 0, 0)) +
        lead +
        decimal
    : sign +
        lead +
        (+pow >= decimal.length
          ? decimal + "0".repeat(Math.max(+pow - decimal.length || 0, 0))
          : decimal.slice(0, +pow) + "." + decimal.slice(+pow));
}
const calculateDecimal = (value) => {
  if (value != undefined) {
    var num = value;

    if (value.toString().match(/^-?\d+(?:\.\d{0,2})?/)) {
      var with2Decimals = num.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];

      return with2Decimals;
    } else {
      return value;
    }
  }
  return 0;
};
function getAssetAmount(user, card) {
  let value = 0;
  if (
    user.assetType.toUpperCase() == "USDT" ||
    user.assetType.toUpperCase() == "BUSD" ||
    user.assetType.toUpperCase() == "USDC"
  ) {
    value = calculateDecimal(
      convert(user.cardLoadAmount / Math.pow(10, 18) || "")
    );
  } else if (card == "card") {
    value = calculateDecimal(
      convert(user.cardLoadAmount / Math.pow(10, 18) || "")
    );
  } else {
    value = calculateDecimal(convert(user.otcAmount || ""));
  }

  return value;
}

/* function exportCardPayments(req, res, next) {
  // let data = req.body
  userService
    .exportLoadCard(req.params.status)
    .then((user) => {
      const userArray = req.params.users.split(",");
      if (user) {
        const workbook = new excel.Workbook();
        let worksheet = workbook.addWorksheet("PRV_CARD_LOAD");

        worksheet.columns = [
          { header: "S/N", key: "id", width: 5 },
          { header: "Date", key: "updatedAt", width: 25 },
          { header: "referredBy", key: "referredBy", width: 25 },
          { header: "first name", key: "firstName", width: 25 },
          { header: "last name", key: "lastName", width: 25 },
          { header: "Account Number", key: "cardField", width: 25 },
          { header: "Asset Type", key: "assetType", width: 25 },
          { header: "Asset Amount", key: "quantity", width: 25 },
          { header: "Total OTC Amount", key: "otcAmount", width: 25 },
          { header: "Partner OTC Fee", key: "partnerFee", width: 25 },
          { header: "PRV OTC Fee", key: "prvFee", width: 25 },

          { header: "PRV CardLoad Fee", key: "cardLoadFee", width: 25 },
          { header: "Card Load Amount", key: "cardLoadAmount", width: 25 },

          { header: "status", key: "status", width: 10 },

        ];

        let formatedData = user.filter((item) => userArray.includes(item.id));

        formatedData = formatedData.map((user, index) => {
          user.updatedAt = moment(
            new Date(user.createdAt).toLocaleString("en-US", {
              timeZone: "Asia/Singapore",
            })
          ).format("DD/MM/YYYY h:mm a");
          user.referredBy =
            user.referredBy != "" && user.referredBy != null
              ? user.referredBy
              : "N/A";
          user.id = index + 1;
      
          user.quantity = user.quantity;
          user.cardLoadFee = Number(user.cardLoadFee).toFixed(2);
          user.cardLoadAmount =  getAssetAmount(user);
          return user;
        });
        worksheet.addRows(formatedData);

        // res is a Stream object
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=" + "cardload.xlsx"
        );

        return workbook.xlsx.write(res).then(function () {
          res.status(200).end();
        });
      } else {
        res.status(404).json(user);
      }
    })
    .catch((err) => {
      console.log(err);
      if (!err) {
        res.send(err);
      } else {
        res.status(200).send(err);
      }
      next;
    });
} */

function exportCardPayments(req, res, next) {
  // let data = req.body
  userService
    .listCardPayments(req.params.status)
    .then((user) => {
      const userArray = req.params.users.split(",");
      if (user) {
        const workbook = new excel.Workbook();
        let worksheet = workbook.addWorksheet("PRV_CARD_LOAD");

        worksheet.columns = [
          { header: "S/N", key: "serial", width: 5 },
          { header: "Date", key: "updatedAt", width: 25 },
          { header: "referredBy", key: "referredBy", width: 25 },
          { header: "first name", key: "firstName", width: 25 },
          { header: "last name", key: "lastName", width: 25 },
          { header: "Account Number", key: "accountNumber", width: 25 },
          { header: "Asset Type", key: "assetType", width: 25 },
          { header: "Asset Amount", key: "quantity", width: 25 },
          { header: "Total OTC Amount", key: "otcAmount", width: 25 },
          { header: "Partner OTC Fee", key: "partnerFee", width: 25 },
          { header: "PRV OTC Fee", key: "prvFee", width: 25 },

          { header: "PRV CardLoad Fee", key: "cardLoadFee", width: 25 },
          { header: "Card Load Amount", key: "cardLoadAmount", width: 25 },

          { header: "status", key: "status", width: 10 },

          /*  { header: "userAddress", key: "userAddress", width: 25 },
          { header: "cardField", key: "cardField", width: 25 }, */
        ];

        let formatedData = user.filter((item) => userArray.includes(item.id));

        formatedData = formatedData.map((user, index) => {
          user.updatedAt =
            moment(
              new Date(user.createdAt).toUTCString("en-US", {
                timeZone: "Asia/Singapore",
              })
            ).format("DD/MM/YYYY h:mm a") + "'";
          user.referredBy =
            user.referredBy != "" && user.referredBy != null
              ? user.referredBy
              : "N/A";
          user.serial = index + 1;
          user.quantity = user.quantity;
          user.cardLoadFee = Number(user.cardLoadFee).toFixed(2);
          user.otcAmount = Number(getAssetAmount(user)).toFixed(2);
          user.cardLoadAmount = Number(getAssetAmount(user, "card")).toFixed(2);
          user.assetType = user.assetType.toUpperCase();
          return user;
        });
        worksheet.addRows(formatedData);

        // res is a Stream object
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=" + "cardload.xlsx"
        );

        return workbook.xlsx.write(res).then(function () {
          res.status(200).end();
        });
      } else {
        res.status(404).json(user);
      }
    })
    .catch((err) => {
      console.log(err);
      if (!err) {
        res.send(err);
      } else {
        res.status(200).send(err);
      }
      next;
    });
}

function convertNumber(n) {
  var sign = +n < 0 ? "-" : "",
    toStr = n.toString();
  if (!/e/i.test(toStr)) {
    return n;
  }
  var [lead, decimal, pow] = n
    .toString()
    .replace(/^-/, "")
    .replace(/^([0-9]+)(e.*)/, "$1.$2")
    .split(/e|\./);
  return +pow < 0
    ? sign +
        "0." +
        "0".repeat(Math.max(Math.abs(pow) - 1 || 0, 0)) +
        lead +
        decimal
    : sign +
        lead +
        (+pow >= decimal.length
          ? decimal + "0".repeat(Math.max(+pow - decimal.length || 0, 0))
          : decimal.slice(0, +pow) + "." + decimal.slice(+pow));
}

function exportTransactions(req, res, next) {
  // let data = req.body
  let today = new Date(new Date().toDateString() + " 12:00 pm");
  let yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  userService
    .listCardPaymentsByDate(req.params.status, today, yesterday)
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

        // res is a Stream object
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=" + "cardload.xlsx"
        );

        const buffer = await workbook.xlsx.writeBuffer();

        userService.sendTransactionMail("Card Load Transaction Mail", buffer);

        return workbook.xlsx.write(res).then(function () {
          res.status(200).end();
        });
      } else {
        res.status(404).json(user);
      }
    })
    .catch((err) => {
      console.log(err);
      if (!err) {
        res.send(err);
      } else {
        res.status(200).send(err);
      }
      next;
    });
}

function listCardPaymentsByUser(req, res, next) {
  // let data = req.body
  userService
    .listCardPaymentsByUser(req.params.status, req.params.userAddress)
    .then((user) => {
      // res.json({ message: "Card Payment Successful", status: 200 });
      res.status(200).json(user);
    })
    .catch((err) => {
      console.log(err);
      if (!err) {
        res.send(err);
      } else {
        res.status(200).send(err);
      }
      next;
    });
}

function update(req, res, next) {
  userService
    .update(req.params.email, req.body)
    .then((user) => {
      res.status(user.status).send(user);
    })
    .catch((err) => {
      res.status(err.status).send(err);
      next;
    });
}

function sendMail(req, res, next) {
  // console.log(req.body)
  userService
    .sendToMailnew(req.body)
    .then((user) => {
      if (!user.status) {
        res.send({ message: `Mail Sent Successfully`, status: 200 });
      } else {
        res.status(user.status).send(user);
      }
    })
    .catch((err) => {
      if (!err.status) {
        res.send(err);
      } else {
        res.status(err.status).send(err);
      }
      next;
    });
}

function _delete(req, res, next) {
  userService
    .delete(req.params.id)
    .then(() => res.json({ message: "User deleted successfully", stauts: 200 }))
    .catch((err) => {
      res.send(err);
      next;
    });
}
function updateaffiliate(req, res, next) {
  userService
    .updateaffiliate(req.params.userAddress, req.body)
    .then((user) => {
      if (!user.status) {
        res.send(user);
      } else {
        res.status(user.status).send(user);
      }
    })
    .catch((err) => {
      if (!err.status) {
        res.send(err);
      } else {
        res.status(err.status).send(err);
      }
      next;
    });
}
function sendForgotPasswordEmail(req, res, next) {
  userService
    .sendForgotPasswordEmail(req.body)
    .then((user) => {
      if (!user.status) {
          console.log(user, 'user');
          res.send(user);
      } else {
          res.status(200).send(user);
      }
  })
  .catch((err) => {
      // console.log(err);
      if (!err.status) {
          res.send(err);
      } else {
          res.status(400).send(err);
      }
      next;
  });
}
module.exports = router;
