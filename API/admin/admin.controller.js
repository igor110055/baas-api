const express = require("express");
const router = express.Router();
const Joi = require("joi");
const validateRequest = require("_middleware/validate-request");
const { authorizeAdmin, authRole } = require("_middleware/authorize");
const adminService = require("./admin.service");
const userService = require("../users/user.service");
const { ROLE } = require("./dto/admin.dto");
const path = require("path");
const ejs = require("ejs");
const fs = require("fs");
const fetch = require("node-fetch");
const excel = require("exceljs");
const moment = require("moment");
const css1 = {
  style: fs.readFileSync("./views/css/style.css", "utf8"),
};
const utils = require("util");
const puppeteer = require("puppeteer");
const hb = require("handlebars");
const readFile = utils.promisify(fs.readFile);
let pdf = require("html-pdf");
const Jimp = require("jimp");

// routes
router.post("/login", authenticateSchema, authenticate);
router.post("/register", registerSchema, createAdmin);
router.post("/addUserByPass", createUserByAdmin);
router.get("/getAllAdmins", authorizeAdmin(), getAllAdmins);
router.get("/getAllPartners", authorizeAdmin(), getAllParnters);
router.get("/partnerById/:id", authorizeAdmin(), getPartner);
router.post("/createPartner", authorizeAdmin(), createPartner);
router.put("/updatePartner/:id", authorizeAdmin(), updatePartner);
router.delete("/deletePartner/:id", authorizeAdmin(), deletePartner);
router.get("/getAllUsers", getAllUsers);
router.get("/current", authorizeAdmin(), getCurrent);
router.get("/verify-link/:email", verifyEmail);
router.get("/getOne/:email", authorizeAdmin(), getById);
router.put("/forgotPassword/:email", update);
router.post("/forgotPasswordLink", sendMail);
router.get("/downloadCard1/:userAddress", downloadCard1);
router.put("/updateUser-status/:userAddress", authorizeAdmin(), updateStatus);
router.post("/deleteUser/:id", _delete);
router.get("/downloadCard2/:userAddress", downloadCard2);
router.get("/cardapplyAndWhitelist/:userAddress", cardapplyAndWhitelist);
router.get("/debitCardTransaction", debitCardTrans);
router.get("/debitCheckBalance", debitCardBalance);
router.put("/updateUserByAdmin/:uuid", authorizeAdmin(), updateUser);
router.put("/cardStatus/:userAddress", cardStatus);
// router.get("/downloadCard4/:email", authorizeAdmin(), downloadCard4);
router.put("/updateBSCDetails", updateBSCDetails);
router.post("/createBSC", createBSC);
router.get("/getBSCOne", getBSCOne);
router.get("/getBSC/balance/:userAddress/:type", getBSCBalance);
router.get("/downloadAllPDFs/:userAddress", downloadAllPDFs);
router.get("/export/applicationForm/:userAddress", exportApplicationForm);
function verifyEmail(req, res, next) {
  adminService
    .getVerifyEmail(req.params)
    .then((user) => {
      res.sendFile(path.join(__dirname + "/thankyou.html"));
    })
    .catch(next);
}

function updateBSCDetails(req, res, next) {
  adminService
    .updateBSCDetails(req.body)
    .then((user) => {
      if (!user.status) {
        console.log(user, "user");
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

function createBSC(req, res, next) {
  console.log(req.body);
  adminService
    .createBSC(req.body)
    .then((user) => {
      if (!user.status) {
        console.log(user, "user");
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

function exportApplicationForm(req, res, next) {
  userService
    .getUserDetails()
    .then((user) => {
      if (user) {
        const userArray = req.params.userAddress;

        const workbook = new excel.Workbook();
        let worksheet = workbook.addWorksheet("applicationForm");

        worksheet.columns = [
          { header: "Application Date", key: "applicationDate", width: 25 },
          { header: "CIF No (Leave Blank)", key: "", width: 25 },
          { header: "ACC (Leave Blank)", key: "", width: 25 },
          { header: "Card Brand", key: "card_type", width: 25 },
          { header: "Title", key: "title", width: 15 },
          { header: "Full Name", key: "full_name", width: 25 },
          { header: "Emboss Name (Max 21 characters including spaces)", key: "first_name", width: 25 },
          { header: "ID Type", key: "id_type", width: 25 },
          { header: "ID No", key: "id_no", width: 25 },
          { header: "Date Of Birth dd/mm/yyyy", key: "dob", width: 25 },
          { header: "ID Issued Date", key: "id_issued_date", width: 25 },

          { header: "Gender", key: "gender", width: 25 },
          { header: "Martial Status", key: "marital_status", width: 25 },

          { header: "Mailing Address Line 1", key: "mail_add", width: 10 },

          {
            header: "Customer Telephone Number",
            key: "contact_numb",
            width: 25,
          },
          { header: "Nationality", key: "nationality", width: 25 },
          { header: "Residence Address Line 1", key: "residence_add", width: 40 },
          { header: "Company Name (Leave Blank)", key: "company_name", width: 25 },

          { header: "Emergency Contact Person1 (Leave Blank)", key: "emergency_contact_person", width: 25 },

          {
            header: "Emergency Contact Telephone Number (Leave Blank)",
            key: "emergency_contact",
            width: 25,
          },
          { header: "Place of ID Issued", key: "place_of_id_issued", width: 25 },
        ];

        let newRows = [];

        if (userArray != "all") {
          user = user.filter((item) => {
          
          
           return userArray.split(",").includes(item.id);
          })
        }


        user.forEach((item) => {

          item.applicationDate = 
          moment(
            new Date().toUTCString("en-US", {
              timeZone: "Asia/Singapore",
            })
          ).format("DD/MM/YYYY") + "";
          item.dob = 
          moment(
            new Date(item.dob).toUTCString("en-US", {
              timeZone: "Asia/Singapore",
            })
          ).format("DD/MM/YYYY") + "";

          item.id_issued_date = 
          moment(
            new Date(item.id_issued_date).toUTCString("en-US", {
              timeZone: "Asia/Singapore",
            })
          ).format("DD/MM/YYYY") + "";

          item.full_name = item.first_name + " " + item.last_name;
          item.mail_add = item["mailing_address_line_1"] + " " + item.city + " " + item.state + " " + item.countryName;
          item.contact_numb = "(" + item.countryCode  + ")" + " " + item.contactNumber;
          item.emergency_contact = "(" + item.emergencycountryCode + ")" + item.emergency_contact_telephone_number;
          item.residence_add = item["address1"] + " " + item.residence_city + " " + item.residence_state + " " + item.residence_countryName;

        });

        worksheet.addRows(user);

        worksheet
        .getColumn(1)
        .eachCell({ includeEmpty: true }, function (cell, rowNumber) {
         

          if(rowNumber == 1){
            cell.border = {
              bottom : {style : 'thin'}
            };
          }
        });

        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=" + "applicationForm.xlsx"
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

function cardStatus(req, res, next) {
  adminService
    .cardStatus(req.params, req.body)
    .then((user) => {
      if (!user.status) {
        res.json(user);
      } else {
        res.status(user.status).json(user);
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

function debitCardBalance(req, res, next) {
  const { card_number, first_date, end_date } = req.query;
  fetch(
    `http://128.199.172.219:8000/debitCheckBalance?card_number=${card_number}`
  )
    .then((res) => res.json())
    .then((result) => res.json(result))
    .catch((err) => {
      if (!err.status) {
        res.send(err);
      } else {
        res.status(err.status).send(err);
      }
      next;
    });
}

function getBSCBalance(req, res, next) {
  adminService
    .getBSCBalance(req.params.userAddress, req.params.type)
    .then((user) => {
      res.status(200).json(user);
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

function getBSCOne(req, res, next) {
  adminService
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

function debitCardTrans(req, res, next) {
  const { card_number, first_date, end_date } = req.query;
  fetch(
    `http://128.199.172.219:8000/debitCardTransaction?card_number=${card_number}&first_date=${first_date}&end_date=${end_date}`
  )
    .then((res) => res.json())
    .then((result) => res.json(result))
    .catch((err) => {
      if (!err.status) {
        res.send(err);
      } else {
        res.status(err.status).send(err);
      }
      next;
    });
}

function getFormatted(date = new Date(), sperater) {
  let d = new Date(date);
  d = d.toISOString().slice(0, 10);
  d = d
    .split("-")
    .reverse()
    .join(sperater || "/");
  return d;
}

function updateUser(req, res, next) {
  adminService
    .updateUser(req.params.uuid, req.body)
    .then((user) => {
      if (!res.status) {
        res.send(user);
      } else {
        res.status(200).send(user);
      }
    })
    .catch((err) => {
      console.log(err);
      if (!err.status) {
        res.send(err);
      } else {
        res.status(400).send(err);
      }
      next;
    });
}

async function downloadCard1(req, res, next) {
  // console.log(req.params)
  adminService
      .downloadCard(req.params)

  .then(async(data) => {
          let namebox = (
              data.title +
              " " +
              data.first_name +
              " " +
              data.last_name +
              " "
          ).split("");

          for (let index = namebox.length; index < 23; index++) {
              namebox.push("");
          }
          /*   const buffer = await Buffer.from(data.passport_file_signature, "base64"); */
          /* Jimp.read(buffer, async (err, resq) => {
                  if (err) return new Error(err);
                  return await resq
                    .quality(5)
                    .write(path.join(__dirname + `/public/${data.email}.jpg`));
                }); */
          // res.sendFile(`/Users/satya/frlnc.com/gitlab/nodesqlbackend/API/admin/resized.jpg`)
          let html2 = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">
    <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>JDB Card Application Form</title>
    <style>
    html {
      -webkit-print-color-adjust: exact;
    }
   
    @font-face {
      font-family: 'Firefly Sung';
      font-style: normal;
      font-weight: 400;
      src: url('{{asset("public/fonts/fireflysung.ttf")}}') format('truetype');
    }
    .utf-8-font, h3 .utf-8-font, h3 {
      font-family: Firefly Sung, DejaVu Sans, sans-serif;
    }
    span.utf-8-font {
      display: inline-block;
      line-height: 9px;
      margin-top: 3px;
     }
    * {
      margin: 0;
      padding: 0;
      max-width: 100%;
    }
    body, label, p {
      font-size: 9px;
      line-height: 11px;
    }
    .bound {
      margin: 3px auto;
      max-width: 650px;
      width: 650px;
      padding: 0px;
      clear: both;
    }
    .jdb_logo {
      max-width: 80px;
    }
    h2 {
      text-align: center;
      margin-left: 15px;
      line-height: 19px;
      font-size: 14px;
      display: inline-block;
      font-weight:normal;
    }
    h3 {
      background: #ccc;
      border: 1px solid #000;
      padding: 2px 5px;
      margin: 10px 0 5px;
      font-size: 11px;
    }
    h4{font-weight:normal;}
    ul li {
      list-style: none;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    input[type="text"] {
      border: none;
      border-bottom: 1px dotted #000;
      max-width: 100%;
      width: 90px;
      font-size: 10px;
      display: inline-block;
      margin-top: 3px;
      line-height: normal;
    }
    input[type="text"]:focus {
      outline: none;
      border: none;
      border-bottom: 1px dotted #00C;
    }
    input[type="checkbox"] {
      top:0px;
      position: relative;
      margin-right: 2px;
      vertical-align: top;
    }
    td {
      vertical-align: top;
      overflow: hidden;
    }
    .col50 {
      width: 50%;
    }
    label {
      position: relative;
      top: 1px;
    }
    .red-tx {
      color: #f00;
    }
    
    .box-border td {
      border: 1px solid #000;
    }
    .data-col {
      display: inline-block;
      margin-top: 2px;
      margin-right: 5px;
      width: 80px;
  border-bottom: 1px dotted #000;
    }
  .verti-align {vertical-align: bottom;}
    .data-col input.d-date, .data-col input.d-month {
      width: 15px;
      display: inline-block;
    }
    .data-col input.d-year {
      width: 30px;
      display: inline-block;
    }
    .ws_none, .ws_none td {
      white-space: normal;
    }
    .of_lis strong {
      font-size: 12px;
      top: 4px;
      position: relative;
      float: left;
      margin: 0 4px;
    }
    .of_lis li {
      padding-left: 7px;
      position: relative;
    }
    .of_lis li:before {
      position: absolute;
      left: 0;
      top: 11px;
      content: "";
      background: #000;
      height: 6px;
      width: 6px;
    }
    .pd td {
      padding: 3px 5px;
    }
    .width100 {
      width: 100px !important;
    }
    td.white-space, .white-space td {
      white-space: nowrap;
    }
    .of_lis p {
      padding-top: 6px;
      left: 5px;
      position: relative;
    }
    p {
      padding-top: 3px;
    }
    ol {
      padding-left: 15px;
    }
    .tx-center {
      text-align: center;
    }
    .table-sec ul {
      margin: 4px 0px 0px 0px;
    }
    .table-sec ul li {
      list-style: none;
      display: inline-block;
    }
    .table-form input[type="checkbox"] {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      height: 0;
      width: 0;
    }
    .checkmark {
      height: 17px;
      width: 15px;
      border: 2px solid#000 !important;
      position: absolute;
      left: 0;
      top: 0;
    }
    .checkmark:after {
      content: "";
      position: absolute;
      display: none;
    }
    .table-form .checkmark:after {
      left: 9px;
      top: 5px;
      width: 5px;
      height: 10px;
      border: solid black;
      border-width: 0 3px 3px 0;
      transform: rotate(45deg);
    }
    .table-form {
      display: inline-block;
      position: relative;
      padding-left: 13px;
      /*margin-bottom:2px;*/
      cursor: pointer;
      width: 99px;
      vertical-align: top;
      min-height:20px;
    }
    .table-sec p {
      padding: 0px;
      margin: 2px 0px;
      border-bottom: 1px solid #000;
      line-height: 10px;
    }
    .table-sec p:last-child {
      border: none;
    }
    .v-middle td {
      vertical-align: middle;
    }
    .v-top {
      vertical-align: top !important;
    }
    .bottom-sec p {
      line-height: 10px;
      font-size:8px;
      border: none;
    }
    .footer {
    
    }
    .seal input[type="text"] {
      border: none;
      border-bottom: 1px dotted #000;
      max-width: 100%;
      width: 210px;
    }
    .seal {
      width: 33%;
      display:inline-block;
      }
    .seal h4 {
      font-size: 10px;
    }
    label.box-lab {
      display: inline-block;
      border: 1px solid #000;
      padding:1px 5px;
      font-size:9px;
      line-height:10px;
    }
    .bor-none, .bor-none td {
      border: none;
    }
    .inline {
      display: inline-block;
    }
    .w100 {
      width: 100% !important;
      float: left;
    }
    .tx-center .utf-8-font {
      width: 100%;
      text-align: center;
    }
    .mg2{padding-left: 15px;}
    </style>
    </head>
    <body>
    <div class="bound">
      <table cellpadding="0" cellspacing="0">
        <tbody>
          <tr>
            <td><table>
                <tr>
                  <td width="200px"><img src="https://i.imgur.com/ayn0R9C.png" alt="JDB Card Application Form" class="jdb_logo"/></td>
                  <td style="vertical-align:bottom"><br />
                    <h2><span class="utf-8-font">开户申请书</span><br />
    APPLICATION FOR OPENNING ACCOUNT </h2></td>
                </tr>
              </table>
              <table>
                <tr>
                  <td style="text-align:right;"><label style="float:right;"><span class="utf-8-font">分行</span>/Branch:
                    <input type="text" name="" style="float:right; margin-top:10px;" /></label></td>
                </tr>
              </table>
              <table class="box-border tx-center pd" style="border-bottom: 2px dashed;">
          <tr>
            <td><span class="utf-8-font">签字式样</span> <strong>(Specimen signature)</strong> <br />
             
              <img src="${
                data["img_sign"]
              }" style="display:inline-block; height:50px; width:auto; max-width:none;margin-top: 5px;"  /> 
               </td>
            <td rowspan="4"><span class="utf-8-font">身份证/其他副本</span> <strong>(Copy ID Card/Other)</strong></td>
          </tr>
          <tr>
            <td style="text-align:center;"><span class="utf-8-font">帳戶激活條款</span></td>
          </tr>
          <tr>
            <td style="border-bottom: 3px dashed;">&nbsp;</td>
          </tr>
          <tr>
            <td style="text-align:left;"><span class="utf-8-font" style="display:inline-block;">账号/Account No:</span></td>
          </tr>
        </table>
              <table style="margin-top:2px;">
                <tr>
                  <td><span class="utf-8-font">本人/吾等</span> I/We:</td>
                  <td style="text-align:right;"><label style="display:inline-block; float:right;"><span class="utf-8-font">客户</span>ID Customer ID <input type="text" name="" style="border:1px solid #000 !important;" /></label>
                    </td>
                </tr>
              </table>
              <br />
              <table>
                <tr>
                  <td><label><span class="utf-8-font">姓名</span>(1)/Name(1):</label>
    <!--                 <input type="text" class="utf-8-font"  name="" value="{{$data['name'] ?? ''}}" style="width: 240px;" />
     -->                <span class="utf-8-font" style="border-bottom: 1px dotted #000;">${
       data.first_name
     } ${data.last_name}</span>
                    <label><span class="utf-8-font">出生日期</span> /Date of birth:</label>
                    <div class="data-col">
                      ${data.dob ? getFormatted(data.dob,"/") : ''}
                    </div>
                    <label><span class="utf-8-font">身份证/护照号码</span> ID/ Passport No:</label>
                    <input type="text" class="utf-8-font"  name="" value="${
                      data.passport_id
                    }" /></td>
                </tr>
                <tr>
                  <td><label><span class="utf-8-font">姓名</span>(2)/Name(2):</label>
                    <input type="text" name="" style="width: 140px;" />
                    <label><span class="utf-8-font">出生日期</span> /Date of birth:</label>
                    <div class="data-col verti-align ">
                 
                    </div>
                    <label><span class="utf-8-font">身份证/护照号码</span> ID/ Passport No:</label>
                    <input type="text" name="" value="" /></td>
                </tr>
                <tr>
                  <td><label><span class="utf-8-font">现居地址</span>/Present Address:</label>
                   <!--  <input type="text" class="utf-8-font"  name="" value="{{$data['residing_place']??''}}" style="width:232px" /> -->
                   <span class="utf-8-font">城市</span>
                    <label><span class="utf-8-font" style="width: 100%;border-bottom: 1px dotted #000;">${
                      data.address1
                    }</span>
                    城市/City</label>
                <span class="utf-8-font" style="width: 40%; margin-top:5px; border-bottom: 1px dotted #000;">${
                  data.city
                }</span>
                 
                    <label ><span  class="utf-8-font">省份</span>/Province</label>
        
                    <span class="utf-8-font" style="width:40%; border-bottom: 1px dotted #000;">${
                      data.state
                    }</span>
                    </td>
                </tr>
                <tr>
                  <td><label><span class="utf-8-font">电话 号码</span>/Tel: </label>
                    <input type="text" value="(+${data.countryCode}) ${
                      data.contactNumber
                    }" style="width:300px;" />
                    <label><span class="utf-8-font">传真</span>/Fax:</label>
                    <input type="text" name="" style="width:240px;" /></td>
                </tr>
                <tr>
                  <td><label><span class="utf-8-font">紧急联系人</span>/ Emergency Contact:</label>
                    <input type="text" name="" style="width:200px;" value=${
                      data.emergency_contact_person
                    } />
                    <label><span class="utf-8-font">手机号码</span>/Mobile:</label>
                    <input style="width:250px;" type="text" name="" value="(+${data.emergencycountryCode}) ${
                     data.emergency_contact_telephone_number
                    }"/></td>
                </tr>
                <tr>
                  <td><label><span class="utf-8-font">电子邮箱</span>/E-Mail:</label>
                    <!-- <input type="text" class="utf-8-font"  name="" value="{{$data['user']['email'] ?? ''}}" style="width:615px" /></td> -->
                    <span class="utf-8-font" style="width: 85%;border-bottom: 1px dotted #000;">${
                      data.email
                    }</span>
                </tr>
                <tr>
                  <td style="margin:2px 0"><span class="utf-8-font">向JDB申请开立账户，特此附上本人/吾等所有必要的详细信息（附件）。</span><br />
                    Apply to open account with JDB and here are all my/our necessary details information (Attachment) </td>
                </tr>
              </table>
              <table class="table-sec v-middle pd box-border" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="tx-center"><span class="utf-8-font">账户类别</span><br/>
                    Account Type </td>
                  <td colspan="2"><ul>
                      <li><input type="checkbox" class="checkmark" checked=""/>
                        <label class="table-form mg2">
                          <span class="utf-8-font">个人/联名</span><br/>
                          Personal/Joint </label>
                          <input type="checkbox" class="checkmark"/>
                        <label class="table-form mg2">
                          <span class="utf-8-font">公司</span><br/>
                          Company </label>
                          <input type="checkbox" class="checkmark"/>
                        <label class="table-form mg2">
                          <span class="utf-8-font">合伙/独资经营</span><br/>
                          Partnership/Sole Proprietor </label>
                          <input type="checkbox" class="checkmark"/>
                        <label class="table-form mg2">
                          <span class="utf-8-font">使馆</span><br/>
                          Embrassy </label>
                      </li>
                    </ul>
                    <ul>
                      <li>
                        <input type="checkbox" class="checkmark"/> 
                        <label class="table-form mg2">
                          <span class="utf-8-font">国有/合资企业</span> <br/>
                          State Owned/Joint Venture Co; </label>
                          <input type="checkbox" class="checkmark"/>
                        <label class="table-form mg2" >
                          <span class="utf-8-font">协会/非政府组织</span><br/>
                          Associates/NGO </label>
                          <input type="checkbox" class="checkmark"/>
                        <label class="table-form mg2">
                          <span class="utf-8-font">国际组织</span><br/>
                          International Organization </label>
                          <input type="checkbox" class="checkmark"/>
                        <label class="table-form mg2">
                          <span class="utf-8-font">其他</span><br/>
                          Other </label>
                      </li>
                    </ul></td>
                </tr>
                <tr>
                  <td class="tx-center"><span class="utf-8-font">业务类型</span><br/>
                    Type of Business </td>
                  <td width="45%" style="text-align:center;"><input type="text" name="" style="width:250px;"/>
                    <br />
                    <br />
                    <input type="text" name="" style="width:250px;" /></td>
                  <td width="45%"><p><span class="utf-8-font">营业执照/投资许可证号</span>:<br/>
                      ERC/IL No: </p>
                    <p><span class="utf-8-font">签发日期</span><br/>
                      Date of Issue: </p>
                    <p><span class="utf-8-font">签发地点</span><br/>
                      Place of Issue </p></td>
                </tr>
                <tr>
                  <td class="tx-center" style="padding:1px 5px">
        <span class="utf-8-font">账户类型&开户存款 <br />
                    水泥種類<br/>
          </span> 
          Type of Account & Initial Deposit(Amount)
         </td>
                  <td colspan="2" style="padding:1px 5px"><table class="bor-none">
                      <tr>
                        <td>
            <span class="utf-8-font"> 活期存款账户</span><br />
                          Current Acct.<br /><br />
                          <label class="box-lab"> <span class="utf-8-font">基普</span><br />LAK </label>
                          <input type="text" name="" />
                          <br />
                          <label class="box-lab"> <span class="utf-8-font">美元</span><br /> USD </label>
                          <input type="text" name="" />
                          <br />
                          <label class="box-lab"> <span class="utf-8-font">泰铢</span><br />THB </label>
                          <input type="text" name="" />
          </td>
          <td>
            <span class="utf-8-font">活期存款账户</span><br />
                          Savings Acct.<br /><br />
    
                          <label class="box-lab"> <span class="utf-8-font">基普</span><br />
                            LAK </label>
                          <input type="text" name="" />
                          <br />
                          <label class="box-lab"> <span class="utf-8-font">美元</span><br />
                            USD </label>
                          <!--<input type="text" name="" value="" style="font-size: 30px;" />-->
                          <input type="checkbox" name="" value="" class="checkmark" checked="" style="
                          border-bottom: 1px dotted #00c;
                          max-width: 100%;
                          width: 90px;
                          font-size: 10px;
                          display: inline-block;
                          margin-top: 7px;
                          line-height: normal;"/>
                          <br />
                          <label class="box-lab"> <span class="utf-8-font">泰铢</span><br />
                            THB </label>
                          <input type="text" name=""/>
          </td>
                        <td><span class="utf-8-font">活期存款账户</span><br />
                          Fixed Dep. / Fixed Install Dep<br /><br />
    
                          <label class="box-lab"> <span class="utf-8-font">基普</span><br />
                            LAK </label>
                          <input type="text" name="" />
                          <br />
                          <label class="box-lab"> <span class="utf-8-font">美元</span><br />
                            USD </label>
                          <input type="text" name="" />
                          <br />
                          <label class="box-lab"> <span class="utf-8-font">泰铢</span><br />
                            THB </label>
                          <input type="text" name="" /></td>
                      </tr>
                    </table></td>
                </tr>
                <tr>
                  <td class="tx-center"><span class="utf-8-font">参考凭证</span><br />
                    Reference Document(s) </td>
                  <td><table  cellpadding="0" cellspacing="0" style="border:none;">
                      <tr>
                        <td style="border:none;"><input type="checkbox" class="checkmark"/>
                          <label class="table-form" for="resident" style=" display: inline;">
                            
                            <span class="utf-8-font">居民/Resident</span><br/>
                            <span class="inline"><span class="utf-8-font">身份证/护照/户口簿</span></span>
                            <input type="text" name=""/>
                            <br />
                            <span class="inline">Identify Card / Passport / Family Book</span>
                            <input type="text" name=""/>
                          </label></td>
                      </tr>
                      <tr>
                        <td style="border:none; border-top:1px solid"> <input type="checkbox" class="checkmark"/>
                          <label class="table-form" for="non_resident" style=" display: inline;">
                           
                            <span class="utf-8-font">非居民/Non Resident</span> <br />
                            <span class="utf-8-font">护照/工作许可证/外国身份证</span><br />
                            Passport/Working permit and Foreign ID </label></td>
                      </tr>
                      <tr>
                        <td style="border:none; border-top:1px solid">
                          <input type="checkbox" class="checkmark"/>
                          <label class="table-form" for="article_of_association" style=" display: inline;">
                            
                            <span class="utf-8-font">组织章程/Article of Association</span> </label></td>
                      </tr>
                    </table></td>
                  <td class="v-top" style="padding:0;"><table>
                      <tr>
                        <td>
                          <input type="checkbox" class="checkmark"/>
                          <label class="table-form" for="invesment_license" style="display: inline;">
                            <span class="utf-8-font">投资许可证/Invesment License</span> </label></td>
                      </tr>
                      <tr>
                        <td>
                          <input type="checkbox" class="checkmark"/><label class="table-form" for="enterprise_registration"  style="display: inline;">
                            <span class="utf-8-font">企业法人营业执照/Enterprise Registration License</span> </label></td>
                      </tr>
                      <tr>
                        <td><input type="checkbox" class="checkmark"/>
                          <label class="table-form" for="tax_license"  style="display: inline;">
                            <span class="utf-8-font">税务登记证/Tax License</span></label></td>
                      </tr>
                      <tr>
                        <td><input type="checkbox" class="checkmark"/>
                          <label class="table-form" for="resolution_memorandum"  style="display: inline;">
                            <span class="utf-8-font">开立账户的决议/协议备忘录<br />
                            Resolution/Memorandum for Openning Acct. </span></label></td>
                      </tr>
                      <tr>
                        <td><label><span class="utf-8-font">其他/other</span></label>
                          <input type="text" /></td>
                      </tr>
                    </table></td>
                </tr>
                <tr>
                  <td class="tx-center"><span class="utf-8-font">提交申请</span> Submission For  </td>
                  <td colspan="2" style="padding:0">
                  <table style="width:100%;" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:150px;">
                          <!--<label class="tx-center">-->
            <label>
            <span class="utf-8-font"> ATM 卡<br />
                          ATM CARD </span></label>
                        <br />
                        <input type="checkbox" style="display:inline-block;">
                        <label class="table-form" for="premium" style="width:100%; display: inline; padding-left: 0px;">
                          
                          <span class="utf-8-font" style="display:inline-block;"> Premium </span>
                          </label>       
                          <input type="checkbox" style="display:inline-block;"><label>
                            <span class="utf-8-font" style="display:inline-block;"> General</span>
                          </label>            
                        <br />
                        <span class="utf-8-font">電話號碼:</span>
                        <input type="text" name="" /></td>
                        <td>
                          <input type="checkbox" class="checkmark" checked="" >
                          <label class="table-form" for="visa_debit_card" style="display: inline-table;">
                            <span class="utf-8-font">VISA 借记卡</span><br />
                            VISA DEBIT CARD </label>
                          <br /><br />
                          <span class="utf-8-font">沒有:</span>
                          <input type="text" name="" /></td>
                        <td>
                          <input type="checkbox" class="checkmark">
                          <label class="table-form" for="visa_debit_card" style="display: inline-table;">
                            <span class="utf-8-font">VISA 借记卡</span><br />
                            VISA CREDIT CARD </label>
                          <br /><br />
                          <span class="utf-8-font">沒有:</span>
                          <input type="text" name="" /></td>
                        <td>
                          <input type="checkbox" class="checkmark">
                          <label class="table-form" for="edc" style="display: inline-table;">
                            EDC<br />
                            EDC </label>
                          <br /><br />
                          <span class="utf-8-font">沒有:</span>
                          <input type="text" name="" /></td>
                      </tr>
                    </table></td>
                </tr>
                <tr>
                <td colspan="3">
                  <div class="bottom-sec">
                <p><span class="utf-8-font">本人/吾等特此证明， 据本人/吾等所知及所信， 上述所提供的信息均真实且完整。 本人/吾等确认本人/吾等已经阅读、理解并同意联合发展银行（JDB）</span></p>
                <p><span class="utf-8-font">就本人/吾等所选择的账户而规定的条款和条件。 且本人/吾等有义务接受银行政策所作的任何更改， 而无须另行通知。</span></p>
                <p>I/We hereby certify that the above information given is true and complete to the best of my/our knowledge. I/We confirm that I/We have read, understood and
                  agree with the terms and conditions made available to me/us by Joint Development Bank for the account chosen by me/us. I/We am/are also bound to accept any
                  changes made by the bank's policies without any further notice whatsover. </p>
              </div><br />
              <div class="">
                <div class="seal">
                  <img src="${
                    data.img_sign
                  }" alt="Signature" style="width: auto !important; height: 2rem !important; margin-left: 2rem">
                  <br />
                  <input type="text" name="" />
                  <h4><span class="utf-8-font">账户持有者签名/盖章</span><span><br/> Account Holder's
                    Signature(s)/Seal</span> </h4>
                </div>
                <div class="seal">
                  <input type="text" name="" />
                  <h4><span class="utf-8-font">职员/<br/>Staff</span></h4>
                </div>
                <div class="seal">
                  <input type="text" name="" />
                  <h4><span class="utf-8-font">获授权者/<br/>Authorized Person</span></h4>
                </div>
              </div>
              </td>
                </tr>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    </body>
    </html>
`;
          const browser = await puppeteer.launch({
              headless: true,
              args: ["--no-sandbox"],
          });
          const page = await browser.newPage();
          // We set the page content as the generated html by handlebars
          await page.setContent(html2);

          //generating random id for filename;
          let randomId =
              new Date().getTime().toString(36) + Math.random().toString(36).slice(2);
          // We use pdf function to generate the pdf in the same folder as this file.
          let file = await page.pdf({
              path: `./userfile_${randomId}.pdf`,
              format: "A4",
          });
          await browser.close();
          console.log("filecreated");
          var fileName = `./userfile_${randomId}.pdf`; // The default name the browser will use
          console.log(`download`);
          res.download(fileName, function(err) {
              fs.unlinkSync(fileName);
              // the operation is done here
          });
      })
      .catch((err) => {
          console.log(err, "error");
          if (err) {
              res.send(err);
          }
          next;
      });
}

async function downloadCard2(req, res, next) {
  // console.log(req.params)
  adminService
      .downloadCard(req.params)
      .then(async(data) => {
              console.log(data);
              let namebox = (
                  data.title +
                  " " +
                  data.first_name +
                  " " +
                  data.last_name +
                  " "
              ).split("");

              for (let index = namebox.length; index < 23; index++) {
                  namebox.push("");
              }
              console.log(namebox);
              /*  const buffer = await Buffer.from(data.passport_file_signature, "base64"); */
              /*    Jimp.read(buffer, async (err, resq) => {
                          if (err) return new Error(err);
                          return await resq
                            .quality(5)
                            .write(path.join(__dirname + `/public/${data.email}1.jpg`));
                        }); */
              let html1 = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">
    <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>JDB Card Application Form</title>
    <style>
    html {
      -webkit-print-color-adjust: exact;
      margin:15px;
    }
    @font-face {
        font-family: 'Firefly Sung';
        font-style: normal;
        font-weight: 400;
        src: url('{{asset("public/fonts/fireflysung.ttf")}}') format('truetype');
    }
    .utf-8-font, h3 .utf-8-font, h3 {
        font-family: Firefly Sung, DejaVu Sans, sans-serif;
    }
    span.utf-8-font {
        display: inline-block;
        line-height: 12px;
        margin-top: 3px;
    }
    * {
        margin: 0;
        padding: 0;
        max-width: 100%;
    }
    body, label, p {
      font-size: 12px;
      line-height: 16px;
        
        
    }
    .bound {
      margin: 5px auto;
  max-width: 810px;
  width: 810px;
  padding: 15px;
  clear: both;
    }
    .wh730.bound { 
    width: 730px;
    }
    .big-f p, .big-f, .big-f input[type="text"]{font-size:12px; line-height:18px;}
    .big-f.sm p, .big-f.sm, .big-f.sm input[type="text"]{font-size:12px; line-height:15px;}
    .jdb_logo {
        max-width: 120px;
    }
    h2, .h2 {
        text-align: center;
        margin-left: 15px;
        line-height: 22px;
        padding:15px;
        font-size: 18px;
    }
    h3, .h3 {
        background: #edebe0 !important;
        border: 1px solid #000;
        padding: 2px 15px;
        margin: 10px 0 5px;
        line-height: 15px;
        font-size: 12px;
        width: 31.2em;
        
    }
    ul li {
        list-style: none;
    }
    table {
        width: 100%;
        border-collapse: collapse;
    }
    .dots{
        border-bottom: 1px dotted #000;
    }
    
    input[type="text"] {
        border: none;
        border-bottom: 1px dotted #000;
        max-width: 100%;
        width: 87px;
        font-size: 10px;
        display: inline-block;
        margin-top: 3px;
        line-height:normal;
    }
    input[type="text"]:focus {
        outline: none;
        border: none;
        border-bottom: 1px dotted #00C;
    }
    input[type="checkbox"] {
        top: 2px;
        position: relative;
        margin-right: 2px;
        vertical-align: top;
    }
    td {
        vertical-align: top;
        overflow: hidden;
    }
    .col50 {
        width: 50%;
        vertical-align: top;
    }
    label {
        position: relative;
        top: 1px;
    }
    .red-tx {
        color: #f00;
    }
    .box-border td {
        border: 1px solid #000;
    }
    .data-col {
        display: inline-block;
        margin-top: 2px;
        margin-right: 5px;
        width:80px;
    }
    .data-col input.d-date, .data-col input.d-month {
        width: 15px; 
        display: inline-block;
    }
    .data-col input.d-year {
        width: 30px; 
        display: inline-block;
    }
    .of_lis strong {
        position: relative;
        float: left;
        margin: 0 4px;
    }
    .of_lis li {
        padding-left: 7px;
        position: relative;
    }
    .of_lis li:before {
        position: absolute;
        left: 0;
        top: 5px;
        content: "";
        background: #000;
        height: 6px;
        width: 6px;
    }
    .pd td {
        padding: 5px;
    }
    .width100 {
        width: 100px !important;
    }
    .width_100 {
        width: 100% !important;
    }
    .of_lis p {
        padding-top: 3px;
        left: 5px;
        position: relative;
    }
    p {
        padding-top: 1px;
        clear: both;
    }
    ol {
        padding-left: 15px;
    }
     @page {
    margin: 0px !important;
    }
    html {
        margin: 0px !important;
    }
    body {
        margin: 10px !important;
    }
    .break {
        page-break-before: always;
    }
    .typy-of-cards li label {
        font-size: 9px;
    }
    .inline {
        display: inline-block;
    }
    </style>
    </head>
    <body>
    <div class="bound">
      <table cellpadding="0" cellspacing="10" style="border-collapse:inherit; vertical-align:top; width:100%">
        <tbody>
        
          <tr>
            <td class="col50"><table cellpadding="10" cellspacing="0">
                <tr>
                  <td><table>
                      <tr>
                        <td><img style="width:90px;" src="https://i.imgur.com/ayn0R9C.png" alt="JDB Card Application Form" class="jdb_logo"/></td>
                        <td><div class="h2"><strong>Application of<br />
                            International Card Member<br />
                            </strong> <span class="utf-8-font">国际卡会员申请表</span> </div></td>
                      </tr>
                    </table></td>
                </tr>
                <tr>
                  <td><table>
                      <tr>
                        <td><input type="checkbox" name=""/>
                          <label>Head Office/<span class="utf-8-font">总部</span>;</label>
                          <input type="checkbox" name=""/>
                          <label>Service Unit/<span class="utf-8-font">服务单位</span></label>
                          <input type="text" name="" /><br>
                          <label>Code/<span class="utf-8-font">编码</span></label>
                          <input type="text" name="" /></td>
                      </tr>
                    </table></td>
                </tr>
                <tr>
                  <td><div class="h3" style="background: #edebe0;
                  border: 1px solid #000;"><b>1. Type of cards/:</b> <span class="utf-8-font">银行卡类别</span></div>
                    <table class="typy-of-cards">
                      <tr>
                        <td class="col50"><strong>VISA:</strong>
                          <ul>
                            <li>
                              <input type="checkbox" name="" {{((($data['card_type'] ??  '') == 'visa_debit') || ($data['card_count'] ?? 0) == 2)? 'checked' : ''}} checked />
                              <label>VISA DEDIT/ VISA<span class="utf-8-font">借记卡</span> ${
                                data.card_type || ""
                              }</label>
                            </li>
                            <li>
                              <input type="checkbox" name=""/>
                              <label>VISA CREDIT CLASSIC
                                /VISA<span class="utf-8-font">信用卡普通卡</span></label>
                            </li>
                            <li>
                              <input type="checkbox" name=""/>
                              <label>VISA CREDIT GOLD/ VISA<span class="utf-8-font">信用卡金卡</span></label>
                            </li>
                          </ul></td>
                        <td><strong>UPI:</strong>
                          <ul>
                            <li>
                              <input type="checkbox" name=""   {{((($data['card_type']?? '') == 'upi_debit') || ($data['card_count'] ?? 0) == 2)? 'checked' : ''}}/>
                              <label>UPI DEBIT/ UPI <span class="utf-8-font">借记卡</span></label>
                            </li>
                            <li>
                              <input type="checkbox" name=""/>
                              <label>UPI CREDIT GOLD
                                /UPI <span class="utf-8-font">信用卡金卡</span></label>
                            </li>
                            <li>
                              <input type="checkbox" name=""/>
                              <label>UPI CREDIT PLATINUM
                                /UPI <span class="utf-8-font">信用卡白金卡</span></label>
                            </li>
                          </ul></td>
                      </tr>
                    </table>
                    <p>JDB Champa Super Gold) PLATINUM/ JDB Champa <span class="utf-8-font">超级金卡）白金卡</span></p></td>
                </tr>
                <tr>
                  <td><div class="h3"><strong>2. Information of card user (applicant must be reach of 18 years old</strong>)<br>
                      <span class="utf-8-font">持卡人信息（申请人必须年满18周岁)</span></div>
                    <table>
                      <tr>
                        <td><label>Name and surname/<span class="utf-8-font">姓名</span></label>
                          <input type="text" class="utf-8-font" style="width: 62%" value="${data.first_name} ${
      data.last_name
    }" /></td>
                      </tr>
                    </table></td>
                </tr>
                <tr>
                  <td><table>
                      <tr>
                        <td><label>Occupation/<span class="utf-8-font">职位</span></label>
                          <input type="text" class="utf-8-font" value=""/></td>
                        <td><label>, Nationality/<span class="utf-8-font">国籍</span></label>
                          <input type="text" class="utf-8-font" value="${
                            data.nationality
                          }" /></td>
                      </tr>
                    </table></td>
                </tr>
                <tr>
                  <td><table class="red-tx">
                      <tr>
                        <td><input type="checkbox" name=""  {{($data['is_employee']?? '' ==  '1')? 'checked':''}}/>
                          <label>Employee/<span class="utf-8-font">雇员</span></label></td>
                        <td><input type="checkbox" name=""  {{($data['is_public_staff']?? '' ==  '1')? 'checked':''}}/>
                          <label>Public staff/<span class="utf-8-font">公职人员</span></label></td>
                      </tr>
                      <tr>
                        <td><input type="checkbox" name=""  {{($data['is_student']?? '' == '1')? 'checked':''}}/>
                          <label>Student/<span class="utf-8-font">学生</span></label></td>
                        <td><input type="checkbox" name="" {{($is_general_customer?? '' == '1')? 'checked' : ''}}/>
                          <label>General Customer/<span class="utf-8-font">普通客户</span></label></td>
                      </tr>
                    </table></td>
                </tr>
                <tr>
                  <td><p>Name and surname in capital letter (maximum 22 scripts) <br>
                      <span class="utf-8-font">请用大写字母写下您的姓名(最多22个字符)</span></p>
                    <table class="box-border">
                      <tr> 
                     
                     
                      ${namebox
                        .map((d, i) => {
                          return `<td style="padding:0 1px; text-align:center; min-width:10px;">
                            <span class="utf-8-font">${d}</span>
                          </td>`;
                        })
                        .join("")} 
                 
                   
                       </tr>
                    </table></td>
                </tr>
                <tr>
                  <td><table>
                      <tr>
                        <td><label>Date of birth/<span class="utf-8-font">出生日期</span></label>
                          <div class="data-col">
                          <input type="text" name="" value=" ${data.dob ? getFormatted(data.dob,"/") : ''}" />
                          </div>
                          <label>, ID card/Passport/Family registration </label></td>
                      </tr>
                    </table></td>
                </tr>
                <tr>
                  <td><table>
                      <tr>
                        <td><label>Book/<span class="utf-8-font">身份证/护照/户口簿</span></label>
                          <input type="text" name="" value=" ${
                            data["passport_id"]
                          }" />
                          <label>Date/<span class="utf-8-font">日期</span></label>
                          <div class="data-col">
                          <input type="text" name="" style="width: ${
                            data.id_issued_date ? getFormatted(data.id_issued_date,"/".length + 80) : 50
                          }%" value=" ${data.id_issued_date ? getFormatted(data.id_issued_date,
                            "/"
                          ) : ''}" />
                          </div>,
                          </td>
                      </tr>
                    </table></td>
                </tr>
                <tr>
                  <td><table>
                      <tr>
                        <td>
                        <label>issued by/<span class="utf-8-font">签发机关</span></label>
                          <input type="text" class="utf-8-font" style="width: ${
                            data.place_of_id_issued ? (data.place_of_id_issued.length + 30) : 12
                          }%" value="${data.place_of_id_issued}" />
                        <label>Expiration date/<span class="utf-8-font">有效期限</span></label>
                          <div class="data-col">
                          <input type="text" name="" style="width: ${getFormatted(
                            data.passport_expiry_date,
                            "/"
                          ).length + 80}%" value="${data.passport_expiry_date ? getFormatted(
                            data.passport_expiry_date,
                            "/"
                          ) : ''}" />
                          </div>
                          <label>Place of Birth/<span class="utf-8-font">出生地</span></label>
                          <input type="text" class="utf-8-font" name="" value="" />
                          <label>, District/<span class="utf-8-font">区</span></label>
                          <input type="text" class="utf-8-font" name="" value="" />
                          <span class="utf-8-font" style="display:none;"></span>,
                          <label> Province/<span class="utf-8-font">省份</span></label>
                          <input type="text" style="width: ${data.address1 &&  data.city ? data.address1.length + data.city.length + 15 : 130}%" class="utf-8-font" name="" value="${
                            data.address1},${data.city}" /> 
                          <input type="text" style="width: ${
                            400 + 2
                          }%" class="utf-8-font" name="" value="${data.state}, ${data.countryName} ${data.pincode}" /></td>

                      </tr>
                    </table></td>
                </tr>
                <tr>
                  <td><table class="">
                      <tr>
                        <td>
                          </td> 
                      </tr>
                    </table></td>
                </tr>
                <tr>
                  <td><div class="h3"><strong>3. Information of work place/</strong><span class="utf-8-font">工作单位信息</span></div>
                    <table>
                      <tr>
                        <td><label>Work place/<span class="utf-8-font">工作单位</span></label>
                          <input type="text" name="" />
                          <label>Position/<span class="utf-8-font">职位</span></label>
                          <input type="text" name="" /><br>
                          <label>Year of services/<span class="utf-8-font">工作年限</span></label>
                          <input type="text" name="" />
                          <label>years/<span class="utf-8-font">年</span>, from/<span class="utf-8-font">从:</span></label>
                          <div class="data-col">
                            <input type="text" name="" class="d-date" />
                            /
                            <input type="text" name="" class="d-month" />
                            /
                            <input type="text" name="" class="d-year"/>
                          </div>
                          <label>to/<span class="utf-8-font">至</span></label>
                          <div class="data-col">
                            <input type="text" name="" class="d-date" />
                            /
                            <input type="text" name="" class="d-month" />
                            /
                            <input type="text" name="" class="d-year" />
                          </div>
                          <label>Total income per month/<span class="utf-8-font">每月收入总额</span></label>
                          <input type="text" name=""/>
                          <label>total expenditure per month/<span class="utf-8-font">每月支出总额</span></label>
                          <input type="text" name="" /><br>
                          <label>Home telephone/<span class="utf-8-font">住宅电话</span></label>
                          <input type="text" name="" /><br>
                          <label>, office telephone/<span class="utf-8-font">办公电话</span></label>
                          <input type="text" name="" />
                          <label>Mobile/<span class="utf-8-font">手机号码</span></label>
                          <input type="text" name="" />
                          <label>, E-mail address/<span class="utf-8-font">电子邮箱地址</span></label>
                          <input type="text" name="" /><br>
                          <label>Education level/<span class="utf-8-font">教育程度</span></label>
                          <input type="text" name="" /></td>
                      </tr>
                    </table></td>
                </tr>
                <tr>
                  <td><table>
                      <tr>
                        <td><label>Family status/<span class="utf-8-font">家庭状况:</span></label></td>
                        <td><input type="checkbox" name="" />
                          <label>Single/<span class="utf-8-font">单身</span></label></td>
                        <td><input type="checkbox" name="" />
                          <label>Married/<span class="utf-8-font">已婚</span></label></td>
                      </tr>
                    </table></td>
                </tr>
                <tr>
                  <td><table>
                      <tr>
                        <td class="ws_none of_lis"><ul>
                            <li> <strong>Ownership form/</strong><span class="utf-8-font">所有权形式:</span>
                              <input type="checkbox" name="" />
                              <label>Private owned house/<span class="utf-8-font">私有住房</span></label>
                              <br />
                              <input type="checkbox" name="" />
                              <label>Parent’s house/<span class="utf-8-font">父母的住房</span></label>
                              <input type="checkbox" name="" />
                              <label>Lease/<span class="utf-8-font">租赁住房</span></label>
                              <br />
                              <input type="checkbox" name="" />
                              <label>Relative’s house/<span class="utf-8-font">亲戚的住房</span></label>
                              <input type="checkbox" name="" />
                              <label>Officer’s house/<span class="utf-8-font">公司住房</span></label>
                              <br />
                              <input type="checkbox" name="" />
                              <label>Down payment house/<span class="utf-8-font">首付房</span></label>
                            </li>
                            <li> <strong>Owned assets/</strong><span class="utf-8-font">拥有资产:</span>
                              <input type="checkbox" name="" />
                              <label>Land/<span class="utf-8-font">土地</span></label>
                              <input type="text" name="" style="width:25px;" />
                              <br />
                              <label>Plot(s)/<span class="utf-8-font">块,</span></label>
                              <input type="checkbox" name="" />
                              <label>Car/<span class="utf-8-font">轿车</span></label>
                              <input type="text" name="" style="width:30px;" />
                              <label>Total of value/<span class="utf-8-font">总价值为</span></label>
                              <input type="text" name="" />
                            </li>
                            <li> <strong>Instalment payment per month/</strong><span class="utf-8-font">每月分期付款:</span>
                              <input type="text" name="" />
                              <br />
                              <label>, debt balance/<span class="utf-8-font">结欠金额</span></label>
                              <input type="text" name="" />
                              <br />
                              <label>Installment period/<span class="utf-8-font">分期付款期</span></label>
                              <input type="text" name="" />
                              <label>Month(s)/<span class="utf-8-font"> 个月</span></label>
                            </li>
                            <li><strong>Amount of money requested/</strong><span class="utf-8-font">申请金额</span>:
                              <input type="text" name="" />
                              <label>US$</label>
                              <br />
                              <label>(</label>
                              <input type="text" name="" />
                              <label>)</label>
                              <br />
                            </li>
                          </ul></td>
                      </tr>
                    </table></td>
                </tr>
                <tr>
                  <td><div class="h3"><strong>4. Reference/</strong> <span class="utf-8-font">參考</span></div>
                    <table>
                      <tr>
                        <td><label>Name and surname/<span class="utf-8-font">姓名</span></label>
                          <input type="text" name="" />
                          <label>, age/<span class="utf-8-font">年龄</span></label>
                          <input type="text" name="" />
                          <label>year/<span class="utf-8-font">工作年限</span></label>
                          <label>Occupation</label>
                          <input type="text" name="" />
                          <label>, Work place/<span class="utf-8-font">工作单位</span></label>
                          <input type="text" name="" />
                          <label>Residing address/<span class="utf-8-font">居住地址</span></label>
                          <input type="text" name="" />
                          <label>, District/<span class="utf-8-font">区</span></label>
                          <input type="text" name="" />
                          <label>, Province/<span class="utf-8-font">省份</span></label>
                          <input type="text" name="" /><br>
                          <label>Total Income/ Month/<span class="utf-8-font">每月收入总额</span></label>
                          <input type="text" name="" /><br>
                          <label>, Total Expenditure/ Month/<span class="utf-8-font">每月支
                            出总额</span></label>
                          <input type="text" name="" /><br>
                          <label>Related to/<span class="utf-8-font">关系</span></label>
                          <input type="text" name="" />
                          <label>, Telephone number/<span class="utf-8-font">联系电话</span></label>
                          <input type="text" name="" /></td>
                      </tr>
                    </table></td>
                </tr>
              </table></td>
            <td class="col50"><table cellpadding="0" cellspacing="0">
                <tr>
                  <td><table class="box-border pd ws_none" style="margin-top:10px;">
                      <tr>
                        <td colspan="4" style="padding:0;"><div class="h3" style="margin:0; border:none;"><strong>5. Selection of Information for using card/</strong><span class="utf-8-font">关于银行卡使用方面的信息选项</span></div></td>
                      </tr>
                      <tr>
                        <td>1</td>
                        <td><label>Maximum per transaction/<span class="utf-8-font">每笔交易的最高限额</span></label></td>
                        <td><input type="checkbox" name="" />
                          <label>Less than $5,000/<span class="utf-8-font">低于</span>$5,000</label></td>
                        <td><input type="checkbox" name="" checked="" />
                          <label>More than $ 5,000/<span class="utf-8-font">高于</span> $5,000</label></td>
                      </tr>
                      <tr>
                        <td>2</td>
                        <td><label>Number of transaction per day/<span class="utf-8-font">每日交易笔数</span></label></td>
                        <td><input type="checkbox" name="" />
                          <label>Not more than 10 times per day/<span class="utf-8-font">每天不多于10笔</span></label></td>
                        <td><input type="checkbox" name="" checked="" />
                          <label>More than 10 times per day/<span class="utf-8-font">每天多于10笔</span></label></td>
                      </tr>
                      <tr>
                        <td>3</td>
                        <td><label>Transaction via internet/<span class="utf-8-font">互联网交易</span></label></td>
                        <td><input type="checkbox" name="" checked="" />
                          <label> Use via website required/<span class="utf-8-font">需要开通网银</span></label></td>
                        <td><input type="checkbox" name="" />
                          <label>Use via website not required/<span class="utf-8-font">不需开通网银</span></label></td>
                      </tr>
                    </table></td>
                </tr>
                <tr>
                  <td><div class="h3"><strong>6. Security Form/</strong><span class="utf-8-font">担保形式</span></div>
                    <table>
                      <tr>
                        <td><label>Name and surname/<span class="utf-8-font">姓名</span></label>
                          <input type="text" name=""  />
                          <label>, age/<span class="utf-8-font">年龄</span></label>
                          <input type="text" name="" />
                          <label>year/<span class="utf-8-font">工作年限</span></label>
                          <label>Occupation</label>
                          <input type="text" name=""  />
                          <label>, Work place/<span class="utf-8-font">工作单位</span></label>
                          <input type="text" name=""  />
                          <label>Residing address/<span class="utf-8-font">居住地址</span></label>
                          <input type="text" name=""  />
                          <label>, District/<span class="utf-8-font">区</span></label>
                          <input type="text" name=""  />
                          <label>, Province/<span class="utf-8-font">省份</span></label>
                          <input type="text" name=""  /><br>
                          <label>Total Income/ Month/<span class="utf-8-font">每月收入总额</span></label>
                          <input type="text" name="" /><br>
                          <label>, Total Expenditure/ Month/<span class="utf-8-font">每月支
                            出总额</span></label>
                          <input type="text" name=""  /><br>
                          <label>Related to/<span class="utf-8-font">关系</span></label>
                          <input type="text" name=""  />
                          <label>, Telephone number/<span class="utf-8-font">联系电话</span></label>
                          <input type="text" name=""  />
                          <br />
                          <input type="checkbox" name="" />
                          <label>Security saving account/<span class="utf-8-font">担保储蓄账户:</span></label>
                          <input type="text" name=""  />
                          <label>type of account/<span class="utf-8-font">账户
                            类型</span></label>
                          <input type="text" name=""  />
                          <label>Loan security account (must get
                            prior authorized loan
                            document)/ <span class="utf-8-font">贷款担保账户（须事先获得经授权
                            的贷款文件）</span></label><br>
                          <label>Account number/<span class="utf-8-font">账号</span></label>
                          <input type="text" name=""  />
                          <label>, name of 
                            account/<span class="utf-8-font">账户名称</span></label>
                          <input type="text" name=""  />
                          <br />
                          <label>Block amount/<span class="utf-8-font">冻结金额:</span></label>
                          <input type="text" name=""  />
                          <label>US$</label>
                          <br />
                          (
                          <input type="text" name=""  />
                          )<br />
                          <label>Value of security asset (must be 120% of proposed credit line)/ <span class="utf-8-font">担保资产价值 （必须为拟议信贷额度的120%）</span></label>
                          <br />
                          <label>Land title number/<span class="utf-8-font">土地所有权证号</span></label>
                          <input type="text" name=""  />
                          <label>, date/<span class="utf-8-font">日期</span></label>
                          <div class="data-col">
                            <input type="text" name="" class="d-date" />
                            /
                            <input type="text" name="" class="d-month" />
                            /
                            <input type="text" name="" class="d-year"/>
                          </div>
                          <label>,area/<span class="utf-8-font">面积</span></label>
                          <input type="text" name=""  />
                          <label>m<sup>2</sup>/<span class="utf-8-font">平方米</span></label>
                          <label>Located at village/<span class="utf-8-font">位于：村</span></label>
                          <input type="text" name=""  />
                          <label>, district/<span class="utf-8-font">区</span></label>
                          <input type="text" name=""  /><br>
                          <label>, province/<span class="utf-8-font">省份</span></label>
                          <input type="text" name=""  />
                          <br />
                          <label>Issued under the name of/<span class="utf-8-font">所签发的所有权证归于</span></label>
                          <input type="text" name=""  />
                          <label><span class="utf-8-font">名下，</span> value/<span class="utf-8-font">价值为</span></label>
                          <input type="text" name=""  />
                          <label>Total (LVR)/ <span class="utf-8-font">贷款与估值比率 (LVR)为</span></label>
                          <input type="text" name=""  />
                          <label>%</label></td>
                      </tr>
                    </table></td>
                </tr>
                <tr>
                  <td><div class="h3"><strong>7. Form of payment for credit card transaction/</strong><span class="utf-8-font">信用卡交易的还款方式</span></div>
                    <table>
                      <tr>
                        <td><input type="checkbox" name=""  />
                          <label>Cash/<span class="utf-8-font">现金;</span></label>
                          <input type="checkbox" name=""  />
                          <label>Check/<span class="utf-8-font">支票;</span></label>
                          <input type="checkbox" name=""  />
                          <label>Transfer/<span class="utf-8-font">转账;</span></label>
                          <input type="checkbox" name=""  />
                          <label>Automatically debt deducted from saving account/<span class="utf-8-font">从储蓄账户中自动扣除欠款</span></label>
                          <br />
                          <label>Account number/<span class="utf-8-font">账号</span></label>
                          <input type="text" name=""  />
                          <label>name of account/<span class="utf-8-font">账户名称</span></label>
                          <input type="text" name=""  /></td>
                      </tr>
                    </table></td>
                </tr>
                <tr>
                  <td><div class="h3"><strong>8. Condition of deduction for payment by international credit card/</strong><span class="utf-8-font">国际信用卡支付扣款条件</span></div>
                    <table>
                      <tr>
                        <td><ul class="of_lis">
                            <li>
                              <p>Minimum amount 10% of balance according to the credit statement
                                must not less than US$100 per month. </p>
                            </li>
                            <li>
                              <p><span class="utf-8-font">根据信用卡结单， 每月余额的10%最低不得少于100美元。</span></p>
                            </li>
                            <li>
                              <p>Deduct of full amount according to the credit statement.</p>
                            </li>
                            <li>
                              <p><span class="utf-8-font">根据信用卡结单扣除全额。</span></p>
                            </li>
                          </ul></td>
                      </tr>
                    </table></td>
                </tr>
                <tr>
                  <td><div class="h3"><strong>9. Consent of international cardholder/</strong><span class="utf-8-font">国际持卡人同意函</span></div>
                    <table>
                      <tr>
                        <td><ol>
                            <li>
                              <p>I agree and consent to the Bank to block saving account in order to ensure of debt payment for the use of my visa credit card.</p>
                              <p><span class="utf-8-font">本人赞成并同意银行冻结储蓄帐户， 以确保本人使用 VISA 信用卡所欠下的款项得以清偿。</span></p>
                            </li>
                          </ol></td>
                      </tr>
                    </table></td>
                </tr>
              </table></td>
          </tr>
        </tbody>
      </table>
    </div>
   
    <div style="margin-top:150px;" class="bound">
      <table cellpadding="0" cellspacing="10" style="border-collapse:inherit; vertical-align:top; width:100%">
        <tbody>
          <tr>
            <td class="col50"><table cellpadding="0" cellspacing="0">
                <tr>
                  <td><table cellpadding="0" cellspacing="0">
                      <tr>
                        <td><ol start="2">
                            <li>
                              <p>I consent to the Bank to deduct from security saving account in case there is any debt occurred from using my credit card including interest rate and fees determined by the Bank and will not oppose, resist or claim any  rightto the Bank.</p>
                              <p><span class="utf-8-font">若本人因使用信用卡而欠下款项， 本人同意银行从担保储蓄账户中扣除款项， 包括银行厘定息率及费用， 本人不会反对、抗拒或向银行申索任何权利。</span></p>
                            </li>
                          </ol>
                          <p>I, as an applicant for visa credit certify that, all statements contained in this application is true. If there is any damages occurred form using of card to the Bank, I agree to take responsibilities to compensate all damages and agree to accomplish according to the rule of Visa Control Center and the law of Lao PDR.</p>
                          <p><span class="utf-8-font"> 本人作为VISA信用卡申请人， 谨此证明本申请表所载的所有陈述均属实。 若因使用信用卡而给银行造成任何损害， 本人同意承担所有损害赔偿责任， 并同意按照 VISA 控制中心的规定以及老挝人民民主共和国的法律予以完成。 </span></p>
                          <br />
                          <p><strong>Joint Development Bank Limited/</strong><span class="utf-8-font">联合发展银行有限公司,</span></p>
                          <label><strong>date/</strong><span class="utf-8-font">日期</span></label>
                          <div class="data-col">
                            <input type="text" class="d-date" style="width:200px;" name="" value="${data.createdAt ? getFormatted(
                              data.createdAt,
                              "/"
                            ) : ''}" />
                          
                         </div>
                          <br />
                          <p style="text-align:left"><strong>Applicant/</strong><span class="utf-8-font">申请人</span></p>
                          <br />
                          <label>Signature/<span class="utf-8-font">签名:</span></label>
                          <img src="${
                            data.img_sign
                          }" alt="Signature" style="width: auto !important; height: 50px !important;></td>
                          <input type="text" name="" />
                          <label>,Name/<span class="utf-8-font">姓名</span> :</label>
                          <span type="text" class="utf-8-font" style=" width: ${(data.first_name && data.last_name )? data.first_name.length + data.last_name.length + 2 : 200}%" value="" >${
                            data.first_name
                          } ${data.last_name}</span></td>
                      </tr>
                    </table></td>
                </tr>
                <tr>
                  <td><div class="h3" style="text-align:center;"><strong style="display:inline-block;">For Bank Use/</strong><span class="utf-8-font" style="display:inline-block;">银行专用</span></div>
                    <table class="box-border pd">
                      <tr>
                        <td><p style="text-align:center;"><strong>Officer/<span class="utf-8-font">职员</span></strong></p>
                          <p>
                            <label>Comment/<span class="utf-8-font">评注:</span></label>
                            <input type="text" name="" />
                          </p>
                          <label>Date/<span class="utf-8-font">日期</span></label>
                          <div class="data-col">
                            <input type="text" name="" class="d-date" />
                            /
                            <input type="text" name="" class="d-month" />
                            /
                            <input type="text" name="" class="d-year" />
                          </div>
                          <br />
                          <br />
                          <br />
                          <p>
                            <label>Signature</label>
                            <input type="text" name="" style="width:40px" />
                            <label>,Name</label>
                            <input type="text" name="" style="width:40px" />
                            <br />
                            <br />
                          </p></td>
                        <td><p style="text-align:center;"><strong>Receive-check officer/ <span class="utf-8-font">收账核算职员</span></strong></p>
                          <p>
                            <label>Comment/<span class="utf-8-font">评注:</span></label>
                            <input type="text" name="" />
                          </p>
                          <label>Date/<span class="utf-8-font">日期</span></label>
                          <div class="data-col">
                            <input type="text" name="" class="d-date" />
                            /
                            <input type="text" name="" class="d-month" />
                            /
                            <input type="text" name="" class="d-year" />
                          </div>
                          <br />
                          <br />
                          <br />
                          <p>
                            <label>Signature</label>
                            <input type="text" name="" style="width:40px" />
                            <label>,Name</label>
                            <input type="text" name="" style="width:40px" />
                            <br />
                            <br />
                          </p></td>
                      </tr>
                      <tr>
                        <td><p style="text-align:center;"><strong>Credit Department/<span class="utf-8-font">信贷部门</span></strong></p>
                          <p>
                            <label>Comment/<span class="utf-8-font">评注</span>:</label>
                            <input type="text" name="" />
                          </p>
                          <label>Date/<span class="utf-8-font">日期</span></label>
                          <div class="data-col">
                            <input type="text" name="" class="d-date" />
                            /
                            <input type="text" name="" class="d-month" />
                            /
                            <input type="text" name="" class="d-year" />
                          </div>
                          <br />
                          <br />
                          <br />
                          <p>
                            <label>Signature</label>
                            <input type="text" name="" style="width:40px" />
                            <label>,Name</label>
                            <input type="text" name="" style="width:40px" />
                            <br />
                            <br />
                          </p></td>
                        <td><p style="text-align:center;"><strong>Risk Management Department/<span class="utf-8-font">风险管理部门</span> </strong></p>
                          <p>
                            <label>Comment/<span class="utf-8-font">评注:</span></label>
                            <input type="text" name="" />
                          </p>
                          <label>Date/<span class="utf-8-font">日期</span></label>
                          <div class="data-col">
                            <input type="text" name="" class="d-date" />
                            /
                            <input type="text" name="" class="d-month" />
                            /
                            <input type="text" name="" class="d-year" />
                          </div>
                          <br />
                          <br />
                          <br />
                          <p>
                            <label>Signature</label>
                            <input type="text" name="" style="width:40px"/>
                            <label>,Name</label>
                            <input type="text" name="" style="width:40px" />
                            <br />
                            <br />
                          </p></td>
                      </tr>
                      <tr>
                        <td><p style="text-align:center;"><strong>Card Center Department/ <span class="utf-8-font">银行卡中心部门</span></strong></p>
                          <p>
                            <label>Comment/<span class="utf-8-font">评注:</span></label>
                            <input type="text" name="" />
                          </p>
                          <label>Date/<span class="utf-8-font">日期</span></label>
                          <div class="data-col">
                            <input type="text" name="" class="d-date"/>
                            /
                            <input type="text" name="" class="d-month"/>
                            /
                            <input type="text" name="" class="d-year"/>
                          </div>
                          <br />
                          <br />
                          <br />
                          <p>
                            <label>Signature</label>
                            <input type="text" name="" style="width:40px" />
                            <label>,Name</label>
                            <input type="text" name="" style="width:40px" />
                            <br />
                            <br />
                          </p></td>
                        <td><p style="text-align:center;"><strong>Managing Director of JDB/ JDB<span class="utf-8-font">总经 理</span></strong></p>
                          <p>
                            <label>Comment/<span class="utf-8-font">评注:</span></label>
                            <input type="text" name="" />
                          </p>
                          <label>Date/<span class="utf-8-font">日期</span></label>
                          <div class="data-col">
                            <input type="text" name="" class="d-date"/>
                            /
                            <input type="text" name="" class="d-month" />
                            /
                            <input type="text" name="" class="d-year"/>
                          </div>
                          <br />
                          <br />
                          <br />
                          <p>
                            <label>Signature</label>
                            <input type="text" name="" style="width:40px" />
                            <label>,Name</label>
                            <input type="text" name="" style="width:40px" />
                            <br />
                            <br />
                          </p></td>
                      </tr>
                    </table></td>
                </tr>
                <tr>
                  <td><table class="">
                      <tr>
                        <td><p>Documents required/ <span class="utf-8-font">所需文件</span></p>
                          <p>&nbsp;&nbsp;&bull; ID card/<span class="utf-8-font">身份证</span></p>
                          <p>&nbsp;&nbsp;&bull; Passport/<span class="utf-8-font">护照</span></p>
                          <p>&nbsp;&nbsp;&bull; 2 photos of size 3x4/2 <span class="utf-8-font">张尺寸为3x4的照片</span></p>
                          <p>&nbsp;&nbsp;&bull; guaranty deed (if foreigner) /<span class="utf-8-font">担保契据（若为外国人）</span></p></td>
                      </tr>
                    </table></td>
                </tr>
              </table></td>
            <td class="col50" style="position:relative;"><span style="font-size: 18px;
        transform: rotate(-90deg);
        white-space: nowrap;
        display: inline-block;
        opacity:0.7;
        margin-right:-100px; position:absolute; left:0; top:400px;
       ">THIS SPACE IS INTENTIONALLY LEFT BLANK / <span class="utf-8-font">该空间有意留为空白</span></span></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="break">&nbsp;</div>
    <div class="bound sm big-f wh730">
      <table cellpadding="0" cellspacing="10" style="border-collapse:inherit; vertical-align:top; width:100%">
        <tbody>
          <tr>
            <td><table cellpadding="0" cellspacing="0">
                <tr>
                  <td><img src="https://i.imgur.com/ayn0R9C.png" alt="JDB Card Application Form" class="jdb_logo"/></td>
                  <td style="text-align:right; font-size:13px;"><p>
                      <label class="inline"><strong class="inline">No/</strong><span class="utf-8-font">编号</span></label>
                      <input type="text" name="" />
                      <label><strong>J/ DB</strong></label>
                    </p>
                    <br />
                    <label class="inline"><strong class="inline">Joint Development Bank/</strong><span class="utf-8-font">联合发展银行, dated/日期</span></label>
                    <div class="data-col">
                      <input type="text" name="" class="d-date" />
                      /
                      <input type="text" name="" class="d-month" />
                      /
                      <input type="text" name="" class="d-year" />
                    </div></td>
                </tr>
              </table>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td><div class="h2">International Card Use Agreement<br />
                      <span class="utf-8-font width_100">国际卡使用协议</span> </div>
                    <br />
                    <p style="text-align:center;"><strong>International Card Use Agreement “Agreement” was made at Joint Development Bank Limited by and between<br />
                      </strong> <span class="utf-8-font width_100">国际卡使用协议“本协议”在联合发展银行有限公司达成， 缔约双方分别为</span> </p>
                    <br />
                    <p><strong>Joint Development Bank Limited,</strong> having its Head Office at 82,Lane Xang Avenue, Hatsady Village, Chanthaboury District, Vientiane Capital, P.O. Box3187, Telephone:021213531-6 Fax(856-21)213530 here after call <strong>“Bank”</strong><br />
                      <span class="utf-8-font width_100">联合发展银行有限公司， 总部设于首都万象 Chanthaboury 区 Hatsady 村 Lane Xang 大道82号， 邮政信箱为 3187号， 电话：021213531-6 传真(856-21)213
                      530 以下称 <strong> “本行”</strong></span> </p>
                    <br />
                    <p style="text-align:center;"><strong>And<br />
                      </strong> <span class="utf-8-font width_100">和</span> </p>
                    <br /></td>
                </tr>
                <tr>
                  <td style="line-height:18px;"><label>Mr/Mrs/<span class="utf-8-font">先生/女士</span></label>
                    <input type="text" style="width: ${(data.first_name && data.last_name ) ? data.first_name.length + data.last_name.length + 2 : 200}%" class="utf-8-font" value="${
                      data.first_name
                    } ${data.last_name}" />
                    <label>date of birth/<span class="utf-8-font">出生日期</span></label>
                    <div class="data-col">
                      <input type="text" class="d-date" style="width:100px;" name="" value=" ${data.dob ? getFormatted(
                        data.dob,"/"
                      ) : ''}" />
                    </div>
                    <label>, ID card/Passport number/<span class="utf-8-font">身份证/护照号码</span></label>
                    <input type="text" class="utf-8-font" name="" style="width: ${
                      data.passport_id ? data.passport_id.length +2 : 30 
                    }%" value="${data["passport_id"]}"  />
                    <label>Date/<span class="utf-8-font">日期</span></label>
                    <div class="data-col">
                    
                    <input type="text" class="d-date utf-8-font" style="width:100px;" name="" value=" ${data.id_issued_date ? getFormatted(
                      data.id_issued_date,"/"
                    ) : ''}" />
                    </div>
                    <label>date of expiry/<span class="utf-8-font">有效期至</span></label>
                    <div class="data-col">
                       <input type="text" class="d-date utf-8-font" style="width:100px;" name="" value=" ${data.passport_expiry_date ? getFormatted(
                         data.passport_expiry_date,"/"
                       ) : ''}" />
                    </div>
                    <label>,issued by/<span class="utf-8-font">签发机关</span></label>
                    
                    <input type="text" class="utf-8-font" value="${
                      data.place_of_id_issued
                    }" style="width: ${data.place_of_id_issued ? data.place_of_id_issued.length + 25 : 40}%"  />
                    <br/>
                    <p>Residing address/<span class="utf-8-font">居住地址</span>
                    <input type="text" class="utf-8-font" style="width: 78%" value="${data.address1}, ${data.city}, ${data.state}"/>
                    <br/>
                    <input type="text" class="utf-8-font" style="width: 97%" value=", ${data.countryName} ${data.pincode}"/><p>
                    <br/>
                    <label>telephone/<span class="utf-8-font">联系电话</span></label>
                    <input type="text" name=""  style="width: ${16}%" value="(+${data.countryCode}) ${data.contactNumber}" />
                    <label>Fax/<span class="utf-8-font">传真</span></label>
                    <input type="text" name="" />
                    <label>email/<span class="utf-8-font">电子邮箱</span>
                    </label>
                    <input type="text" name="" style="width: ${35}%" value="${
                      data.email
                    }" />
                    <br/>
                    <label>address/<span class="utf-8-font">电子邮箱</span>
                    </label>
                    <input type="text" name="" style="width: 50px" value="" />
                    <label>Hereafter call <strong>“Cardholder”</strong>/ <span class="utf-8-font">以下称 “持卡人”</span></label>
                    <label>province/<span class="utf-8-font">省份</span></label>
                    <input type="text" class="utf-8-font" value=""/></td>
                </tr>
                <tr>
                  <td><p style="text-align:center;"><br />
    <br />
    Both parties be referred to collectively as the "Parties" or individually as a "Party".<br />
                      Both parties have unanimously agreed inter into International Card Use Agreement under the terms and conditions below:<br />
                      <span class="utf-8-font">双方统称为“缔约双方”，或单独称为“缔约方”。 缔约双方已根据下列条款对“国际卡使用协议”达成一致意见。</span> </p>
                    <br />
                    <p><strong>Article 1 Definition<br />
                      </strong> <span class="utf-8-font">条款1：定义</span> </p>
                    <ol>
                      <li> Bank: (abstract JDB) means Joint Development Bank Limited;<br />
                        <span class="utf-8-font">本行：（缩写JDB） 即联合发展银行有限公司；</span> </li>
                      <li> Card owner means main card holder and additional card issued by the Bank under this Agreement;<br />
                        <span class="utf-8-font">持卡人是指本行根据本协议而发行的主卡与附属卡的持有者； </span></li>
                      <li> ATM meansAutomatically Transaction Machine for cash withdraw and check the balance;<br />
                        <span class="utf-8-font"> ATM是指用于取款与查询账户余额的自动交易机器；</span> </li>
                      <li> EDC(card transaction machine) means Electronic DataCapture Machine for electronic transaction service;<br />
                        <span class="utf-8-font">EDC（银行卡交易机器）是指用于电子交易服务的电子数据采集器；</span> </li>
                      <li> International Card means electronic card for cash payment such as: Visa Debit,Visa Credit,UPI Debit,UPI Credit andother type of card issued by the Bank;<br />
                        <span class="utf-8-font"> 国际卡是指用于现付的电子卡，如：VISA 借记卡、VISA 信用卡、UPI 借记卡、UPI 信用卡以及本行发行的其他类型的银行卡；</span> </li>
                      <li> Debt Statementmeans invoice to card holder for repayment to the Bank in accordance with terms and conditions of this Agreement.<br />
                        <span class="utf-8-font"> 欠款结单是指本行根据本协议的条款和条件向持卡人开具的还款单。</span> </li>
                      <li> Main card is a card issued by the Bank to the cardholder, cardholder hereafter call “Main card owner”;<br />
                        <span class="utf-8-font">主卡是由本行向持卡人发行的银行卡， 主卡持有者人下称“主卡持卡人”；</span> </li>
                      <li> Additional card is a card issued by the Bank to other person requested by main card owner, additional cardholder hereafter call
                        “Additional card owner”. The main card is able to request for issuing additional card at a maximum one card only. In the event of
                        security by a company,the additional cardcannot be issued (the Bank is not authorized to issue additional card).<br />
                        <span class="utf-8-font">附属卡是本行应主卡持卡人要求向其他人发行的银行卡， 附属卡持有者以下称“附属卡持卡人”。主卡最多只能请求银行发行一张附属卡。 在由公司担保的情况下，不能发行附属卡 （本行无权发行附属卡）。</span> </li>
                    </ol>
                    <br />
                    <p><strong>Article 2 Objective<br />
                      </strong> <span class="utf-8-font">条款2：目的</span> </p>
                    <ol>
                      <li> Cardholder desires to use the card from the Bank in order to use for payment according to the type of card as provided for in the registration form as attached here to and it is a part of this Agreement and customer agrees to perform in accordance with this Agreement, regulation, law and rule of International Visa Center;<br />
                        <span class="utf-8-font"> 持卡人欲根据所附注册表中规定的银行卡类型， 使用本行所发行的银行卡进行付款，并且，作为本协议的一部分， 客户同意按照本协议、法规、法律以及国际 VISA中心的规定予以履行；</span> </li>
                      <li> The Bank agrees to issue card to the cardholder under the terms and conditions ofthisAgreement.<br />
                        <span class="utf-8-font"> 本行同意根据本协议中的条款和条件向持卡人发行银行卡。 </span></li>
                    </ol>
                    <br />
                   </td>
                </tr>
              </table></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="break">&nbsp;</div>
    <div class="bound big-f wh730">
      <table cellpadding="0" cellspacing="10" style="border-collapse:inherit; vertical-align:top; width:100%">
        <tbody>
          <tr>
            <td>
             <p><strong>Article 3 Main and Additional Card<br />
                      </strong> <span class="utf-8-font">条款3：主卡和附属卡</span> </p>
                    <ol>
                      <li> Additional card is a card issued by the Bank to other person requested by main card owner, additional cardholder hereafter call “Additional card owner”. The main card is able to request for issuing additional card at a maximum one card only. In the event of security by a company,the additional cardcannot be issued (the Bank is not authorized to issue additional card);<br />
                        <span class="utf-8-font">附属卡是本行应主卡持卡人要求向其他人发行的银行卡， 附属卡持有者以下称“附属卡持卡人”。主卡最多只能请求银行发行一张附属卡。
                        在由公司担保的情况下， 不能发行附属卡（本行无权发行附属卡）；</span> </li>
                      <li> Main card owner and additional card shall use the account and credit line, such both transaction will appear at the same debt
                        statement andwillbeonlydelivered to the main cardowner;<br />
                        <span class="utf-8-font"> 主卡持卡人和附属卡应使用账户和信用额度， 这样两者交易均将出现在相同的欠款结单中，并且只呈交予主卡持卡人；</span> </li>
                      <li> Main card owner agrees and takes responsible for all transaction appear in the debt statement of the Bank and such debt is the card owner’s debt to be repaid to the Bank whatever the transaction have been accrued from main or additional card;<br />
                        <span class="utf-8-font"> 主卡持卡人同意并对本行的欠款结单中呈现的所有交易承担责任， 并且此类欠款是此卡持卡人的欠款，无论该交易是主卡应计额还是附属卡应计额，主卡持卡人均应向本行予以偿付；</span> </li>             
                <li> In the even to ftermination additional card is required,the main card owner shall request to the Bank for terminationin writing;<br />
                  <span class="utf-8-font"> 若需终止附属卡， 主卡持卡人应以书面形式向本行请求终止； </span></li>
                <li> If the main card owner desires to terminate his/her card the additional card will be terminated together;<br />
                  <span class="utf-8-font">若主卡持卡人希望终止其主卡， 则附属卡将一并予以终止； </span></li>
                <li> Using card by main card owner and additional card owner shallbe strictly performed under the terms and conditions ofthisAgreement and the rule of International Visa Center.<br />
                  <span class="utf-8-font">主卡持卡人和附属卡持卡人在使用银行卡时应严格遵守本协议的条款和条件以及国际 VISA中心的规定。 </span></li>
              </ol>
              <br />
              <p><strong>Article 4 Interest rate, Fees and Card Use<br />
                </strong> <span class="utf-8-font"> 条款4：利率、费用以及银行卡的使用</span> </p>
              <ol>
                <li> Goods and services payment: atthe due date, if the card owner pays all outstanding debts at the end of month the Bank will not
                  calculate the interest occurred on transaction;<br />
                  <span class="utf-8-font">商品和服务付款：在缴款日期前，若持卡人在月底支付所有未偿欠款，本行将不计算交易产生的利息； </span> </li>
                <li>If the card owner has not been paid as described on the debt statement or settle only apar to fdebt balanc eat the end of month,the
                  Bank will calculate all interests due and continue calculating such interest until the card owner has paid all out standing debts;<br />
                  <span class="utf-8-font">若持卡人未按欠款结单所述支付欠款或月底仅结算部分欠款， 本行将计算所有到期利息，并继续计算此利息，直至持卡人偿还所有未偿
                  欠款； </span> </li>
                <li>Up on the card owner received debt statement notice for credit card, debit card shall come to get the debt statement with the Bank, the card owner shall take responsibility for all transactions;<br />
                  <span class="utf-8-font"> 在持卡人收到信用卡欠款结单通知后，借记卡持卡人应到本行领取欠款结单，持卡人应对一切交易负责； </span> </li>
                <li>Cardholder agrees to pay the fee for delay of payment and other fees to the Bank according to the terms at each periods. If the cardholder is unable to pay atthe due period as described in the debt statement,the cardholder agrees to pay fee to the Bank for cashwithdrawnby cardinaccordancewiththe regulationoftheBank issuingfromtime totime. <span class="utf-8-font">持卡人同意按每期条款向本行支付滞纳费及其他费用 。若持卡人未能在欠款结单所述的到期期限内付款，持卡人同意按本行不时发行的规定，向本行支付信用卡取现的费用。 </span></li>
              </ol>
              <br />
              <p><strong>Article 5 Payment and Debt Payment<br />
                </strong> <span class="utf-8-font">条款5：支付与还款</span> </p>
              <ol>
                </li>
                <li>Debt payment shall include: annualfee, interest and delay fee, cash withdraw fee, cash transaction, goods and services payment occurreddaily those transferred totheBank system;<br />
                  <span class="utf-8-font">还款项应包括：年费、利息和滞纳费、 取现费用、现金交易、每日产生的商品和服务支付款项，将这些转账到本行系统； </span> </li>
                <li>Any transaction use correctly pin code (pin)and the transaction has contained signature of card owner carrying of cash withdrawal or goodsandservicespayment;<br />
                  <span class="utf-8-font">任何交易均须正确使用PIN码(PIN)， 且在提取现金或支付商品与服务交易项中附上持卡人签名； </span> </li>
                </ol></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="break">&nbsp;</div>
    <div class="bound big-f wh730">
      <table cellpadding="0" cellspacing="10" style="border-collapse:inherit; vertical-align:top; width:100%; word-wrap: break-word;">
        <tbody>
          <tr>
            <td>
            <ol start="3">
            <li>If the card owner uses the card for order goods or advance payment for service, butthe use and cancel has not been made or the order cannot be cancelled,the goods owner or service provider has the right to call for such goods and service from the card owner
                  based on the price agreed plus other related fee (if any);<br />
                  <span class="utf-8-font"> 如果持卡人使用银行卡订购商品或预付服务费用， 但尚未使用和取消或订单不能取消，货物所有者或服务提供者有权根据商定的价格以 及其他相关费用(如有)要求持卡人对此类商品和服务进行支付； </span> </li>
                <li>The Bank will send debt statement notice to the card owner on 26th of every month, the card owner shall check and pay according to thestatement, the card owner has obli gate andduty to pay debtoccurredfromusingof cardandwhenitisdueof everymonth the
                  card owner shall have adequate money in the accountfor the debt payment according to the terms and rule;<br />
                  <span class="utf-8-font"> 本行将于每月26日向持卡人发送欠款结单通知，持卡人应根据结单进行核对及付款。持卡人有义务和责任偿还因使用信用卡而产生的欠款。根据条款和规则，每月到期时， 持卡人的账户中应存蓄足够的资金以用于偿还欠款； </span></li>
                <li>Up on receiving debt statement notice (for credit card; if it is debit card the card owner shall check or monitor by her/himself) if any unsatisfied appear on the debt statement notice,the card owner shall meet with the Bank and make a writing note within 07 days. If the cardownerhasnot settled the issue during such period,the bank will not take any responsibility related to the debt statement notice.<br />
                  <span class="utf-8-font"> 在收到欠款结单通知书时（就信用卡而言；若是借记卡， 则由借记卡持卡人亲自核对或检查），若欠款结单通知书上有任何欠妥之处， 持卡人须与本行会面，并在7天内以书面形式向本行提出。若持卡人未在此期间解决问题， 银行将不承担与欠款结单通知书有关的任何责任。 </span> </li>
              </ol>
              <br />
              <p><strong>Article 6 Rights and Duties of Card Owner<br />
                </strong> <span class="utf-8-font"> 条款6：持卡人的权利和义务</span> </p>
              <ol>
                <li>The card ownerhas the righttopay incashforgoods, services payment andany transactionat anyplaces that EDCavailableor by
                  ATM for cash withdrawn, butit must be atthe terms and conditions made with the Bank.<br />
                  <span class="utf-8-font"> 持卡人有权在任何适用EDC的地方支付商品、 服务款项及任何交易， 或在ATM取款，但必须符合与本行订立的条款和条件。 </span> </li>
                <li>Thecardownerhas therighttoselectthemethodofpaymenttotheBank incashor requesttheBanktodeductautomatically from
                  saving account opening with the Bank for debt payment monthly.<br />
                  <span class="utf-8-font"> 持卡人有权选择以现金方式向本行支付欠款， 或要求本行每月自动从持卡人在本行开立的储蓄账户中予以扣除。 </span> </li>
                <li>The card owner shall obtain card by her/himself or assign in writing to other person and such assignment shall be deemed the card owner obtained card by her/himself.<br />
                  <span class="utf-8-font">持卡人应亲自取卡或以书面形式委派他人取卡， 此类委派应视为由持卡人本人亲自取卡。 </span> </li>
                <li>Up on receivingthe cardowner shall immediately put his/her ownsignatureon the reverse side of card.<br />
                  <span class="utf-8-font"> 取得银行卡后，持卡人应立即在银行卡背面签上自己的签名。 </span> </li>
                <li>Whenuse thecardfor cashwithdraw, servicespaymentby EDC,the cardowner shall sign onthe receiptthe same signature on the
                  reverse side of card, exempt the transaction via telephone, internet or any transaction no required signature of cardowner.<br />
                  <span class="utf-8-font"> 当使用此卡通过EDC提取现金、 支付服务时，持卡人应在收据上签署与银行卡背面签名一致的签名，通过电话、互联网进行的交易或任何不需要银行卡持有者签名的交易则免于签名。 </span></li>
                <li>Thecardownerhasthe right to maintain card and keep insafe of PIN and 3digit numbers (CVV2)written inthe reverse sideof card
                  and shall strictly not provide to the other person direct or indirect way. Card owner acknowledged that there is a risk for using of card stolen information by the other person and the card owner agrees to accept the responsible for all completed transaction whether action by card owner or other person; the card owner shall use card properly in accordance with the rule of Bank, International Card Center and not violation of the law of Lao PDR.<br />
                  <span class="utf-8-font"> 持卡人有权维持银行卡并确保PIN码和银行卡背面的3位校验码（CVV2）的安全，严禁直接或间接向其他人提供。持卡人承认使用银行卡被他人盗取信息的风险， 持卡人同意对所有已完成的交易承担责任， 无论已完成的交易是持卡人的行为还是其他人的行为；持卡人应按照本行及国际卡中心的规定正确使用银行卡， 且不得违反老挝人民民主共和国法律。 </span></li>
                <li>Transfer,assign code number of card to other person is strict lyprohibited.<br />
                  <span class="utf-8-font"> 严禁将银行卡编码转交、转让予他人。 </span></li>
              </ol>
           </td>
           </tr>
           </tbody>
           </table>
           </div>
    <div class="break">&nbsp;</div>
    <div class="bound big-f wh730">
      <table cellpadding="0" cellspacing="10" style="border-collapse:inherit; vertical-align:top; width:100%">
        <tbody>
          <tr>
            <td>
            <p><strong>Article 7 Rights and Duties of Bank<br />
                </strong> <span class="utf-8-font"> 条款7：银行的权利和义务</span></p>
              <ol>
                <li>Rights and Duties of Bank<br />
                  <span class="utf-8-font"> 银行的权利和义务</span> - Request card owner to pay debt according to the transactions occurred by using of card, interests, fees each month not later than due dateprovidedfor inthedebt statementnotice.In caseof cardowner isunable todebtin accordance tothe ruleof Bank,the
                  Bank shall have the right to deduct from account or collateral of card owner without authorization and the card owner has no any
                  righttoclaimagainsttheBank.<br />
                  <span class="utf-8-font"> - 要求持卡人每月根据使用银行卡所产生的交易支付欠款、 利息、 费用， 不得迟于欠款结单通知书中规定的到期日 。如持卡人无法按照本行规定偿还欠款，  本行有权擅自从持卡人的账户或抵押担保中予以扣除， 持卡人无权向本行提出索赔。</span><br />
                  - In case the bank has seen a necessary to reserve its right and benefit or of cardholder, the Bank has the right to change in
                  conditions to use the card, limit, terminate using of card without prior notice to the card owner.<br />
                  <span class="utf-8-font"> - 若银行认为有必要保留其对持卡人的权利和利益， 本行有权在不事先通知持卡人的情况下更改银行卡的使用条件、限制、终止银行卡
                  的使用。</span><br />
                  - Implementation of regulation for issuance of card, international credit card payment in order to ensure the right and benefit of card owner according to the contract and maintain confident information of card owner.<br />
                  <span class="utf-8-font">- 实施有关银行卡发行、国际信用卡支付的规定， 以确保持卡人根据合同享有权利和利益，并维护持卡人的机密信息。</span><br />
                  - Resolves request of customers or request in writing from card owner in relation to the use of card, neither lost or be stolen (within 5 days in Vientiane Capital and 7 days in other provinces)<br />
                  <span class="utf-8-font"> - 解决客户请求或持卡人提交的关于银行卡使用方面 （银行卡丢失或被盗）的书面要求（首都万象5天内，其他省份则7天内) </span> </li>
                <li>Responsibility will be exempted in case of information transmission management system and by any reasons beyond the control of the Bank.<br />
                  <span class="utf-8-font"> 由于信息传输管理系统及本行无法控制的任何原因所导致的情况下， 本行可免于承担责任。</span><br />
                  - Be exempted for responsible of all cases impactto honour, reputation,trust of the card owner regarding returning card or requesting to return card. The Bank will not take responsible for delivery of goods, goods quality or services paying by the card, but the Bank has the right to deduct money from card owner’s account according to the cost of transaction, although such goods and services whatever neither receive or service using.<br />
                  <span class="utf-8-font"> - 对于退卡或请求退卡对持卡人的荣誉、 声誉、 信任造成的所有影响， 本行均免于承担责任。 本行对以银行卡支付的商品交付、 商品质量或服务交付概不承担责任， 但本行有权根据交易成本从持卡人的帐户中扣除款项， 无论持卡人是否收到商品或是否已使用服务。 </span> </li>
              </ol>
              <br />
              <p><strong>Article 8 Change of card, Issuing new card and cancellation of card<br />
                </strong> <span class="utf-8-font"> 条款8：更换银行卡、发行新卡以及销卡</span> </p>
              <ol>
                <li>Loss of cardor request to change new card,the card owner shall propose to the Bank in order to issuenew card, butthe fee will be
                  paid by the card owner in accordance with the rule of Bank issues from time to time;<br />
                  <span class="utf-8-font"> 若银行卡遗失或需更换新卡， 持卡人应向本行提出请求以申请发行新卡， 但费用将由持卡人按照本行不时颁布的规定予以支付；。 </span></li>
                <li>Before expiration date, the bank will give notice by calling or email to the card owner in order to certify the need for continue using or not using of card within 10 days, in case of contacting card owner is unsuccessful or no response from the card owner. In case of card still valid, but the card owner wish to stop using such card he/she shall inform in writing to the Bank and return the existing card to the Bank;<br />
                  <span class="utf-8-font"> 在有效期届满前， 银行会在10天内通过致电或发送电子邮件通知持卡人， 以确认其需继续使用该卡或不再使用该卡。若银行卡仍然有效，但持卡人希望停止使用此卡时， 他/她应以书面形式通知本行， 并将现有银行卡退回本行； </span></li>
                <li>When termination of card according to the request of card owner, all outstanding debt balance occurred up to the date of stop using and all transaction occurred from card shall become debt until due date of payment and the card owner shall reply in full amount and shall be deemed thatthe card use contract has been terminated;<br />
                  <span class="utf-8-font"> 当根据持卡人的要求终止银行卡时， 截至停止使用之日所产生的所有未偿欠款以及此卡所产生的所有交易均将成为欠款， 直至付款截止期限， 持卡人应予以全额偿还，  且银行卡使用合同将被视为已终止； </span></li>
                <li>The Bank has the rightto block (lock),terminate of using card as below:<br />
                  <span class="utf-8-font"> 若出现下列情况， 本行有权对银行卡进行冻结（锁定） 、终止使用：</span><br />
                  - After 90days fromt hedue date of debt payment, but the card owner has not paid or paid any part of debt those less than amount described for indebt statement notice issued by the bank.<br />
                  <span class="utf-8-font"> - 自欠款偿还到期日起90天后， 持卡人仍未支付欠款或所支付的任何部分少于本行发出的欠款结单通知中所述的金额。</span><br />
                  - The card owner has paid more than creditline approved by the Bank according to the terms and conditions ofAgreement. <span class="utf-8-font"> - 持卡人的消费已超出本行根据协议条款和条件批准的信贷额度。</span><br />
                  - The card owner violates the ruleof usingcard or breaks the law impacts to the use of card and related to infringement and risk
                  management.<br />
                  <span class="utf-8-font">- 持卡人违反银行卡使用规则或违法而对银行卡的使用造成影响， 涉及侵权和风险管理。</span><br />
                  - The Bank whatever reason has the right to get the card back by way of sending written notice to the card owner regarding returning card to the Bank.<br />
                  <span class="utf-8-font"> - 无论出于何种原因，本行有权以书面形式通知持卡人将银行卡归还银行， 以此方式收回该卡。 </span> </li>
              </ol>
              </td>
              </tr>
              </tbody>
              </table>
              </div>
              <div class="break">&nbsp;</div>
    <div class="bound big-f wh730">
      <table cellpadding="0" cellspacing="10" style="border-collapse:inherit; vertical-align:top; width:100%;  word-wrap: break-word;">
        <tbody>
          <tr>
            <td>
              <p><strong>Article 9 In case of loss, be stolen, card number and PIN has known by the other person shall perform as follows<br />
                </strong> <span class="utf-8-font"> 条款9：在银行卡遗失、被盗、卡号及PIN码被他人获知的情况下， 应按照下列规定执行：</span> </p>
              <ol style="list-style:none">
                <li>The card owner shall inform the card center, any branch or service units of the JDB where located nearly or call hotline at 1499 in order to block the card, and then written notice shall be sent to the Bank with the information such as: name of card owner, bank account, place of loss,dateof cardexpiration,IDcard/passport andcontactnumber.Incaseoffoundthecardshallbe returningtotheBank inorder to destroy. Ifthere is any transaction occurred before the Bank has received notification the card owner shalltake responsible for such transaction occurred.<br />
                  <span class="utf-8-font"> 持卡人应前往距离最近的JDB银行卡中心、 分行或服务单位予以告知，或致电1499热线进行冻结，然后以书面形式通知本行，并附上持卡人 姓名、银行账户、遗失地点、银行卡到期日期、 身份证/护照和联系电话等信息。若捡到银行卡，应将其退还给本行，以便进行销毁。若在本行收到通知前发生任何交易， 持卡人应对所发生的此类交易承担责任。 </span> </li>
              </ol>
              <br />
              <p><strong>Article 10 Amendment<br />
                </strong> <span class="utf-8-font"> 条款10：修订</span> </p>
              <ol>
                <li>The Bank shall immediately notify to the card owner due to the amendmen to farticle,terms and condition of this Agreement;<br />
                  <span class="utf-8-font"> 若对本协议的条款、细则与条件进行修订， 本行应立即通知持卡人。 </span></li>
                <li>Iftheamendment cannotbeagreedby thecardowner,thecardowner isentitledtocanceltheuseof card.Ifthecardownerdesires to continue usingof card after theAgreement has been amended;this can be considered excepting the amendment by the card owner.<br />
                  <span class="utf-8-font">若有关修订未能获得持卡人同意， 则该卡持卡人有权取消使用该卡。若持卡人希望在协议修订后继续使用该卡，则可视为持卡人接受所作修订。 </span></li>
              </ol>
              <br />
              <p><strong>Article 11 Applicable Law and Dispute Resolution<br />
                </strong> <span class="utf-8-font"> 条款11：适用法律和争端解决方式</span> </p>
              <ol>
                <li>This Agreement shall be governed by the laws of Lao PDR and regulations in relation to the issuing of card, using, debit and
                  international credit card payment.;<br />
                  <span class="utf-8-font"> 本协定受老挝人民民主共和国法律以及与银行卡发行、 使用、借记及国际信用卡支付有关的条例的管辖。 </span> </li>
                <li>If anydisputeshallarise,theParties shall cooperatetoreachanamicableresolution.Ifthis failsor,thePartieshavebeenunableto resolve the dispute, either Party may submit the dispute to the court under the justice procedures of Lao PDR for resolution of such dispute.<br />
                  <span class="utf-8-font"> 若发生任何争端，缔约双方应进行合作以达成友好解决方案。 若未能达成友好解决方案或缔约双方无法解决争端， 任何缔约方均可根据老挝人民民主共和国的司法程序将争端提交法院予以解决。 </span> </li>
              </ol>
              <br />
              <p><strong>Article 12 Effective<br />
                </strong> <span class="utf-8-font"> 条款12：生效</span></p>
              <ol style="list-style:none;">
                <li> This Lease Agreement is made in two (2) original copies, having the same content, the Parties have reviewed, read, understood and
                  accepted all details and confirmed the correctness, and the Parties hereby execute and agree to the terms and conditions of this
                  Agreement.ThisAgreementiseffectivefromthedateofsignatureonward.<br />
                  <span class="utf-8-font"> 本协议正本一式两（2） 份，内容相同，缔约双方已审阅、阅读、理解且接受所有细节并已确认其正确性，缔约双方兹执行并同意本协议的条款和条件。本协议自签署之日起生效。 </span> </li>
              </ol>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td><strong> Card Owner <br />
                    <span class="utf-8-font"> 持卡人 </span></strong><br />  
                    <br />
                    <img src="${
                      data.img_sign
                    }" alt="Signature" style="width: auto !important; height: 2rem !important;></td>
                    <span type="text" class="utf-8-font" style="width: 100%;">
                    ${data.first_name} ${data.last_name}</span></td>
                    
                  <td><strong style="float: right;">Joint Development Bank<br />
                    <span class="utf-8-font"> 联合发展银行</span></strong><br />
                    <br />
                    <input style="float: right;" type="text" name="" /></td>
                </tr>
              </table>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td><p><strong>Witness:<br />
                      <span class="utf-8-font"> 见证人：</span></strong> </p>
                    <p>
                      <label>1.&nbsp;&nbsp;</label>
                      <input type="text" name="" />
                    </p>
                    <br />
                    <p>
                      <label>2.&nbsp;&nbsp;</label>
                      <input type="text" name="" />
                    </p>
                    <br />
                    <p>
                      <label>3.&nbsp;&nbsp;</label>
                      <input type="text" name="" />
                    </p></td>
                </tr>
              </table></td>
          </tr>
        </tbody>
      </table>
    </div>
    </body>
    </html>`;
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"],
    });
    const page = await browser.newPage();
    // We set the page content as the generated html by handlebars
    await page.setContent(html1);
    let randomId =
      new Date().getTime().toString(36) + Math.random().toString(36).slice(2);
    let file = await page.pdf({
      path: `./userfile_${randomId}.pdf`,
      format: "A4",
    });
    await browser.close();
    console.log("file created");
    var fileName = `./userfile_${randomId}.pdf`;
    console.log(`download`);
    res.download(fileName, function (err) {
      fs.unlinkSync(fileName);
    });
  })
  .catch((err) => {
    console.log(err, "error");
    if (err) {
      res.send(err);
    }
    next;
  });
}

function authenticateSchema(req, res, next) {
  const schema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}

function authenticate(req, res, next) {
  adminService
    .authenticate(req.body)
    .then((user) => {
      res.status(user.status).json(user);
    })
    .catch((err) => {
      console.log(err);
      res.status(err.status).send(err);
      next;
    });
}

function registerSchema(req, res, next) {
  const schema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().min(6).required(),
  });
  validateRequest(req, next, schema);
}

function registerSchemaForCard(req, res, next) {
  const schema = Joi.object({
    password: Joi.string().required(),
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
    cardLimit: Joi.string().required(),
    card_type: Joi.string().required(),
    passport_file_signature: Joi.string().required(),
    passport_file_signature_biopic: Joi.string(),
    residence_city: Joi.string().required(),
    residence_countryName: Joi.string().required(),
    residence_pincode: Joi.string().required(),
    residence_state: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}

function createAdmin(req, res, next) {
  adminService
    .create(req.body)
    .then((user) => {
      if (!user) {
        res.json({
          message: "Registration successful",
          status: 200,
        });
      } else {
        res.status(user.status).json(user);
      }
    })
    .catch((err) => {
      if (err.status !== undefined) {
        res.status(err.status).send(err);
      } else {
        res.send(err);
      }
      next;
    });
}

function createUserByAdmin(req, res, next) {
  adminService
    .createUserByAdmin(req.body)
    .then((user) => {
      if (!user.status) {
        res.json({
          message: "User Added successful",
          status: 200,
        });
      } else {
        res.status(user.status).json(user);
      }
    })
    .catch((err) => {
      if (err.status !== undefined) {
        res.status(400).send(err);
      } else {
        res.send(err);
      }
      next;
    });
}

function createPartner(req, res, next) {
  adminService
    .createPartner(req.body)
    .then((user) => {
      if (!user.statusCode) {
        res.json({
          message: "Partner created successful",
          status: 200,
        });
      } else {
        res.status(user.statusCode).json(user);
      }
    })
    .catch((err) => {
      if (err.status !== undefined) {
        res.status(err.status).send(err);
      } else {
        res.send(err);
      }
      next;
    });
}

function updatePartner(req, res, next) {
  adminService
    .updatePartner(req.body, req.params.id)
    .then((user) => {
      res.status(user.status).send(user);
    })
    .catch((err) => {
      res.status(err.status).send(err);
      next;
    });
}

function getAllAdmins(req, res, next) {
  adminService
    .getAllAdmins()
    .then((user) => {
      if (user) {
        res.status(200).json(user);
      }
    })
    .catch((err) => {
      if (err.status !== undefined) {
        res.status(err.status).send(err);
      } else {
        res.send(err);
      }
      next;
    });
}

function getAllParnters(req, res, next) {
  adminService
    .getAllParnters()
    .then((user) => {
      if (user) {
        res.status(200).json(user);
      }
    })
    .catch((err) => {
      if (err.status !== undefined) {
        res.status(err.status).send(err);
      } else {
        res.send(err);
      }
      next;
    });
}

function getPartner(req, res, next) {
  adminService
    .getPartner(req.params.id)
    .then((user) => {
      if (user) {
        res.status(200).json(user);
      }
    })
    .catch((err) => {
      if (err.status !== undefined) {
        res.status(err.status).send(err);
      } else {
        res.send(err);
      }
      next;
    });
}

function getAllUsers(req, res, next) {
  adminService
    .getAllUsers()
    .then(async (user) => {
      if (user) {
        res.status(200).json(user);
      }
    })
    .catch((err) => {
      console.log(err);
      if (err.status !== undefined) {
        res.status(err.status).send(err);
      } else {
        res.send(err);
      }
      next;
    });
}

function getCurrent(req, res, next) {
  res.json(req.user);
}

function getById(req, res, next) {
  adminService
    .getById(req.params.email)
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

function updateSchema(req, res, next) {
  const schema = Joi.object({
    email: Joi.string().empty(""),
    password: Joi.string().min(6).empty(""),
  });
  validateRequest(req, next, schema);
}

function update(req, res, next) {
  adminService
    .update(req.params.email, req.body)
    .then((user) => {
      res.status(user.status).send(user);
    })
    .catch((err) => {
      res.status(err.status).send(err);
      next;
    });
}

function updateStatus(req, res, next) {
  adminService
    .updateStatus(req.params.userAddress, req.body)
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

function _delete(req, res, next) {
  adminService
    .delete(req.params.id)
    .then(() =>
      res.json({
        message: "User deleted successfully",
      })
    )
    .catch((err) => {
      res.send(err);
      next;
    });
}

function deletePartner(req, res, next) {
  adminService
    .deletePartner(req.params.id)
    .then(() =>
      res.json({
        message: "Partner deleted successfully",
      })
    )
    .catch((err) => {
      res.send(err);
      next;
    });
}

function cardapplyAndWhitelist(req, res, next) {
  adminService
    .cardapplyAndWhitelist(req.params.userAddress)
    .then((user) => {
      if (user) {
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

function sendMail(req, res, next) {
  // console.log(req.body)
  adminService
    .sendToMail(req.body)
    .then((user) => {
      if (!user.status) {
        res.send({
          message: `Mail Sent Successfully`,
          status: 200,
        });
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
async function downloadAllPDFs(req, res, next) {
  // console.log(req.params)
  adminService
      .downloadCard(req.params)

  .then(async(data) => {
          let namebox = (
              data.title +
              " " +
              data.first_name +
              " " +
              data.last_name +
              " "
          ).split("");

          for (let index = namebox.length; index < 23; index++) {
              namebox.push("");
          }
          /*   const buffer = await Buffer.from(data.passport_file_signature, "base64"); */
          /* Jimp.read(buffer, async (err, resq) => {
                  if (err) return new Error(err);
                  return await resq
                    .quality(5)
                    .write(path.join(__dirname + `/public/${data.email}.jpg`));
                }); */
          // res.sendFile(`/Users/satya/frlnc.com/gitlab/nodesqlbackend/API/admin/resized.jpg`)
          let html2 = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
          <html xmlns="http://www.w3.org/1999/xhtml">
          <head>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
          <title>JDB Card Application Form</title>
          <style>
          html {
            -webkit-print-color-adjust: exact;
          }
         
          @font-face {
            font-family: 'Firefly Sung';
            font-style: normal;
            font-weight: 400;
            src: url('{{asset("public/fonts/fireflysung.ttf")}}') format('truetype');
          }
          .utf-8-font, h3 .utf-8-font, h3 {
            font-family: Firefly Sung, DejaVu Sans, sans-serif;
          }
          span.utf-8-font {
            display: inline-block;
            line-height: 9px;
            margin-top: 3px;
           }
          * {
            margin: 0;
            padding: 0;
            max-width: 100%;
          }
          body, label, p {
            font-size: 9px;
            line-height: 11px;
          }
          .bound {
            margin: 3px auto;
            max-width: 650px;
            width: 650px;
            padding: 0px;
            clear: both;
          }
          .jdb_logo {
            max-width: 80px;
          }
          h2 {
            text-align: center;
            margin-left: 15px;
            line-height: 19px;
            font-size: 14px;
            display: inline-block;
            font-weight:normal;
          }
          h3 {
            background: #ccc;
            border: 1px solid #000;
            padding: 2px 5px;
            margin: 10px 0 5px;
            font-size: 11px;
          }
          h4{font-weight:normal;}
          ul li {
            list-style: none;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          input[type="text"] {
            border: none;
            border-bottom: 1px dotted #000;
            max-width: 100%;
            width: 90px;
            font-size: 10px;
            display: inline-block;
            margin-top: 3px;
            line-height: normal;
          }
          input[type="text"]:focus {
            outline: none;
            border: none;
            border-bottom: 1px dotted #00C;
          }
          input[type="checkbox"] {
            top:0px;
            position: relative;
            margin-right: 2px;
            vertical-align: top;
          }
          td {
            vertical-align: top;
            overflow: hidden;
          }
          .col50 {
            width: 50%;
          }
          label {
            position: relative;
            top: 1px;
          }
          .red-tx {
            color: #f00;
          }
          
          .box-border td {
            border: 1px solid #000;
          }
          .data-col {
            display: inline-block;
            margin-top: 2px;
            margin-right: 5px;
            width: 80px;
        border-bottom: 1px dotted #000;
          }
        .verti-align {vertical-align: bottom;}
          .data-col input.d-date, .data-col input.d-month {
            width: 15px;
            display: inline-block;
          }
          .data-col input.d-year {
            width: 30px;
            display: inline-block;
          }
          .ws_none, .ws_none td {
            white-space: normal;
          }
          .of_lis strong {
            font-size: 12px;
            top: 4px;
            position: relative;
            float: left;
            margin: 0 4px;
          }
          .of_lis li {
            padding-left: 7px;
            position: relative;
          }
          .of_lis li:before {
            position: absolute;
            left: 0;
            top: 11px;
            content: "";
            background: #000;
            height: 6px;
            width: 6px;
          }
          .pd td {
            padding: 3px 5px;
          }
          .width100 {
            width: 100px !important;
          }
          td.white-space, .white-space td {
            white-space: nowrap;
          }
          .of_lis p {
            padding-top: 6px;
            left: 5px;
            position: relative;
          }
          p {
            padding-top: 3px;
          }
          ol {
            padding-left: 15px;
          }
          .tx-center {
            text-align: center;
          }
          .table-sec ul {
            margin: 4px 0px 0px 0px;
          }
          .table-sec ul li {
            list-style: none;
            display: inline-block;
          }
          .table-form input[type="checkbox"] {
            position: absolute;
            opacity: 0;
            cursor: pointer;
            height: 0;
            width: 0;
          }
          .checkmark {
            height: 17px;
            width: 15px;
            border: 2px solid#000 !important;
            position: absolute;
            left: 0;
            top: 0;
          }
          .checkmark:after {
            content: "";
            position: absolute;
            display: none;
          }
          .table-form .checkmark:after {
            left: 9px;
            top: 5px;
            width: 5px;
            height: 10px;
            border: solid black;
            border-width: 0 3px 3px 0;
            transform: rotate(45deg);
          }
          .table-form {
            display: inline-block;
            position: relative;
            padding-left: 13px;
            /*margin-bottom:2px;*/
            cursor: pointer;
            width: 99px;
            vertical-align: top;
            min-height:20px;
          }
          .table-sec p {
            padding: 0px;
            margin: 2px 0px;
            border-bottom: 1px solid #000;
            line-height: 10px;
          }
          .table-sec p:last-child {
            border: none;
          }
          .v-middle td {
            vertical-align: middle;
          }
          .v-top {
            vertical-align: top !important;
          }
          .bottom-sec p {
            line-height: 10px;
            font-size:8px;
            border: none;
          }
          .footer {
          
          }
          .seal input[type="text"] {
            border: none;
            border-bottom: 1px dotted #000;
            max-width: 100%;
            width: 210px;
          }
          .seal {
            width: 33%;
            display:inline-block;
            }
          .seal h4 {
            font-size: 10px;
          }
          label.box-lab {
            display: inline-block;
            border: 1px solid #000;
            padding:1px 5px;
            font-size:9px;
            line-height:10px;
          }
          .bor-none, .bor-none td {
            border: none;
          }
          .inline {
            display: inline-block;
          }
          .w100 {
            width: 100% !important;
            float: left;
          }
          .tx-center .utf-8-font {
            width: 100%;
            text-align: center;
          }
          .mg2{padding-left: 15px;}
          </style>
          </head>
          <body>
          <div class="bound">
            <table cellpadding="0" cellspacing="0">
              <tbody>
                <tr>
                  <td><table>
                      <tr>
                        <td width="200px"><img src="https://i.imgur.com/ayn0R9C.png" alt="JDB Card Application Form" class="jdb_logo"/></td>
                        <td style="vertical-align:bottom"><br />
                          <h2><span class="utf-8-font">开户申请书</span><br />
          APPLICATION FOR OPENNING ACCOUNT </h2></td>
                      </tr>
                    </table>
                    <table>
                      <tr>
                        <td style="text-align:right;"><label style="float:right;"><span class="utf-8-font">分行</span>/Branch:
                          <input type="text" name="" style="float:right; margin-top:10px;" /></label></td>
                      </tr>
                    </table>
                    <table class="box-border tx-center pd" style="border-bottom: 2px dashed;">
                <tr>
                  <td><span class="utf-8-font">签字式样</span> <strong>(Specimen signature)</strong> <br />
                   
                    <img src="${
                      data["img_sign"]
                    }" style="display:inline-block; height:50px; width:auto; max-width:none;margin-top: 5px;"  /> 
                     </td>
                  <td rowspan="4"><span class="utf-8-font">身份证/其他副本</span> <strong>(Copy ID Card/Other)</strong></td>
                </tr>
                <tr>
                  <td style="text-align:center;"><span class="utf-8-font">帳戶激活條款</span></td>
                </tr>
                <tr>
                  <td style="border-bottom: 3px dashed;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="text-align:left;"><span class="utf-8-font" style="display:inline-block;">账号/Account No:</span></td>
                </tr>
              </table>
                    <table style="margin-top:2px;">
                      <tr>
                        <td><span class="utf-8-font">本人/吾等</span> I/We:</td>
                        <td style="text-align:right;"><label style="display:inline-block; float:right;"><span class="utf-8-font">客户</span>ID Customer ID <input type="text" name="" style="border:1px solid #000 !important;" /></label>
                          </td>
                      </tr>
                    </table>
                    <br />
                    <table>
                      <tr>
                        <td><label><span class="utf-8-font">姓名</span>(1)/Name(1):</label>
          <!--                 <input type="text" class="utf-8-font"  name="" value="{{$data['name'] ?? ''}}" style="width: 240px;" />
           -->                <span class="utf-8-font" style="border-bottom: 1px dotted #000;">${
             data.first_name
           } ${data.last_name}</span>
                          <label><span class="utf-8-font">出生日期</span> /Date of birth:</label>
                          <div class="data-col">
                            ${data.dob ? getFormatted(data.dob,"/") : ''}
                          </div>
                          <label><span class="utf-8-font">身份证/护照号码</span> ID/ Passport No:</label>
                          <input type="text" class="utf-8-font"  name="" value="${
                            data.passport_id
                          }" /></td>
                      </tr>
                      <tr>
                        <td><label><span class="utf-8-font">姓名</span>(2)/Name(2):</label>
                          <input type="text" name="" style="width: 140px;" />
                          <label><span class="utf-8-font">出生日期</span> /Date of birth:</label>
                          <div class="data-col verti-align ">
                       
                          </div>
                          <label><span class="utf-8-font">身份证/护照号码</span> ID/ Passport No:</label>
                          <input type="text" name="" value="" /></td>
                      </tr>
                      <tr>
                        <td><label><span class="utf-8-font">现居地址</span>/Present Address:</label>
                         <!--  <input type="text" class="utf-8-font"  name="" value="{{$data['residing_place']??''}}" style="width:232px" /> -->
                         <span class="utf-8-font">城市</span>
                          <label><span class="utf-8-font" style="width: 100%;border-bottom: 1px dotted #000;">${
                            data.address1
                          }</span>
                          城市/City</label>
                      <span class="utf-8-font" style="width: 40%; margin-top:5px; border-bottom: 1px dotted #000;">${
                        data.city
                      }</span>
                       
                          <label ><span  class="utf-8-font">省份</span>/Province</label>
              
                          <span class="utf-8-font" style="width:40%; border-bottom: 1px dotted #000;">${
                            data.state
                          }</span>
                          </td>
                      </tr>
                      <tr>
                        <td><label><span class="utf-8-font">电话 号码</span>/Tel: </label>
                          <input type="text" value="(+${data.countryCode}) ${
                            data.contactNumber
                          }" style="width:300px;" />
                          <label><span class="utf-8-font">传真</span>/Fax:</label>
                          <input type="text" name="" style="width:240px;" /></td>
                      </tr>
                      <tr>
                        <td><label><span class="utf-8-font">紧急联系人</span>/ Emergency Contact:</label>
                          <input type="text" name="" style="width:200px;" value=${
                            data.emergency_contact_person
                          } />
                          <label><span class="utf-8-font">手机号码</span>/Mobile:</label>
                          <input style="width:250px;" type="text" name="" value="(+${data.emergencycountryCode}) ${
                            data.emergency_contact_telephone_number
                          }"/></td>
                      </tr>
                      <tr>
                        <td><label><span class="utf-8-font">电子邮箱</span>/E-Mail:</label>
                          <!-- <input type="text" class="utf-8-font"  name="" value="{{$data['user']['email'] ?? ''}}" style="width:615px" /></td> -->
                          <span class="utf-8-font" style="width: 85%;border-bottom: 1px dotted #000;">${
                            data.email
                          }</span>
                      </tr>
                      <tr>
                        <td style="margin:2px 0"><span class="utf-8-font">向JDB申请开立账户，特此附上本人/吾等所有必要的详细信息（附件）。</span><br />
                          Apply to open account with JDB and here are all my/our necessary details information (Attachment) </td>
                      </tr>
                    </table>
                    <table class="table-sec v-middle pd box-border" cellpadding="0" cellspacing="0">
                      <tr>
                        <td class="tx-center"><span class="utf-8-font">账户类别</span><br/>
                          Account Type </td>
                        <td colspan="2"><ul>
                            <li><input type="checkbox" class="checkmark" checked=""/>
                              <label class="table-form mg2">
                                <span class="utf-8-font">个人/联名</span><br/>
                                Personal/Joint </label>
                                <input type="checkbox" class="checkmark"/>
                              <label class="table-form mg2">
                                <span class="utf-8-font">公司</span><br/>
                                Company </label>
                                <input type="checkbox" class="checkmark"/>
                              <label class="table-form mg2">
                                <span class="utf-8-font">合伙/独资经营</span><br/>
                                Partnership/Sole Proprietor </label>
                                <input type="checkbox" class="checkmark"/>
                              <label class="table-form mg2">
                                <span class="utf-8-font">使馆</span><br/>
                                Embrassy </label>
                            </li>
                          </ul>
                          <ul>
                            <li>
                              <input type="checkbox" class="checkmark"/> 
                              <label class="table-form mg2">
                                <span class="utf-8-font">国有/合资企业</span> <br/>
                                State Owned/Joint Venture Co; </label>
                                <input type="checkbox" class="checkmark"/>
                              <label class="table-form mg2" >
                                <span class="utf-8-font">协会/非政府组织</span><br/>
                                Associates/NGO </label>
                                <input type="checkbox" class="checkmark"/>
                              <label class="table-form mg2">
                                <span class="utf-8-font">国际组织</span><br/>
                                International Organization </label>
                                <input type="checkbox" class="checkmark"/>
                              <label class="table-form mg2">
                                <span class="utf-8-font">其他</span><br/>
                                Other </label>
                            </li>
                          </ul></td>
                      </tr>
                      <tr>
                        <td class="tx-center"><span class="utf-8-font">业务类型</span><br/>
                          Type of Business </td>
                        <td width="45%" style="text-align:center;"><input type="text" name="" style="width:250px;"/>
                          <br />
                          <br />
                          <input type="text" name="" style="width:250px;" /></td>
                        <td width="45%"><p><span class="utf-8-font">营业执照/投资许可证号</span>:<br/>
                            ERC/IL No: </p>
                          <p><span class="utf-8-font">签发日期</span><br/>
                            Date of Issue: </p>
                          <p><span class="utf-8-font">签发地点</span><br/>
                            Place of Issue </p></td>
                      </tr>
                      <tr>
                        <td class="tx-center" style="padding:1px 5px">
              <span class="utf-8-font">账户类型&开户存款 <br />
                          水泥種類<br/>
                </span> 
                Type of Account & Initial Deposit(Amount)
               </td>
                        <td colspan="2" style="padding:1px 5px"><table class="bor-none">
                            <tr>
                              <td>
                  <span class="utf-8-font"> 活期存款账户</span><br />
                                Current Acct.<br /><br />
                                <label class="box-lab"> <span class="utf-8-font">基普</span><br />LAK </label>
                                <input type="text" name="" />
                                <br />
                                <label class="box-lab"> <span class="utf-8-font">美元</span><br /> USD </label>
                                <input type="text" name="" />
                                <br />
                                <label class="box-lab"> <span class="utf-8-font">泰铢</span><br />THB </label>
                                <input type="text" name="" />
                </td>
                <td>
                  <span class="utf-8-font">活期存款账户</span><br />
                                Savings Acct.<br /><br />
          
                                <label class="box-lab"> <span class="utf-8-font">基普</span><br />
                                  LAK </label>
                                <input type="text" name="" />
                                <br />
                                <label class="box-lab"> <span class="utf-8-font">美元</span><br />
                                  USD </label>
                                <!--<input type="text" name="" value="" style="font-size: 30px;" />-->
                                <input type="checkbox" name="" value="" class="checkmark" checked="" style="
                                border-bottom: 1px dotted #00c;
                                max-width: 100%;
                                width: 90px;
                                font-size: 10px;
                                display: inline-block;
                                margin-top: 7px;
                                line-height: normal;"/>
                                <br />
                                <label class="box-lab"> <span class="utf-8-font">泰铢</span><br />
                                  THB </label>
                                <input type="text" name=""/>
                </td>
                              <td><span class="utf-8-font">活期存款账户</span><br />
                                Fixed Dep. / Fixed Install Dep<br /><br />
          
                                <label class="box-lab"> <span class="utf-8-font">基普</span><br />
                                  LAK </label>
                                <input type="text" name="" />
                                <br />
                                <label class="box-lab"> <span class="utf-8-font">美元</span><br />
                                  USD </label>
                                <input type="text" name="" />
                                <br />
                                <label class="box-lab"> <span class="utf-8-font">泰铢</span><br />
                                  THB </label>
                                <input type="text" name="" /></td>
                            </tr>
                          </table></td>
                      </tr>
                      <tr>
                        <td class="tx-center"><span class="utf-8-font">参考凭证</span><br />
                          Reference Document(s) </td>
                        <td><table  cellpadding="0" cellspacing="0" style="border:none;">
                            <tr>
                              <td style="border:none;"><input type="checkbox" class="checkmark"/>
                                <label class="table-form" for="resident" style=" display: inline;">
                                  
                                  <span class="utf-8-font">居民/Resident</span><br/>
                                  <span class="inline"><span class="utf-8-font">身份证/护照/户口簿</span></span>
                                  <input type="text" name=""/>
                                  <br />
                                  <span class="inline">Identify Card / Passport / Family Book</span>
                                  <input type="text" name=""/>
                                </label></td>
                            </tr>
                            <tr>
                              <td style="border:none; border-top:1px solid"> <input type="checkbox" class="checkmark"/>
                                <label class="table-form" for="non_resident" style=" display: inline;">
                                 
                                  <span class="utf-8-font">非居民/Non Resident</span> <br />
                                  <span class="utf-8-font">护照/工作许可证/外国身份证</span><br />
                                  Passport/Working permit and Foreign ID </label></td>
                            </tr>
                            <tr>
                              <td style="border:none; border-top:1px solid">
                                <input type="checkbox" class="checkmark"/>
                                <label class="table-form" for="article_of_association" style=" display: inline;">
                                  
                                  <span class="utf-8-font">组织章程/Article of Association</span> </label></td>
                            </tr>
                          </table></td>
                        <td class="v-top" style="padding:0;"><table>
                            <tr>
                              <td>
                                <input type="checkbox" class="checkmark"/>
                                <label class="table-form" for="invesment_license" style="display: inline;">
                                  <span class="utf-8-font">投资许可证/Invesment License</span> </label></td>
                            </tr>
                            <tr>
                              <td>
                                <input type="checkbox" class="checkmark"/><label class="table-form" for="enterprise_registration"  style="display: inline;">
                                  <span class="utf-8-font">企业法人营业执照/Enterprise Registration License</span> </label></td>
                            </tr>
                            <tr>
                              <td><input type="checkbox" class="checkmark"/>
                                <label class="table-form" for="tax_license"  style="display: inline;">
                                  <span class="utf-8-font">税务登记证/Tax License</span></label></td>
                            </tr>
                            <tr>
                              <td><input type="checkbox" class="checkmark"/>
                                <label class="table-form" for="resolution_memorandum"  style="display: inline;">
                                  <span class="utf-8-font">开立账户的决议/协议备忘录<br />
                                  Resolution/Memorandum for Openning Acct. </span></label></td>
                            </tr>
                            <tr>
                              <td><label><span class="utf-8-font">其他/other</span></label>
                                <input type="text" /></td>
                            </tr>
                          </table></td>
                      </tr>
                      <tr>
                        <td class="tx-center"><span class="utf-8-font">提交申请</span> Submission For  </td>
                        <td colspan="2" style="padding:0">
                        <table style="width:100%;" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:150px;">
                                <!--<label class="tx-center">-->
                  <label>
                  <span class="utf-8-font"> ATM 卡<br />
                                ATM CARD </span></label>
                              <br />
                              <input type="checkbox" style="display:inline-block;">
                              <label class="table-form" for="premium" style="width:100%; display: inline; padding-left: 0px;">
                                
                                <span class="utf-8-font" style="display:inline-block;"> Premium </span>
                                </label>       
                                <input type="checkbox" style="display:inline-block;"><label>
                                  <span class="utf-8-font" style="display:inline-block;"> General</span>
                                </label>            
                              <br />
                              <span class="utf-8-font">電話號碼:</span>
                              <input type="text" name="" /></td>
                              <td>
                                <input type="checkbox" class="checkmark" checked="" >
                                <label class="table-form" for="visa_debit_card" style="display: inline-table;">
                                  <span class="utf-8-font">VISA 借记卡</span><br />
                                  VISA DEBIT CARD </label>
                                <br /><br />
                                <span class="utf-8-font">沒有:</span>
                                <input type="text" name="" /></td>
                              <td>
                                <input type="checkbox" class="checkmark">
                                <label class="table-form" for="visa_debit_card" style="display: inline-table;">
                                  <span class="utf-8-font">VISA 借记卡</span><br />
                                  VISA CREDIT CARD </label>
                                <br /><br />
                                <span class="utf-8-font">沒有:</span>
                                <input type="text" name="" /></td>
                              <td>
                                <input type="checkbox" class="checkmark">
                                <label class="table-form" for="edc" style="display: inline-table;">
                                  EDC<br />
                                  EDC </label>
                                <br /><br />
                                <span class="utf-8-font">沒有:</span>
                                <input type="text" name="" /></td>
                            </tr>
                          </table></td>
                      </tr>
                      <tr>
                      <td colspan="3">
                        <div class="bottom-sec">
                      <p><span class="utf-8-font">本人/吾等特此证明， 据本人/吾等所知及所信， 上述所提供的信息均真实且完整。 本人/吾等确认本人/吾等已经阅读、理解并同意联合发展银行（JDB）</span></p>
                      <p><span class="utf-8-font">就本人/吾等所选择的账户而规定的条款和条件。 且本人/吾等有义务接受银行政策所作的任何更改， 而无须另行通知。</span></p>
                      <p>I/We hereby certify that the above information given is true and complete to the best of my/our knowledge. I/We confirm that I/We have read, understood and
                        agree with the terms and conditions made available to me/us by Joint Development Bank for the account chosen by me/us. I/We am/are also bound to accept any
                        changes made by the bank's policies without any further notice whatsover. </p>
                    </div><br />
                    <div class="">
                      <div class="seal">
                        <img src="${
                          data.img_sign
                        }" alt="Signature" style="width: auto !important; height: 2rem !important; margin-left: 2rem">
                        <br />
                        <input type="text" name="" />
                        <h4><span class="utf-8-font">账户持有者签名/盖章</span><span><br/> Account Holder's
                          Signature(s)/Seal</span> </h4>
                      </div>
                      <div class="seal">
                        <input type="text" name="" />
                        <h4><span class="utf-8-font">职员/<br/>Staff</span></h4>
                      </div>
                      <div class="seal">
                        <input type="text" name="" />
                        <h4><span class="utf-8-font">获授权者/<br/>Authorized Person</span></h4>
                      </div>
                    </div>
                    </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          </body>
        
          <head>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
          <title>JDB Card Application Form</title>
          <style>
          html {
            -webkit-print-color-adjust: exact;
            margin:15px;
          }
          @font-face {
              font-family: 'Firefly Sung';
              font-style: normal;
              font-weight: 400;
              src: url('{{asset("public/fonts/fireflysung.ttf")}}') format('truetype');
          }
          .utf-8-font, h3 .utf-8-font, h3 {
              font-family: Firefly Sung, DejaVu Sans, sans-serif;
          }
          span.utf-8-font {
              display: inline-block;
              line-height: 12px;
              margin-top: 3px;
          }
          * {
              margin: 0;
              padding: 0;
              max-width: 100%;
          }
          body, label, p {
            font-size: 12px;
            line-height: 13px;
              
              
          }
          .bound {
            margin: 5px auto;
        max-width: 810px;
        width: 810px;
        padding: 15px;
        clear: both;
          }
          .wh730.bound { 
          width: 730px;
          }
          .big-f p, .big-f, .big-f input[type="text"]{font-size:12px; line-height:18px;}
          .big-f.sm p, .big-f.sm, .big-f.sm input[type="text"]{font-size:12px; line-height:15px;}
          .jdb_logo {
              max-width: 120px;
          }
          h2, .h2 {
              text-align: center;
              margin-left: 15px;
              line-height: 22px;
              padding:15px;
              font-size: 18px;
          }
          h3, .h3 {
              background: #edebe0 !important;
              border: 1px solid #000;
              padding: 2px 15px;
              margin: 10px 0 5px;
              line-height: 15px;
              font-size: 12px;
              width: 31.2em;
              
          }
          ul li {
              list-style: none;
          }
          table {
              width: 100%;
              border-collapse: collapse;
          }
          .dots{
              border-bottom: 1px dotted #000;
          }
          
          input[type="text"] {
              border: none;
              border-bottom: 1px dotted #000;
              max-width: 100%;
              width: 87px;
              font-size: 10px;
              display: inline-block;
              margin-top: 3px;
              line-height:normal;
          }
          input[type="text"]:focus {
              outline: none;
              border: none;
              border-bottom: 1px dotted #00C;
          }
          input[type="checkbox"] {
              top: 2px;
              position: relative;
              margin-right: 2px;
              vertical-align: top;
          }
          td {
              vertical-align: top;
              overflow: hidden;
          }
          .col50 {
              width: 50%;
              vertical-align: top;
          }
          label {
              position: relative;
              top: 1px;
          }
          .red-tx {
              color: #f00;
          }
          .box-border td {
              border: 1px solid #000;
          }
          .data-col {
              display: inline-block;
              margin-top: 2px;
              margin-right: 5px;
              width:80px;
          }
          .data-col input.d-date, .data-col input.d-month {
              width: 15px; 
              display: inline-block;
          }
          .data-col input.d-year {
              width: 30px; 
              display: inline-block;
          }
          .of_lis strong {
              position: relative;
              float: left;
              margin: 0 4px;
          }
          .of_lis li {
              padding-left: 7px;
              position: relative;
          }
          .of_lis li:before {
              position: absolute;
              left: 0;
              top: 5px;
              content: "";
              background: #000;
              height: 6px;
              width: 6px;
          }
          .pd td {
              padding: 5px;
          }
          .width100 {
              width: 100px !important;
          }
          .width_100 {
              width: 100% !important;
          }
          .of_lis p {
              padding-top: 3px;
              left: 5px;
              position: relative;
          }
          p {
              padding-top: 1px;
              clear: both;
          }
          ol {
              padding-left: 15px;
          }
           @page {
          margin: 0px !important;
          }
          html {
              margin: 0px !important;
          }
          body {
              margin: 10px !important;
          }
          .break {
              page-break-before: always;
          }
          .typy-of-cards li label {
              font-size: 9px;
          }
          .inline {
              display: inline-block;
          }
          </style>
          </head>
          <body>
          <div class="bound">
            <table cellpadding="0" cellspacing="10" style="border-collapse:inherit; vertical-align:top; width:100%">
              <tbody>
              
                <tr>
                  <td class="col50"><table cellpadding="10" cellspacing="0">
                      <tr>
                        <td><table>
                            <tr>
                              <td><img style="width:90px;" src="https://i.imgur.com/ayn0R9C.png" alt="JDB Card Application Form" class="jdb_logo"/></td>
                              <td><div class="h2"><strong>Application of<br />
                                  International Card Member<br />
                                  </strong> <span class="utf-8-font">国际卡会员申请表</span> </div></td>
                            </tr>
                          </table></td>
                      </tr>
                      <tr>
                        <td><table>
                            <tr>
                              <td><input type="checkbox" name=""/>
                                <label>Head Office/<span class="utf-8-font">总部</span>;</label>
                                <input type="checkbox" name=""/>
                                <label>Service Unit/<span class="utf-8-font">服务单位</span></label>
                                <input type="text" name="" /><br>
                                <label>Code/<span class="utf-8-font">编码</span></label>
                                <input type="text" name="" /></td>
                            </tr>
                          </table></td>
                      </tr>
                      <tr>
                        <td><div class="h3" style="background: #edebe0;
                        border: 1px solid #000;"><b>1. Type of cards/:</b> <span class="utf-8-font">银行卡类别</span></div>
                          <table class="typy-of-cards">
                            <tr>
                              <td class="col50"><strong>VISA:</strong>
                                <ul>
                                  <li>
                                    <input type="checkbox" name="" {{((($data['card_type'] ??  '') == 'visa_debit') || ($data['card_count'] ?? 0) == 2)? 'checked' : ''}} checked />
                                    <label>VISA DEDIT/ VISA<span class="utf-8-font">借记卡</span> ${
                                      data.card_type || ""
                                    }</label>
                                  </li>
                                  <li>
                                    <input type="checkbox" name=""/>
                                    <label>VISA CREDIT CLASSIC
                                      /VISA<span class="utf-8-font">信用卡普通卡</span></label>
                                  </li>
                                  <li>
                                    <input type="checkbox" name=""/>
                                    <label>VISA CREDIT GOLD/ VISA<span class="utf-8-font">信用卡金卡</span></label>
                                  </li>
                                </ul></td>
                              <td><strong>UPI:</strong>
                                <ul>
                                  <li>
                                    <input type="checkbox" name=""   {{((($data['card_type']?? '') == 'upi_debit') || ($data['card_count'] ?? 0) == 2)? 'checked' : ''}}/>
                                    <label>UPI DEBIT/ UPI <span class="utf-8-font">借记卡</span></label>
                                  </li>
                                  <li>
                                    <input type="checkbox" name=""/>
                                    <label>UPI CREDIT GOLD
                                      /UPI <span class="utf-8-font">信用卡金卡</span></label>
                                  </li>
                                  <li>
                                    <input type="checkbox" name=""/>
                                    <label>UPI CREDIT PLATINUM
                                      /UPI <span class="utf-8-font">信用卡白金卡</span></label>
                                  </li>
                                </ul></td>
                            </tr>
                          </table>
                          <p>JDB Champa Super Gold) PLATINUM/ JDB Champa <span class="utf-8-font">超级金卡）白金卡</span></p></td>
                      </tr>
                      <tr>
                        <td><div class="h3"><strong>2. Information of card user (applicant must be reach of 18 years old</strong>)<br>
                            <span class="utf-8-font">持卡人信息（申请人必须年满18周岁)</span></div>
                          <table>
                            <tr>
                              <td><label>Name and surname/<span class="utf-8-font">姓名</span></label>
                                <input type="text" class="utf-8-font" style="width: 62%" value="${data.first_name} ${
            data.last_name
          }" /></td>
                            </tr>
                          </table></td>
                      </tr>
                      <tr>
                        <td><table>
                            <tr>
                              <td><label>Occupation/<span class="utf-8-font">职位</span></label>
                                <input type="text" class="utf-8-font" value=""/></td>
                              <td><label>, Nationality/<span class="utf-8-font">国籍</span></label>
                                <input type="text" class="utf-8-font" value="${
                                  data.nationality
                                }" /></td>
                            </tr>
                          </table></td>
                      </tr>
                      <tr>
                        <td><table class="red-tx">
                            <tr>
                              <td><input type="checkbox" name=""  {{($data['is_employee']?? '' ==  '1')? 'checked':''}}/>
                                <label>Employee/<span class="utf-8-font">雇员</span></label></td>
                              <td><input type="checkbox" name=""  {{($data['is_public_staff']?? '' ==  '1')? 'checked':''}}/>
                                <label>Public staff/<span class="utf-8-font">公职人员</span></label></td>
                            </tr>
                            <tr>
                              <td><input type="checkbox" name=""  {{($data['is_student']?? '' == '1')? 'checked':''}}/>
                                <label>Student/<span class="utf-8-font">学生</span></label></td>
                              <td><input type="checkbox" name="" {{($is_general_customer?? '' == '1')? 'checked' : ''}}/>
                                <label>General Customer/<span class="utf-8-font">普通客户</span></label></td>
                            </tr>
                          </table></td>
                      </tr>
                      <tr>
                        <td><p>Name and surname in capital letter (maximum 22 scripts) <br>
                            <span class="utf-8-font">请用大写字母写下您的姓名(最多22个字符)</span></p>
                          <table class="box-border">
                            <tr> 
                           
                           
                            ${namebox
                              .map((d, i) => {
                                return `<td style="padding:0 1px; text-align:center; min-width:10px;">
                                  <span class="utf-8-font">${d}</span>
                                </td>`;
                              })
                              .join("")} 
                       
                         
                             </tr>
                          </table></td>
                      </tr>
                      <tr>
                        <td><table>
                            <tr>
                              <td><label>Date of birth/<span class="utf-8-font">出生日期</span></label>
                                <div class="data-col">
                                <input type="text" name="" value=" ${data.dob ? getFormatted(data.dob,"/") : ''}" />
                                </div>
                                <label>, ID card/Passport/Family registration </label></td>
                            </tr>
                          </table></td>
                      </tr>
                      <tr>
                        <td><table>
                            <tr>
                              <td><label>Book/<span class="utf-8-font">身份证/护照/户口簿</span></label>
                                <input type="text" name="" value=" ${
                                  data["passport_id"]
                                }" />
                                <label>Date/<span class="utf-8-font">日期</span></label>
                                <div class="data-col">
                                <input type="text" name="" style="width: ${
                                  data.id_issued_date ? getFormatted(data.id_issued_date,"/".length + 80) : 50
                                }%" value=" ${data.id_issued_date ? getFormatted(data.id_issued_date,
                                  "/"
                                ) : ''}" />
                                </div>,
                                </td>
                            </tr>
                          </table></td>
                      </tr>
                      <tr>
                        <td><table>
                            <tr>
                              <td>
                              <label>issued by/<span class="utf-8-font">签发机关</span></label>
                                <input type="text" class="utf-8-font" style="width: ${
                                  data.place_of_id_issued ? (data.place_of_id_issued.length + 30) : 12
                                }%" value="${data.place_of_id_issued}" />
                              <label>Expiration date/<span class="utf-8-font">有效期限</span></label>
                                <div class="data-col">
                                <input type="text" name="" style="width: ${getFormatted(
                                  data.passport_expiry_date,
                                  "/"
                                ).length + 80}%" value="${data.passport_expiry_date ? getFormatted(
                                  data.passport_expiry_date,
                                  "/"
                                ) : ''}" />
                                </div>
                                <label>Place of Birth/<span class="utf-8-font">出生地</span></label>
                                <input type="text" class="utf-8-font" name="" value="" />
                                <label>, District/<span class="utf-8-font">区</span></label>
                                <input type="text" class="utf-8-font" name="" value="" />
                                <span class="utf-8-font" style="display:none;"></span>,
                                <label> Province/<span class="utf-8-font">省份</span></label>
                                <input type="text" style="width: ${data.address1 &&  data.city ? data.address1.length + data.city.length + 15 : 130}%" class="utf-8-font" name="" value="${
                                  data.address1},${data.city}" /> 
                                <input type="text" style="width: ${
                                  400 + 2
                                }%" class="utf-8-font" name="" value="${data.state}, ${data.countryName} ${data.pincode}" /></td>
    
                            </tr>
                          </table></td>
                      </tr>
                      <tr>
                        <td><table class="">
                            <tr>
                              <td>
                                </td> 
                            </tr>
                          </table></td>
                      </tr>
                      <tr>
                        <td><div class="h3"><strong>3. Information of work place/</strong><span class="utf-8-font">工作单位信息</span></div>
                          <table>
                            <tr>
                              <td><label>Work place/<span class="utf-8-font">工作单位</span></label>
                                <input type="text" name="" />
                                <label>Position/<span class="utf-8-font">职位</span></label>
                                <input type="text" name="" /><br>
                                <label>Year of services/<span class="utf-8-font">工作年限</span></label>
                                <input type="text" name="" />
                                <label>years/<span class="utf-8-font">年</span>, from/<span class="utf-8-font">从:</span></label>
                                <div class="data-col">
                                  <input type="text" name="" class="d-date" />
                                  /
                                  <input type="text" name="" class="d-month" />
                                  /
                                  <input type="text" name="" class="d-year"/>
                                </div>
                                <label>to/<span class="utf-8-font">至</span></label>
                                <div class="data-col">
                                  <input type="text" name="" class="d-date" />
                                  /
                                  <input type="text" name="" class="d-month" />
                                  /
                                  <input type="text" name="" class="d-year" />
                                </div>
                                <label>Total income per month/<span class="utf-8-font">每月收入总额</span></label>
                                <input type="text" name=""/>
                                <label>total expenditure per month/<span class="utf-8-font">每月支出总额</span></label>
                                <input type="text" name="" /><br>
                                <label>Home telephone/<span class="utf-8-font">住宅电话</span></label>
                                <input type="text" name="" /><br>
                                <label>, office telephone/<span class="utf-8-font">办公电话</span></label>
                                <input type="text" name="" />
                                <label>Mobile/<span class="utf-8-font">手机号码</span></label>
                                <input type="text" name="" />
                                <label>, E-mail address/<span class="utf-8-font">电子邮箱地址</span></label>
                                <input type="text" name="" /><br>
                                <label>Education level/<span class="utf-8-font">教育程度</span></label>
                                <input type="text" name="" /></td>
                            </tr>
                          </table></td>
                      </tr>
                      <tr>
                        <td><table>
                            <tr>
                              <td><label>Family status/<span class="utf-8-font">家庭状况:</span></label></td>
                              <td><input type="checkbox" name="" />
                                <label>Single/<span class="utf-8-font">单身</span></label></td>
                              <td><input type="checkbox" name="" />
                                <label>Married/<span class="utf-8-font">已婚</span></label></td>
                            </tr>
                          </table></td>
                      </tr>
                      <tr>
                        <td><table>
                            <tr>
                              <td class="ws_none of_lis"><ul>
                                  <li> <strong>Ownership form/</strong><span class="utf-8-font">所有权形式:</span>
                                    <input type="checkbox" name="" />
                                    <label>Private owned house/<span class="utf-8-font">私有住房</span></label>
                                    <br />
                                    <input type="checkbox" name="" />
                                    <label>Parent’s house/<span class="utf-8-font">父母的住房</span></label>
                                    <input type="checkbox" name="" />
                                    <label>Lease/<span class="utf-8-font">租赁住房</span></label>
                                    <br />
                                    <input type="checkbox" name="" />
                                    <label>Relative’s house/<span class="utf-8-font">亲戚的住房</span></label>
                                    <input type="checkbox" name="" />
                                    <label>Officer’s house/<span class="utf-8-font">公司住房</span></label>
                                    <br />
                                    <input type="checkbox" name="" />
                                    <label>Down payment house/<span class="utf-8-font">首付房</span></label>
                                  </li>
                                  <li> <strong>Owned assets/</strong><span class="utf-8-font">拥有资产:</span>
                                    <input type="checkbox" name="" />
                                    <label>Land/<span class="utf-8-font">土地</span></label>
                                    <input type="text" name="" style="width:25px;" />
                                    <br />
                                    <label>Plot(s)/<span class="utf-8-font">块,</span></label>
                                    <input type="checkbox" name="" />
                                    <label>Car/<span class="utf-8-font">轿车</span></label>
                                    <input type="text" name="" style="width:30px;" />
                                    <label>Total of value/<span class="utf-8-font">总价值为</span></label>
                                    <input type="text" name="" />
                                  </li>
                                  <li> <strong>Instalment payment per month/</strong><span class="utf-8-font">每月分期付款:</span>
                                    <input type="text" name="" />
                                    <br />
                                    <label>, debt balance/<span class="utf-8-font">结欠金额</span></label>
                                    <input type="text" name="" />
                                    <br />
                                    <label>Installment period/<span class="utf-8-font">分期付款期</span></label>
                                    <input type="text" name="" />
                                    <label>Month(s)/<span class="utf-8-font"> 个月</span></label>
                                  </li>
                                  <li><strong>Amount of money requested/</strong><span class="utf-8-font">申请金额</span>:
                                    <input type="text" name="" />
                                    <label>US$</label>
                                    <br />
                                    <label>(</label>
                                    <input type="text" name="" />
                                    <label>)</label>
                                    <br />
                                  </li>
                                </ul></td>
                            </tr>
                          </table></td>
                      </tr>
                      <tr>
                        <td><div class="h3"><strong>4. Reference/</strong> <span class="utf-8-font">參考</span></div>
                          <table>
                            <tr>
                              <td><label>Name and surname/<span class="utf-8-font">姓名</span></label>
                                <input type="text" name="" />
                                <label>, age/<span class="utf-8-font">年龄</span></label>
                                <input type="text" name="" />
                                <label>year/<span class="utf-8-font">工作年限</span></label>
                                <label>Occupation</label>
                                <input type="text" name="" />
                                <label>, Work place/<span class="utf-8-font">工作单位</span></label>
                                <input type="text" name="" />
                                <label>Residing address/<span class="utf-8-font">居住地址</span></label>
                                <input type="text" name="" />
                                <label>, District/<span class="utf-8-font">区</span></label>
                                <input type="text" name="" />
                                <label>, Province/<span class="utf-8-font">省份</span></label>
                                <input type="text" name="" /><br>
                                <label>Total Income/ Month/<span class="utf-8-font">每月收入总额</span></label>
                                <input type="text" name="" /><br>
                                <label>, Total Expenditure/ Month/<span class="utf-8-font">每月支
                                  出总额</span></label>
                                <input type="text" name="" /><br>
                                <label>Related to/<span class="utf-8-font">关系</span></label>
                                <input type="text" name="" />
                                <label>, Telephone number/<span class="utf-8-font">联系电话</span></label>
                                <input type="text" name="" /></td>
                            </tr>
                          </table></td>
                      </tr>
                    </table></td>
                  <td class="col50"><table cellpadding="0" cellspacing="0">
                      <tr>
                        <td><table class="box-border pd ws_none" style="margin-top:10px;">
                            <tr>
                              <td colspan="4" style="padding:0;"><div class="h3" style="margin:0; border:none;"><strong>5. Selection of Information for using card/</strong><span class="utf-8-font">关于银行卡使用方面的信息选项</span></div></td>
                            </tr>
                            <tr>
                              <td>1</td>
                              <td><label>Maximum per transaction/<span class="utf-8-font">每笔交易的最高限额</span></label></td>
                              <td><input type="checkbox" name="" />
                                <label>Less than $5,000/<span class="utf-8-font">低于</span>$5,000</label></td>
                              <td><input type="checkbox" name="" checked="" />
                                <label>More than $ 5,000/<span class="utf-8-font">高于</span> $5,000</label></td>
                            </tr>
                            <tr>
                              <td>2</td>
                              <td><label>Number of transaction per day/<span class="utf-8-font">每日交易笔数</span></label></td>
                              <td><input type="checkbox" name="" />
                                <label>Not more than 10 times per day/<span class="utf-8-font">每天不多于10笔</span></label></td>
                              <td><input type="checkbox" name="" checked="" />
                                <label>More than 10 times per day/<span class="utf-8-font">每天多于10笔</span></label></td>
                            </tr>
                            <tr>
                              <td>3</td>
                              <td><label>Transaction via internet/<span class="utf-8-font">互联网交易</span></label></td>
                              <td><input type="checkbox" name="" checked="" />
                                <label> Use via website required/<span class="utf-8-font">需要开通网银</span></label></td>
                              <td><input type="checkbox" name="" />
                                <label>Use via website not required/<span class="utf-8-font">不需开通网银</span></label></td>
                            </tr>
                          </table></td>
                      </tr>
                      <tr>
                        <td><div class="h3"><strong>6. Security Form/</strong><span class="utf-8-font">担保形式</span></div>
                          <table>
                            <tr>
                              <td><label>Name and surname/<span class="utf-8-font">姓名</span></label>
                                <input type="text" name=""  />
                                <label>, age/<span class="utf-8-font">年龄</span></label>
                                <input type="text" name="" />
                                <label>year/<span class="utf-8-font">工作年限</span></label>
                                <label>Occupation</label>
                                <input type="text" name=""  />
                                <label>, Work place/<span class="utf-8-font">工作单位</span></label>
                                <input type="text" name=""  />
                                <label>Residing address/<span class="utf-8-font">居住地址</span></label>
                                <input type="text" name=""  />
                                <label>, District/<span class="utf-8-font">区</span></label>
                                <input type="text" name=""  />
                                <label>, Province/<span class="utf-8-font">省份</span></label>
                                <input type="text" name=""  /><br>
                                <label>Total Income/ Month/<span class="utf-8-font">每月收入总额</span></label>
                                <input type="text" name="" /><br>
                                <label>, Total Expenditure/ Month/<span class="utf-8-font">每月支
                                  出总额</span></label>
                                <input type="text" name=""  /><br>
                                <label>Related to/<span class="utf-8-font">关系</span></label>
                                <input type="text" name=""  />
                                <label>, Telephone number/<span class="utf-8-font">联系电话</span></label>
                                <input type="text" name=""  />
                                <br />
                                <input type="checkbox" name="" />
                                <label>Security saving account/<span class="utf-8-font">担保储蓄账户:</span></label>
                                <input type="text" name=""  />
                                <label>type of account/<span class="utf-8-font">账户
                                  类型</span></label>
                                <input type="text" name=""  />
                                <label>Loan security account (must get
                                  prior authorized loan
                                  document)/ <span class="utf-8-font">贷款担保账户（须事先获得经授权
                                  的贷款文件）</span></label><br>
                                <label>Account number/<span class="utf-8-font">账号</span></label>
                                <input type="text" name=""  />
                                <label>, name of 
                                  account/<span class="utf-8-font">账户名称</span></label>
                                <input type="text" name=""  />
                                <br />
                                <label>Block amount/<span class="utf-8-font">冻结金额:</span></label>
                                <input type="text" name=""  />
                                <label>US$</label>
                                <br />
                                (
                                <input type="text" name=""  />
                                )<br />
                                <label>Value of security asset (must be 120% of proposed credit line)/ <span class="utf-8-font">担保资产价值 （必须为拟议信贷额度的120%）</span></label>
                                <br />
                                <label>Land title number/<span class="utf-8-font">土地所有权证号</span></label>
                                <input type="text" name=""  />
                                <label>, date/<span class="utf-8-font">日期</span></label>
                                <div class="data-col">
                                  <input type="text" name="" class="d-date" />
                                  /
                                  <input type="text" name="" class="d-month" />
                                  /
                                  <input type="text" name="" class="d-year"/>
                                </div>
                                <label>,area/<span class="utf-8-font">面积</span></label>
                                <input type="text" name=""  />
                                <label>m<sup>2</sup>/<span class="utf-8-font">平方米</span></label>
                                <label>Located at village/<span class="utf-8-font">位于：村</span></label>
                                <input type="text" name=""  />
                                <label>, district/<span class="utf-8-font">区</span></label>
                                <input type="text" name=""  /><br>
                                <label>, province/<span class="utf-8-font">省份</span></label>
                                <input type="text" name=""  />
                                <br />
                                <label>Issued under the name of/<span class="utf-8-font">所签发的所有权证归于</span></label>
                                <input type="text" name=""  />
                                <label><span class="utf-8-font">名下，</span> value/<span class="utf-8-font">价值为</span></label>
                                <input type="text" name=""  />
                                <label>Total (LVR)/ <span class="utf-8-font">贷款与估值比率 (LVR)为</span></label>
                                <input type="text" name=""  />
                                <label>%</label></td>
                            </tr>
                          </table></td>
                      </tr>
                      <tr>
                        <td><div class="h3"><strong>7. Form of payment for credit card transaction/</strong><span class="utf-8-font">信用卡交易的还款方式</span></div>
                          <table>
                            <tr>
                              <td><input type="checkbox" name=""  />
                                <label>Cash/<span class="utf-8-font">现金;</span></label>
                                <input type="checkbox" name=""  />
                                <label>Check/<span class="utf-8-font">支票;</span></label>
                                <input type="checkbox" name=""  />
                                <label>Transfer/<span class="utf-8-font">转账;</span></label>
                                <input type="checkbox" name=""  />
                                <label>Automatically debt deducted from saving account/<span class="utf-8-font">从储蓄账户中自动扣除欠款</span></label>
                                <br />
                                <label>Account number/<span class="utf-8-font">账号</span></label>
                                <input type="text" name=""  />
                                <label>name of account/<span class="utf-8-font">账户名称</span></label>
                                <input type="text" name=""  /></td>
                            </tr>
                          </table></td>
                      </tr>
                      <tr>
                        <td><div class="h3"><strong>8. Condition of deduction for payment by international credit card/</strong><span class="utf-8-font">国际信用卡支付扣款条件</span></div>
                          <table>
                            <tr>
                              <td><ul class="of_lis">
                                  <li>
                                    <p>Minimum amount 10% of balance according to the credit statement
                                      must not less than US$100 per month. </p>
                                  </li>
                                  <li>
                                    <p><span class="utf-8-font">根据信用卡结单， 每月余额的10%最低不得少于100美元。</span></p>
                                  </li>
                                  <li>
                                    <p>Deduct of full amount according to the credit statement.</p>
                                  </li>
                                  <li>
                                    <p><span class="utf-8-font">根据信用卡结单扣除全额。</span></p>
                                  </li>
                                </ul></td>
                            </tr>
                          </table></td>
                      </tr>
                      <tr>
                        <td><div class="h3"><strong>9. Consent of international cardholder/</strong><span class="utf-8-font">国际持卡人同意函</span></div>
                          <table>
                            <tr>
                              <td><ol>
                                  <li>
                                    <p>I agree and consent to the Bank to block saving account in order to ensure of debt payment for the use of my visa credit card.</p>
                                    <p><span class="utf-8-font">本人赞成并同意银行冻结储蓄帐户， 以确保本人使用 VISA 信用卡所欠下的款项得以清偿。</span></p>
                                  </li>
                                </ol></td>
                            </tr>
                          </table></td>
                      </tr>
                    </table></td>
                </tr>
              </tbody>
            </table>
          </div>
         
          <div style="margin-top:150px;" class="bound">
            <table cellpadding="0" cellspacing="10" style="border-collapse:inherit; vertical-align:top; width:100%">
              <tbody>
                <tr>
                  <td class="col50"><table cellpadding="0" cellspacing="0">
                      <tr>
                        <td><table cellpadding="0" cellspacing="0">
                            <tr>
                              <td><ol start="2">
                                  <li>
                                    <p>I consent to the Bank to deduct from security saving account in case there is any debt occurred from using my credit card including interest rate and fees determined by the Bank and will not oppose, resist or claim any  rightto the Bank.</p>
                                    <p><span class="utf-8-font">若本人因使用信用卡而欠下款项， 本人同意银行从担保储蓄账户中扣除款项， 包括银行厘定息率及费用， 本人不会反对、抗拒或向银行申索任何权利。</span></p>
                                  </li>
                                </ol>
                                <p>I, as an applicant for visa credit certify that, all statements contained in this application is true. If there is any damages occurred form using of card to the Bank, I agree to take responsibilities to compensate all damages and agree to accomplish according to the rule of Visa Control Center and the law of Lao PDR.</p>
                                <p><span class="utf-8-font"> 本人作为VISA信用卡申请人， 谨此证明本申请表所载的所有陈述均属实。 若因使用信用卡而给银行造成任何损害， 本人同意承担所有损害赔偿责任， 并同意按照 VISA 控制中心的规定以及老挝人民民主共和国的法律予以完成。 </span></p>
                                <br />
                                <p><strong>Joint Development Bank Limited/</strong><span class="utf-8-font">联合发展银行有限公司,</span></p>
                                <label><strong>date/</strong><span class="utf-8-font">日期</span></label>
                                <div class="data-col">
                                  <input type="text" class="d-date" style="width:200px;" name="" value="${data.createdAt ? getFormatted(
                                    data.createdAt,
                                    "/"
                                  ) : ''}" />
                                
                               </div>
                                <br />
                                <p style="text-align:left"><strong>Applicant/</strong><span class="utf-8-font">申请人</span></p>
                                <br />
                                <label>Signature/<span class="utf-8-font">签名:</span></label>
                                <img src="${
                                  data.img_sign
                                }" alt="Signature" style="width: auto !important; height: 50px !important;></td>
                                <input type="text" name="" />
                                <label>,Name/<span class="utf-8-font">姓名</span> :</label>
                                <span type="text" class="utf-8-font" style=" width: ${(data.first_name && data.last_name )? data.first_name.length + data.last_name.length + 2 : 200}%" value="" >${
                                  data.first_name
                                } ${data.last_name}</span></td>
                            </tr>
                          </table></td>
                      </tr>
                      <tr>
                        <td><div class="h3" style="text-align:center;"><strong style="display:inline-block;">For Bank Use/</strong><span class="utf-8-font" style="display:inline-block;">银行专用</span></div>
                          <table class="box-border pd">
                            <tr>
                              <td><p style="text-align:center;"><strong>Officer/<span class="utf-8-font">职员</span></strong></p>
                                <p>
                                  <label>Comment/<span class="utf-8-font">评注:</span></label>
                                  <input type="text" name="" />
                                </p>
                                <label>Date/<span class="utf-8-font">日期</span></label>
                                <div class="data-col">
                                  <input type="text" name="" class="d-date" />
                                  /
                                  <input type="text" name="" class="d-month" />
                                  /
                                  <input type="text" name="" class="d-year" />
                                </div>
                                <br />
                                <br />
                                <br />
                                <p>
                                  <label>Signature</label>
                                  <input type="text" name="" style="width:40px" />
                                  <label>,Name</label>
                                  <input type="text" name="" style="width:40px" />
                                  <br />
                                  <br />
                                </p></td>
                              <td><p style="text-align:center;"><strong>Receive-check officer/ <span class="utf-8-font">收账核算职员</span></strong></p>
                                <p>
                                  <label>Comment/<span class="utf-8-font">评注:</span></label>
                                  <input type="text" name="" />
                                </p>
                                <label>Date/<span class="utf-8-font">日期</span></label>
                                <div class="data-col">
                                  <input type="text" name="" class="d-date" />
                                  /
                                  <input type="text" name="" class="d-month" />
                                  /
                                  <input type="text" name="" class="d-year" />
                                </div>
                                <br />
                                <br />
                                <br />
                                <p>
                                  <label>Signature</label>
                                  <input type="text" name="" style="width:40px" />
                                  <label>,Name</label>
                                  <input type="text" name="" style="width:40px" />
                                  <br />
                                  <br />
                                </p></td>
                            </tr>
                            <tr>
                              <td><p style="text-align:center;"><strong>Credit Department/<span class="utf-8-font">信贷部门</span></strong></p>
                                <p>
                                  <label>Comment/<span class="utf-8-font">评注</span>:</label>
                                  <input type="text" name="" />
                                </p>
                                <label>Date/<span class="utf-8-font">日期</span></label>
                                <div class="data-col">
                                  <input type="text" name="" class="d-date" />
                                  /
                                  <input type="text" name="" class="d-month" />
                                  /
                                  <input type="text" name="" class="d-year" />
                                </div>
                                <br />
                                <br />
                                <br />
                                <p>
                                  <label>Signature</label>
                                  <input type="text" name="" style="width:40px" />
                                  <label>,Name</label>
                                  <input type="text" name="" style="width:40px" />
                                  <br />
                                  <br />
                                </p></td>
                              <td><p style="text-align:center;"><strong>Risk Management Department/<span class="utf-8-font">风险管理部门</span> </strong></p>
                                <p>
                                  <label>Comment/<span class="utf-8-font">评注:</span></label>
                                  <input type="text" name="" />
                                </p>
                                <label>Date/<span class="utf-8-font">日期</span></label>
                                <div class="data-col">
                                  <input type="text" name="" class="d-date" />
                                  /
                                  <input type="text" name="" class="d-month" />
                                  /
                                  <input type="text" name="" class="d-year" />
                                </div>
                                <br />
                                <br />
                                <br />
                                <p>
                                  <label>Signature</label>
                                  <input type="text" name="" style="width:40px"/>
                                  <label>,Name</label>
                                  <input type="text" name="" style="width:40px" />
                                  <br />
                                  <br />
                                </p></td>
                            </tr>
                            <tr>
                              <td><p style="text-align:center;"><strong>Card Center Department/ <span class="utf-8-font">银行卡中心部门</span></strong></p>
                                <p>
                                  <label>Comment/<span class="utf-8-font">评注:</span></label>
                                  <input type="text" name="" />
                                </p>
                                <label>Date/<span class="utf-8-font">日期</span></label>
                                <div class="data-col">
                                  <input type="text" name="" class="d-date"/>
                                  /
                                  <input type="text" name="" class="d-month"/>
                                  /
                                  <input type="text" name="" class="d-year"/>
                                </div>
                                <br />
                                <br />
                                <br />
                                <p>
                                  <label>Signature</label>
                                  <input type="text" name="" style="width:40px" />
                                  <label>,Name</label>
                                  <input type="text" name="" style="width:40px" />
                                  <br />
                                  <br />
                                </p></td>
                              <td><p style="text-align:center;"><strong>Managing Director of JDB/ JDB<span class="utf-8-font">总经 理</span></strong></p>
                                <p>
                                  <label>Comment/<span class="utf-8-font">评注:</span></label>
                                  <input type="text" name="" />
                                </p>
                                <label>Date/<span class="utf-8-font">日期</span></label>
                                <div class="data-col">
                                  <input type="text" name="" class="d-date"/>
                                  /
                                  <input type="text" name="" class="d-month" />
                                  /
                                  <input type="text" name="" class="d-year"/>
                                </div>
                                <br />
                                <br />
                                <br />
                                <p>
                                  <label>Signature</label>
                                  <input type="text" name="" style="width:40px" />
                                  <label>,Name</label>
                                  <input type="text" name="" style="width:40px" />
                                  <br />
                                  <br />
                                </p></td>
                            </tr>
                          </table></td>
                      </tr>
                      <tr>
                        <td><table class="">
                            <tr>
                              <td><p>Documents required/ <span class="utf-8-font">所需文件</span></p>
                                <p>&nbsp;&nbsp;&bull; ID card/<span class="utf-8-font">身份证</span></p>
                                <p>&nbsp;&nbsp;&bull; Passport/<span class="utf-8-font">护照</span></p>
                                <p>&nbsp;&nbsp;&bull; 2 photos of size 3x4/2 <span class="utf-8-font">张尺寸为3x4的照片</span></p>
                                <p>&nbsp;&nbsp;&bull; guaranty deed (if foreigner) /<span class="utf-8-font">担保契据（若为外国人）</span></p></td>
                            </tr>
                          </table></td>
                      </tr>
                    </table></td>
                  <td class="col50" style="position:relative;"><span style="font-size: 18px;
              transform: rotate(-90deg);
              white-space: nowrap;
              display: inline-block;
              opacity:0.7;
              margin-right:-100px; position:absolute; left:0; top:400px;
             ">THIS SPACE IS INTENTIONALLY LEFT BLANK / <span class="utf-8-font">该空间有意留为空白</span></span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="break">&nbsp;</div>
          <div class="bound sm big-f wh730">
            <table cellpadding="0" cellspacing="10" style="border-collapse:inherit; vertical-align:top; width:100%">
              <tbody>
                <tr>
                  <td><table cellpadding="0" cellspacing="0">
                      <tr>
                        <td><img src="https://i.imgur.com/ayn0R9C.png" alt="JDB Card Application Form" class="jdb_logo"/></td>
                        <td style="text-align:right; font-size:13px;"><p>
                            <label class="inline"><strong class="inline">No/</strong><span class="utf-8-font">编号</span></label>
                            <input type="text" name="" />
                            <label><strong>J/ DB</strong></label>
                          </p>
                          <br />
                          <label class="inline"><strong class="inline">Joint Development Bank/</strong><span class="utf-8-font">联合发展银行, dated/日期</span></label>
                          <div class="data-col">
                            <input type="text" name="" class="d-date" />
                            /
                            <input type="text" name="" class="d-month" />
                            /
                            <input type="text" name="" class="d-year" />
                          </div></td>
                      </tr>
                    </table>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td><div class="h2">International Card Use Agreement<br />
                            <span class="utf-8-font width_100">国际卡使用协议</span> </div>
                          <br />
                          <p style="text-align:center;"><strong>International Card Use Agreement “Agreement” was made at Joint Development Bank Limited by and between<br />
                            </strong> <span class="utf-8-font width_100">国际卡使用协议“本协议”在联合发展银行有限公司达成， 缔约双方分别为</span> </p>
                          <br />
                          <p><strong>Joint Development Bank Limited,</strong> having its Head Office at 82,Lane Xang Avenue, Hatsady Village, Chanthaboury District, Vientiane Capital, P.O. Box3187, Telephone:021213531-6 Fax(856-21)213530 here after call <strong>“Bank”</strong><br />
                            <span class="utf-8-font width_100">联合发展银行有限公司， 总部设于首都万象 Chanthaboury 区 Hatsady 村 Lane Xang 大道82号， 邮政信箱为 3187号， 电话：021213531-6 传真(856-21)213
                            530 以下称 <strong> “本行”</strong></span> </p>
                          <br />
                          <p style="text-align:center;"><strong>And<br />
                            </strong> <span class="utf-8-font width_100">和</span> </p>
                          <br /></td>
                      </tr>
                      <tr>
                        <td style="line-height:18px;"><label>Mr/Mrs/<span class="utf-8-font">先生/女士</span></label>
                          <input type="text" style="width: ${(data.first_name && data.last_name ) ? data.first_name.length + data.last_name.length + 2 : 200}%" class="utf-8-font" value="${
                            data.first_name
                          } ${data.last_name}" />
                          <label>date of birth/<span class="utf-8-font">出生日期</span></label>
                          <div class="data-col">
                            <input type="text" class="d-date" style="width:100px;" name="" value=" ${data.dob ? getFormatted(
                              data.dob,"/"
                            ) : ''}" />
                          </div>
                          <label>, ID card/Passport number/<span class="utf-8-font">身份证/护照号码</span></label>
                          <input type="text" class="utf-8-font" name="" style="width: ${
                            data.passport_id ? data.passport_id.length +2 : 30 
                          }%" value="${data["passport_id"]}"  />
                          <label>Date/<span class="utf-8-font">日期</span></label>
                          <div class="data-col">
                          
                          <input type="text" class="d-date utf-8-font" style="width:100px;" name="" value=" ${data.id_issued_date ? getFormatted(
                            data.id_issued_date,"/"
                          ) : ''}" />
                          </div>
                          <label>date of expiry/<span class="utf-8-font">有效期至</span></label>
                          <div class="data-col">
                             <input type="text" class="d-date utf-8-font" style="width:100px;" name="" value=" ${data.passport_expiry_date ? getFormatted(
                               data.passport_expiry_date,"/"
                             ) : ''}" />
                          </div>
                          <label>,issued by/<span class="utf-8-font">签发机关</span></label>
                          
                          <input type="text" class="utf-8-font" value="${
                            data.place_of_id_issued
                          }" style="width: ${data.place_of_id_issued ? data.place_of_id_issued.length + 25 : 40}%"  />
                          <br/>
                          <p>Residing address/<span class="utf-8-font">居住地址</span>
                          <input type="text" class="utf-8-font" style="width: 78%" value="${data.address1}, ${data.city}, ${data.state}"/>
                          <br/>
                          <input type="text" class="utf-8-font" style="width: 97%" value=", ${data.countryName} ${data.pincode}"/><p>
                          <br/>
                          <label>telephone/<span class="utf-8-font">联系电话</span></label>
                          <input type="text" name=""  style="width: ${16}%" value="(+${data.countryCode}) ${data.contactNumber}" />
                          <label>Fax/<span class="utf-8-font">传真</span></label>
                          <input type="text" name="" />
                          <label>email/<span class="utf-8-font">电子邮箱</span>
                          </label>
                          <input type="text" name="" style="width: ${35}%" value="${
                            data.email
                          }" />
                          <br/>
                          <label>address/<span class="utf-8-font">电子邮箱</span>
                          </label>
                          <input type="text" name="" style="width: 50px" value="" />
                          <label>Hereafter call <strong>“Cardholder”</strong>/ <span class="utf-8-font">以下称 “持卡人”</span></label>
                          <label>province/<span class="utf-8-font">省份</span></label>
                          <input type="text" class="utf-8-font" value=""/></td>
                      </tr>
                      <tr>
                        <td><p style="text-align:center;"><br />
          <br />
          Both parties be referred to collectively as the "Parties" or individually as a "Party".<br />
                            Both parties have unanimously agreed inter into International Card Use Agreement under the terms and conditions below:<br />
                            <span class="utf-8-font">双方统称为“缔约双方”，或单独称为“缔约方”。 缔约双方已根据下列条款对“国际卡使用协议”达成一致意见。</span> </p>
                          <br />
                          <p><strong>Article 1 Definition<br />
                            </strong> <span class="utf-8-font">条款1：定义</span> </p>
                          <ol>
                            <li> Bank: (abstract JDB) means Joint Development Bank Limited;<br />
                              <span class="utf-8-font">本行：（缩写JDB） 即联合发展银行有限公司；</span> </li>
                            <li> Card owner means main card holder and additional card issued by the Bank under this Agreement;<br />
                              <span class="utf-8-font">持卡人是指本行根据本协议而发行的主卡与附属卡的持有者； </span></li>
                            <li> ATM meansAutomatically Transaction Machine for cash withdraw and check the balance;<br />
                              <span class="utf-8-font"> ATM是指用于取款与查询账户余额的自动交易机器；</span> </li>
                            <li> EDC(card transaction machine) means Electronic DataCapture Machine for electronic transaction service;<br />
                              <span class="utf-8-font">EDC（银行卡交易机器）是指用于电子交易服务的电子数据采集器；</span> </li>
                            <li> International Card means electronic card for cash payment such as: Visa Debit,Visa Credit,UPI Debit,UPI Credit andother type of card issued by the Bank;<br />
                              <span class="utf-8-font"> 国际卡是指用于现付的电子卡，如：VISA 借记卡、VISA 信用卡、UPI 借记卡、UPI 信用卡以及本行发行的其他类型的银行卡；</span> </li>
                            <li> Debt Statementmeans invoice to card holder for repayment to the Bank in accordance with terms and conditions of this Agreement.<br />
                              <span class="utf-8-font"> 欠款结单是指本行根据本协议的条款和条件向持卡人开具的还款单。</span> </li>
                            <li> Main card is a card issued by the Bank to the cardholder, cardholder hereafter call “Main card owner”;<br />
                              <span class="utf-8-font">主卡是由本行向持卡人发行的银行卡， 主卡持有者人下称“主卡持卡人”；</span> </li>
                            <li> Additional card is a card issued by the Bank to other person requested by main card owner, additional cardholder hereafter call
                              “Additional card owner”. The main card is able to request for issuing additional card at a maximum one card only. In the event of
                              security by a company,the additional cardcannot be issued (the Bank is not authorized to issue additional card).<br />
                              <span class="utf-8-font">附属卡是本行应主卡持卡人要求向其他人发行的银行卡， 附属卡持有者以下称“附属卡持卡人”。主卡最多只能请求银行发行一张附属卡。 在由公司担保的情况下，不能发行附属卡 （本行无权发行附属卡）。</span> </li>
                          </ol>
                          <br />
                          <p><strong>Article 2 Objective<br />
                            </strong> <span class="utf-8-font">条款2：目的</span> </p>
                          <ol>
                            <li> Cardholder desires to use the card from the Bank in order to use for payment according to the type of card as provided for in the registration form as attached here to and it is a part of this Agreement and customer agrees to perform in accordance with this Agreement, regulation, law and rule of International Visa Center;<br />
                              <span class="utf-8-font"> 持卡人欲根据所附注册表中规定的银行卡类型， 使用本行所发行的银行卡进行付款，并且，作为本协议的一部分， 客户同意按照本协议、法规、法律以及国际 VISA中心的规定予以履行；</span> </li>
                            <li> The Bank agrees to issue card to the cardholder under the terms and conditions ofthisAgreement.<br />
                              <span class="utf-8-font"> 本行同意根据本协议中的条款和条件向持卡人发行银行卡。 </span></li>
                          </ol>
                          <br />
                         </td>
                      </tr>
                    </table></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="break">&nbsp;</div>
          <div class="bound big-f wh730">
            <table cellpadding="0" cellspacing="10" style="border-collapse:inherit; vertical-align:top; width:100%">
              <tbody>
                <tr>
                  <td>
                   <p><strong>Article 3 Main and Additional Card<br />
                            </strong> <span class="utf-8-font">条款3：主卡和附属卡</span> </p>
                          <ol>
                            <li> Additional card is a card issued by the Bank to other person requested by main card owner, additional cardholder hereafter call “Additional card owner”. The main card is able to request for issuing additional card at a maximum one card only. In the event of security by a company,the additional cardcannot be issued (the Bank is not authorized to issue additional card);<br />
                              <span class="utf-8-font">附属卡是本行应主卡持卡人要求向其他人发行的银行卡， 附属卡持有者以下称“附属卡持卡人”。主卡最多只能请求银行发行一张附属卡。
                              在由公司担保的情况下， 不能发行附属卡（本行无权发行附属卡）；</span> </li>
                            <li> Main card owner and additional card shall use the account and credit line, such both transaction will appear at the same debt
                              statement andwillbeonlydelivered to the main cardowner;<br />
                              <span class="utf-8-font"> 主卡持卡人和附属卡应使用账户和信用额度， 这样两者交易均将出现在相同的欠款结单中，并且只呈交予主卡持卡人；</span> </li>
                            <li> Main card owner agrees and takes responsible for all transaction appear in the debt statement of the Bank and such debt is the card owner’s debt to be repaid to the Bank whatever the transaction have been accrued from main or additional card;<br />
                              <span class="utf-8-font"> 主卡持卡人同意并对本行的欠款结单中呈现的所有交易承担责任， 并且此类欠款是此卡持卡人的欠款，无论该交易是主卡应计额还是附属卡应计额，主卡持卡人均应向本行予以偿付；</span> </li>             
                      <li> In the even to ftermination additional card is required,the main card owner shall request to the Bank for terminationin writing;<br />
                        <span class="utf-8-font"> 若需终止附属卡， 主卡持卡人应以书面形式向本行请求终止； </span></li>
                      <li> If the main card owner desires to terminate his/her card the additional card will be terminated together;<br />
                        <span class="utf-8-font">若主卡持卡人希望终止其主卡， 则附属卡将一并予以终止； </span></li>
                      <li> Using card by main card owner and additional card owner shallbe strictly performed under the terms and conditions ofthisAgreement and the rule of International Visa Center.<br />
                        <span class="utf-8-font">主卡持卡人和附属卡持卡人在使用银行卡时应严格遵守本协议的条款和条件以及国际 VISA中心的规定。 </span></li>
                    </ol>
                    <br />
                    <p><strong>Article 4 Interest rate, Fees and Card Use<br />
                      </strong> <span class="utf-8-font"> 条款4：利率、费用以及银行卡的使用</span> </p>
                    <ol>
                      <li> Goods and services payment: atthe due date, if the card owner pays all outstanding debts at the end of month the Bank will not
                        calculate the interest occurred on transaction;<br />
                        <span class="utf-8-font">商品和服务付款：在缴款日期前，若持卡人在月底支付所有未偿欠款，本行将不计算交易产生的利息； </span> </li>
                      <li>If the card owner has not been paid as described on the debt statement or settle only apar to fdebt balanc eat the end of month,the
                        Bank will calculate all interests due and continue calculating such interest until the card owner has paid all out standing debts;<br />
                        <span class="utf-8-font">若持卡人未按欠款结单所述支付欠款或月底仅结算部分欠款， 本行将计算所有到期利息，并继续计算此利息，直至持卡人偿还所有未偿
                        欠款； </span> </li>
                      <li>Up on the card owner received debt statement notice for credit card, debit card shall come to get the debt statement with the Bank, the card owner shall take responsibility for all transactions;<br />
                        <span class="utf-8-font"> 在持卡人收到信用卡欠款结单通知后，借记卡持卡人应到本行领取欠款结单，持卡人应对一切交易负责； </span> </li>
                      <li>Cardholder agrees to pay the fee for delay of payment and other fees to the Bank according to the terms at each periods. If the cardholder is unable to pay atthe due period as described in the debt statement,the cardholder agrees to pay fee to the Bank for cashwithdrawnby cardinaccordancewiththe regulationoftheBank issuingfromtime totime. <span class="utf-8-font">持卡人同意按每期条款向本行支付滞纳费及其他费用 。若持卡人未能在欠款结单所述的到期期限内付款，持卡人同意按本行不时发行的规定，向本行支付信用卡取现的费用。 </span></li>
                    </ol>
                    <br />
                    <p><strong>Article 5 Payment and Debt Payment<br />
                      </strong> <span class="utf-8-font">条款5：支付与还款</span> </p>
                    <ol>
                      </li>
                      <li>Debt payment shall include: annualfee, interest and delay fee, cash withdraw fee, cash transaction, goods and services payment occurreddaily those transferred totheBank system;<br />
                        <span class="utf-8-font">还款项应包括：年费、利息和滞纳费、 取现费用、现金交易、每日产生的商品和服务支付款项，将这些转账到本行系统； </span> </li>
                      <li>Any transaction use correctly pin code (pin)and the transaction has contained signature of card owner carrying of cash withdrawal or goodsandservicespayment;<br />
                        <span class="utf-8-font">任何交易均须正确使用PIN码(PIN)， 且在提取现金或支付商品与服务交易项中附上持卡人签名； </span> </li>
                      </ol></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="break">&nbsp;</div>
          <div class="bound big-f wh730">
            <table cellpadding="0" cellspacing="10" style="border-collapse:inherit; vertical-align:top; width:100%; word-wrap: break-word;">
              <tbody>
                <tr>
                  <td>
                  <ol start="3">
                  <li>If the card owner uses the card for order goods or advance payment for service, butthe use and cancel has not been made or the order cannot be cancelled,the goods owner or service provider has the right to call for such goods and service from the card owner
                        based on the price agreed plus other related fee (if any);<br />
                        <span class="utf-8-font"> 如果持卡人使用银行卡订购商品或预付服务费用， 但尚未使用和取消或订单不能取消，货物所有者或服务提供者有权根据商定的价格以 及其他相关费用(如有)要求持卡人对此类商品和服务进行支付； </span> </li>
                      <li>The Bank will send debt statement notice to the card owner on 26th of every month, the card owner shall check and pay according to thestatement, the card owner has obli gate andduty to pay debtoccurredfromusingof cardandwhenitisdueof everymonth the
                        card owner shall have adequate money in the accountfor the debt payment according to the terms and rule;<br />
                        <span class="utf-8-font"> 本行将于每月26日向持卡人发送欠款结单通知，持卡人应根据结单进行核对及付款。持卡人有义务和责任偿还因使用信用卡而产生的欠款。根据条款和规则，每月到期时， 持卡人的账户中应存蓄足够的资金以用于偿还欠款； </span></li>
                      <li>Up on receiving debt statement notice (for credit card; if it is debit card the card owner shall check or monitor by her/himself) if any unsatisfied appear on the debt statement notice,the card owner shall meet with the Bank and make a writing note within 07 days. If the cardownerhasnot settled the issue during such period,the bank will not take any responsibility related to the debt statement notice.<br />
                        <span class="utf-8-font"> 在收到欠款结单通知书时（就信用卡而言；若是借记卡， 则由借记卡持卡人亲自核对或检查），若欠款结单通知书上有任何欠妥之处， 持卡人须与本行会面，并在7天内以书面形式向本行提出。若持卡人未在此期间解决问题， 银行将不承担与欠款结单通知书有关的任何责任。 </span> </li>
                    </ol>
                    <br />
                    <p><strong>Article 6 Rights and Duties of Card Owner<br />
                      </strong> <span class="utf-8-font"> 条款6：持卡人的权利和义务</span> </p>
                    <ol>
                      <li>The card ownerhas the righttopay incashforgoods, services payment andany transactionat anyplaces that EDCavailableor by
                        ATM for cash withdrawn, butit must be atthe terms and conditions made with the Bank.<br />
                        <span class="utf-8-font"> 持卡人有权在任何适用EDC的地方支付商品、 服务款项及任何交易， 或在ATM取款，但必须符合与本行订立的条款和条件。 </span> </li>
                      <li>Thecardownerhas therighttoselectthemethodofpaymenttotheBank incashor requesttheBanktodeductautomatically from
                        saving account opening with the Bank for debt payment monthly.<br />
                        <span class="utf-8-font"> 持卡人有权选择以现金方式向本行支付欠款， 或要求本行每月自动从持卡人在本行开立的储蓄账户中予以扣除。 </span> </li>
                      <li>The card owner shall obtain card by her/himself or assign in writing to other person and such assignment shall be deemed the card owner obtained card by her/himself.<br />
                        <span class="utf-8-font">持卡人应亲自取卡或以书面形式委派他人取卡， 此类委派应视为由持卡人本人亲自取卡。 </span> </li>
                      <li>Up on receivingthe cardowner shall immediately put his/her ownsignatureon the reverse side of card.<br />
                        <span class="utf-8-font"> 取得银行卡后，持卡人应立即在银行卡背面签上自己的签名。 </span> </li>
                      <li>Whenuse thecardfor cashwithdraw, servicespaymentby EDC,the cardowner shall sign onthe receiptthe same signature on the
                        reverse side of card, exempt the transaction via telephone, internet or any transaction no required signature of cardowner.<br />
                        <span class="utf-8-font"> 当使用此卡通过EDC提取现金、 支付服务时，持卡人应在收据上签署与银行卡背面签名一致的签名，通过电话、互联网进行的交易或任何不需要银行卡持有者签名的交易则免于签名。 </span></li>
                      <li>Thecardownerhasthe right to maintain card and keep insafe of PIN and 3digit numbers (CVV2)written inthe reverse sideof card
                        and shall strictly not provide to the other person direct or indirect way. Card owner acknowledged that there is a risk for using of card stolen information by the other person and the card owner agrees to accept the responsible for all completed transaction whether action by card owner or other person; the card owner shall use card properly in accordance with the rule of Bank, International Card Center and not violation of the law of Lao PDR.<br />
                        <span class="utf-8-font"> 持卡人有权维持银行卡并确保PIN码和银行卡背面的3位校验码（CVV2）的安全，严禁直接或间接向其他人提供。持卡人承认使用银行卡被他人盗取信息的风险， 持卡人同意对所有已完成的交易承担责任， 无论已完成的交易是持卡人的行为还是其他人的行为；持卡人应按照本行及国际卡中心的规定正确使用银行卡， 且不得违反老挝人民民主共和国法律。 </span></li>
                      <li>Transfer,assign code number of card to other person is strict lyprohibited.<br />
                        <span class="utf-8-font"> 严禁将银行卡编码转交、转让予他人。 </span></li>
                    </ol>
                 </td>
                 </tr>
                 </tbody>
                 </table>
                 </div>
          <div class="break">&nbsp;</div>
          <div class="bound big-f wh730">
            <table cellpadding="0" cellspacing="10" style="border-collapse:inherit; vertical-align:top; width:100%">
              <tbody>
                <tr>
                  <td>
                  <p><strong>Article 7 Rights and Duties of Bank<br />
                      </strong> <span class="utf-8-font"> 条款7：银行的权利和义务</span></p>
                    <ol>
                      <li>Rights and Duties of Bank<br />
                        <span class="utf-8-font"> 银行的权利和义务</span> - Request card owner to pay debt according to the transactions occurred by using of card, interests, fees each month not later than due dateprovidedfor inthedebt statementnotice.In caseof cardowner isunable todebtin accordance tothe ruleof Bank,the
                        Bank shall have the right to deduct from account or collateral of card owner without authorization and the card owner has no any
                        righttoclaimagainsttheBank.<br />
                        <span class="utf-8-font"> - 要求持卡人每月根据使用银行卡所产生的交易支付欠款、 利息、 费用， 不得迟于欠款结单通知书中规定的到期日 。如持卡人无法按照本行规定偿还欠款，  本行有权擅自从持卡人的账户或抵押担保中予以扣除， 持卡人无权向本行提出索赔。</span><br />
                        - In case the bank has seen a necessary to reserve its right and benefit or of cardholder, the Bank has the right to change in
                        conditions to use the card, limit, terminate using of card without prior notice to the card owner.<br />
                        <span class="utf-8-font"> - 若银行认为有必要保留其对持卡人的权利和利益， 本行有权在不事先通知持卡人的情况下更改银行卡的使用条件、限制、终止银行卡
                        的使用。</span><br />
                        - Implementation of regulation for issuance of card, international credit card payment in order to ensure the right and benefit of card owner according to the contract and maintain confident information of card owner.<br />
                        <span class="utf-8-font">- 实施有关银行卡发行、国际信用卡支付的规定， 以确保持卡人根据合同享有权利和利益，并维护持卡人的机密信息。</span><br />
                        - Resolves request of customers or request in writing from card owner in relation to the use of card, neither lost or be stolen (within 5 days in Vientiane Capital and 7 days in other provinces)<br />
                        <span class="utf-8-font"> - 解决客户请求或持卡人提交的关于银行卡使用方面 （银行卡丢失或被盗）的书面要求（首都万象5天内，其他省份则7天内) </span> </li>
                      <li>Responsibility will be exempted in case of information transmission management system and by any reasons beyond the control of the Bank.<br />
                        <span class="utf-8-font"> 由于信息传输管理系统及本行无法控制的任何原因所导致的情况下， 本行可免于承担责任。</span><br />
                        - Be exempted for responsible of all cases impactto honour, reputation,trust of the card owner regarding returning card or requesting to return card. The Bank will not take responsible for delivery of goods, goods quality or services paying by the card, but the Bank has the right to deduct money from card owner’s account according to the cost of transaction, although such goods and services whatever neither receive or service using.<br />
                        <span class="utf-8-font"> - 对于退卡或请求退卡对持卡人的荣誉、 声誉、 信任造成的所有影响， 本行均免于承担责任。 本行对以银行卡支付的商品交付、 商品质量或服务交付概不承担责任， 但本行有权根据交易成本从持卡人的帐户中扣除款项， 无论持卡人是否收到商品或是否已使用服务。 </span> </li>
                    </ol>
                    <br />
                    <p><strong>Article 8 Change of card, Issuing new card and cancellation of card<br />
                      </strong> <span class="utf-8-font"> 条款8：更换银行卡、发行新卡以及销卡</span> </p>
                    <ol>
                      <li>Loss of cardor request to change new card,the card owner shall propose to the Bank in order to issuenew card, butthe fee will be
                        paid by the card owner in accordance with the rule of Bank issues from time to time;<br />
                        <span class="utf-8-font"> 若银行卡遗失或需更换新卡， 持卡人应向本行提出请求以申请发行新卡， 但费用将由持卡人按照本行不时颁布的规定予以支付；。 </span></li>
                      <li>Before expiration date, the bank will give notice by calling or email to the card owner in order to certify the need for continue using or not using of card within 10 days, in case of contacting card owner is unsuccessful or no response from the card owner. In case of card still valid, but the card owner wish to stop using such card he/she shall inform in writing to the Bank and return the existing card to the Bank;<br />
                        <span class="utf-8-font"> 在有效期届满前， 银行会在10天内通过致电或发送电子邮件通知持卡人， 以确认其需继续使用该卡或不再使用该卡。若银行卡仍然有效，但持卡人希望停止使用此卡时， 他/她应以书面形式通知本行， 并将现有银行卡退回本行； </span></li>
                      <li>When termination of card according to the request of card owner, all outstanding debt balance occurred up to the date of stop using and all transaction occurred from card shall become debt until due date of payment and the card owner shall reply in full amount and shall be deemed thatthe card use contract has been terminated;<br />
                        <span class="utf-8-font"> 当根据持卡人的要求终止银行卡时， 截至停止使用之日所产生的所有未偿欠款以及此卡所产生的所有交易均将成为欠款， 直至付款截止期限， 持卡人应予以全额偿还，  且银行卡使用合同将被视为已终止； </span></li>
                      <li>The Bank has the rightto block (lock),terminate of using card as below:<br />
                        <span class="utf-8-font"> 若出现下列情况， 本行有权对银行卡进行冻结（锁定） 、终止使用：</span><br />
                        - After 90days fromt hedue date of debt payment, but the card owner has not paid or paid any part of debt those less than amount described for indebt statement notice issued by the bank.<br />
                        <span class="utf-8-font"> - 自欠款偿还到期日起90天后， 持卡人仍未支付欠款或所支付的任何部分少于本行发出的欠款结单通知中所述的金额。</span><br />
                        - The card owner has paid more than creditline approved by the Bank according to the terms and conditions ofAgreement. <span class="utf-8-font"> - 持卡人的消费已超出本行根据协议条款和条件批准的信贷额度。</span><br />
                        - The card owner violates the ruleof usingcard or breaks the law impacts to the use of card and related to infringement and risk
                        management.<br />
                        <span class="utf-8-font">- 持卡人违反银行卡使用规则或违法而对银行卡的使用造成影响， 涉及侵权和风险管理。</span><br />
                        - The Bank whatever reason has the right to get the card back by way of sending written notice to the card owner regarding returning card to the Bank.<br />
                        <span class="utf-8-font"> - 无论出于何种原因，本行有权以书面形式通知持卡人将银行卡归还银行， 以此方式收回该卡。 </span> </li>
                    </ol>
                    </td>
                    </tr>
                    </tbody>
                    </table>
                    </div>
                    <div class="break">&nbsp;</div>
          <div class="bound big-f wh730">
            <table cellpadding="0" cellspacing="10" style="border-collapse:inherit; vertical-align:top; width:100%;  word-wrap: break-word;">
              <tbody>
                <tr>
                  <td>
                    <p><strong>Article 9 In case of loss, be stolen, card number and PIN has known by the other person shall perform as follows<br />
                      </strong> <span class="utf-8-font"> 条款9：在银行卡遗失、被盗、卡号及PIN码被他人获知的情况下， 应按照下列规定执行：</span> </p>
                    <ol style="list-style:none">
                      <li>The card owner shall inform the card center, any branch or service units of the JDB where located nearly or call hotline at 1499 in order to block the card, and then written notice shall be sent to the Bank with the information such as: name of card owner, bank account, place of loss,dateof cardexpiration,IDcard/passport andcontactnumber.Incaseoffoundthecardshallbe returningtotheBank inorder to destroy. Ifthere is any transaction occurred before the Bank has received notification the card owner shalltake responsible for such transaction occurred.<br />
                        <span class="utf-8-font"> 持卡人应前往距离最近的JDB银行卡中心、 分行或服务单位予以告知，或致电1499热线进行冻结，然后以书面形式通知本行，并附上持卡人 姓名、银行账户、遗失地点、银行卡到期日期、 身份证/护照和联系电话等信息。若捡到银行卡，应将其退还给本行，以便进行销毁。若在本行收到通知前发生任何交易， 持卡人应对所发生的此类交易承担责任。 </span> </li>
                    </ol>
                    <br />
                    <p><strong>Article 10 Amendment<br />
                      </strong> <span class="utf-8-font"> 条款10：修订</span> </p>
                    <ol>
                      <li>The Bank shall immediately notify to the card owner due to the amendmen to farticle,terms and condition of this Agreement;<br />
                        <span class="utf-8-font"> 若对本协议的条款、细则与条件进行修订， 本行应立即通知持卡人。 </span></li>
                      <li>Iftheamendment cannotbeagreedby thecardowner,thecardowner isentitledtocanceltheuseof card.Ifthecardownerdesires to continue usingof card after theAgreement has been amended;this can be considered excepting the amendment by the card owner.<br />
                        <span class="utf-8-font">若有关修订未能获得持卡人同意， 则该卡持卡人有权取消使用该卡。若持卡人希望在协议修订后继续使用该卡，则可视为持卡人接受所作修订。 </span></li>
                    </ol>
                    <br />
                    <p><strong>Article 11 Applicable Law and Dispute Resolution<br />
                      </strong> <span class="utf-8-font"> 条款11：适用法律和争端解决方式</span> </p>
                    <ol>
                      <li>This Agreement shall be governed by the laws of Lao PDR and regulations in relation to the issuing of card, using, debit and
                        international credit card payment.;<br />
                        <span class="utf-8-font"> 本协定受老挝人民民主共和国法律以及与银行卡发行、 使用、借记及国际信用卡支付有关的条例的管辖。 </span> </li>
                      <li>If anydisputeshallarise,theParties shall cooperatetoreachanamicableresolution.Ifthis failsor,thePartieshavebeenunableto resolve the dispute, either Party may submit the dispute to the court under the justice procedures of Lao PDR for resolution of such dispute.<br />
                        <span class="utf-8-font"> 若发生任何争端，缔约双方应进行合作以达成友好解决方案。 若未能达成友好解决方案或缔约双方无法解决争端， 任何缔约方均可根据老挝人民民主共和国的司法程序将争端提交法院予以解决。 </span> </li>
                    </ol>
                    <br />
                    <p><strong>Article 12 Effective<br />
                      </strong> <span class="utf-8-font"> 条款12：生效</span></p>
                    <ol style="list-style:none;">
                      <li> This Lease Agreement is made in two (2) original copies, having the same content, the Parties have reviewed, read, understood and
                        accepted all details and confirmed the correctness, and the Parties hereby execute and agree to the terms and conditions of this
                        Agreement.ThisAgreementiseffectivefromthedateofsignatureonward.<br />
                        <span class="utf-8-font"> 本协议正本一式两（2） 份，内容相同，缔约双方已审阅、阅读、理解且接受所有细节并已确认其正确性，缔约双方兹执行并同意本协议的条款和条件。本协议自签署之日起生效。 </span> </li>
                    </ol>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td><strong> Card Owner <br />
                          <span class="utf-8-font"> 持卡人 </span></strong><br />  
                          <br />
                          <img src="${
                            data.img_sign
                          }" alt="Signature" style="width: auto !important; height: 2rem !important;></td>
                          <span type="text" class="utf-8-font" style="width: 100%;">
                          ${data.first_name} ${data.last_name}</span></td>
                          
                        <td><strong style="float: right;">Joint Development Bank<br />
                          <span class="utf-8-font"> 联合发展银行</span></strong><br />
                          <br />
                          <input style="float: right;" type="text" name="" /></td>
                      </tr>
                    </table>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td><p><strong>Witness:<br />
                            <span class="utf-8-font"> 见证人：</span></strong> </p>
                          <p>
                            <label>1.&nbsp;&nbsp;</label>
                            <input type="text" name="" />
                          </p>
                          <br />
                          <p>
                            <label>2.&nbsp;&nbsp;</label>
                            <input type="text" name="" />
                          </p>
                          <br />
                          <p>
                            <label>3.&nbsp;&nbsp;</label>
                            <input type="text" name="" />
                          </p></td>
                      </tr>
                    </table>
                    <div class="break">&nbsp;</div>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size: 20px;"><strong>Selfie with Passport Bio Page <br />
                        <br />
                          <span class="utf-8-font"> 与护照生物页自拍 </span></strong><br />  
                          <br />
                          <img src="${
                            data.passport_file_signature_biopic
                          }" alt="Signature" style="width: auto !important; height: 50rem !important;></td>
                         </td>
                      </tr>
                    </table> 
                     <br />
                    <br />
                    <br />
                    <div class="break">&nbsp;</div>
                    
                   </td>
                </tr>
              </tbody>
            </table>
            
          </div>

          <div class="break">&nbsp;</div>
          <div class="bound big-f wh730">
            <table cellpadding="0" cellspacing="10" style="border-collapse:inherit; vertical-align:top; width:100%;  word-wrap: break-word;">
              <tbody>
                <tr>
                  <td>
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-size: 20px;"><strong> Passport Bio Page <br /><br />
                        <span class="utf-8-font"> 
                        护照个人页面 </span></strong><br />  
                        <br />
                        <img src="${
                          data.passport_file_signature
                        }" alt="Signature" style="width: auto !important; height: 50rem !important;></td>
                       </td>
                        
                      <td><strong style="float: right;"><br />
                        <span class="utf-8-font"> </span></strong><br />
                        <br />
                        <input style="float: right;" type="hidden" name="" /></td>
                    </tr>
                  </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          </body>
          </html>
          `;
  
          const browser = await puppeteer.launch({
              headless: true,
              args: ["--no-sandbox"],
          });
          const page = await browser.newPage();
          // We set the page content as the generated html by handlebars
          await page.setContent(html2);
          

          //generating random id for filename;
          let randomId =
              new Date().getTime().toString(36) + Math.random().toString(36).slice(2);
          // We use pdf function to generate the pdf in the same folder as this file.
          let file = await page.pdf({
              path: `./userfile_${randomId}.pdf`,
              format: "A4",
          });
          await browser.close();
          console.log("filecreated");
          var fileName = `./userfile_${randomId}.pdf`; // The default name the browser will use
          console.log(`download`);
          res.download(fileName, function(err) {
              fs.unlinkSync(fileName);
              // the operation is done here
          });
      })
      .catch((err) => {
          console.log(err, "error");
          if (err) {
              res.send(err);
          }
          next;
      });
}
module.exports = router;
