const config = require("config.json");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("_db/db");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const validator = require("email-validator");
const { param } = require("./admin.controller");
const { object } = require("joi");
const fetch = require("node-fetch");
const { _ } = require("underscore");
const statusEnum = [
  "N.A",
  "PDF downloaded",
  "Pending Payment",
  "Card Activated",
  "Pending Stake",
  "Active",
  "Act Selfie DL-ed",
  "Manually staked",
  "Bank Activated",
  "KYC Fail / Refunded"
];
const statusCradEnum = ["Activated", "Rejected"];
module.exports = {
  authenticate,
  getAllAdmins,
  getAllUsers,
  createUserByAdmin,
  getById,
  getAllParnters,
  createPartner,
  updatePartner,
  create,
  update,
  delete: _delete,
  sendToMail,
  getBSCOne,
  getVerifyEmail,
  downloadCard,
  updateStatus,
  getPartner,
  partnerExists,
  deletePartner,
  updateUser,
  cardapplyAndWhitelist,
  cardStatus,
  updateBSCDetails,
  getBSCBalance,
  getAllBalance,
  createBSC,
};

async function cardapplyAndWhitelist(userAddress) {
  const userCardApplied = await db.User.scope("withHash").findOne({
    where: { userAddress },
  });

  const user = await db.UserBalance.findOne({
    where: { userAddress },
  });

  if (!userCardApplied) return { message: `User Not Found`, status: 404 };
  return {
    status: 200,
    card_applied: userCardApplied.card_applied || 0,
    card_type: userCardApplied.card_type || 0,
    cardStatus: userCardApplied.cardStatus,
    kycStatus: userCardApplied.is_kyc_approved,
    address: user ? user.userAddress : null,
    jdbCardNumber1: userCardApplied ? userCardApplied.jdbCardNumber1 : "NA",
    card_activated: userCardApplied ? userCardApplied.card_activated : "NA",
    staking:userCardApplied.staking||false,
    stakedate:userCardApplied.stakedate,
    stakeapprove:userCardApplied.stakeapprove||false,
    affiliate:userCardApplied.affiliate||false,
  };
}

async function updateBSCDetails(data) {
  const BSC = await db.BSCFee.scope("withHash").findOne();

  let newData = {
    card_load_fee: data.card_load_fee,
    bsc_token_otc_percentage: data.bsc_token_otc_percentage,
    bsc_token_otc_options: data.bsc_token_otc_options,
    bsc_stables_otc_per: data.bsc_stables_otc_per,
    bsc_stables_otc_options: data.bsc_stables_otc_options,
    updatedAt: new Date(),
  };

  if (!BSC) {
    await db.BSCFee.create(newData);
  } else {
    Object.assign(BSC, newData);
    await BSC.save();
  }

  let resultUser = await BSC.get();
  resultUser = {
    ...resultUser,
    status: 200,
    message: "Successfully Updated.",
  };
  return resultUser;
}

async function createBSC(data) {
  if (!data.userAddress) {
    return { message: "Not Found!", status: 404 };
  }
  const user = await db.User.scope("withHash").findOne({
    where: { userAddress: data.userAddress },
  });
  const BSC = await db.BSCFee.scope("withHash").findOne({
    where: { userAddress: data.userAddress },
  });
  // console.log(await db.User.findOne({ email: data.email }));
  if (!user) {
    return {
      message: "unauthorized, Please Create a user account!",
      status: 401,
    };
  }
  // console.log(data.email);
  if (BSC) {
    return { message: "Already Created", status: 403 };
  }
  // console.log(data.email);
  let newData = {
    userAddress: user.userAddress,
    card_load_fee: data.card_load_fee,
    bsc_token_otc_percentage: data.bsc_token_otc_percentage,
    bsc_token_otc_options: data.bsc_token_otc_options,
    bsc_stables_otc_per: data.bsc_stables_otc_per,
    bsc_stables_otc_options: data.bsc_stables_otc_options,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.BSCFee.create(newData);
  // console.log(resultUser);
  let resultUser = {
    status: 200,
    message: "Successfully Created.",
  };
  return resultUser;
}

async function authenticate({ email, password }) {
  // console.log(email, password)
  const user = await db.User.scope("withHash").findOne({
    where: { email, role_id: 2 },
  });

  if (!user || !(await bcrypt.compare(password, user.password)))
    return { message: "Email or password is incorrect", status: 403 };

  if (user.email_verified_at === null) {
    return { message: "Email is not verified", status: 404 };
  }

  const token = `Bearer ${jwt.sign({ sub: user.id }, config.secret, {
    expiresIn: "7d",
  })}`;
  let resultUser = await user.get();
  resultUser = {
    email: resultUser.email,
    username: resultUser.username,
    status: 200,
  };
  return { ...omitHash(resultUser), token };
}

async function getBSCOne(params) {
  const user = await db.BSCFee.scope("withHash").findOne();

  // console.log(await db.User.findOne({ email: data.email }));
  if (!user) {
    return { message: "Not Found", status: 404 };
  }
  return user;
}

async function updateUser(params, data) {
  console.log(params);
  const user = await db.User.findOne({ where: { id: params } });
  // validate
  // let existUser = {
  //         "first_name": data.first_name || user.first_name,
  //         "last_name": data.last_name || user.last_name,
  //         "email": data.email || user.email,
  //         "email_verified_at": data.email_verified_at || user.email_verified_at,
  //         "dob": data.dob || user.dob,
  //         "nationality": data.nationality || user.nationality,
  //         "passport_id": data.passport_id || user.passport_id,
  //         "maiden_name": data.maiden_name || user.maiden_name,
  //         "pep": data.pep || user.pep,
  //         "contactNumber": data.contactNumber || user.contactNumber || 0,
  //         "password": data.password || user.password,
  //         "remember_token": data.remember_token || user.remember_token,
  //         "created_at": data.created_at || user.created_at || new Date(),
  //         "updated_at": data.updated_at || user.updated_at || new Date(),
  //         "countryCode": data.countryCode || user.countryCode,
  //         "cardNumber": data.cardNumber || user.cardNumber,
  //         "jdbCardNumber1": data.jdbCardNumber1 || user.jdbCardNumber1,
  //         "jdbCardNumber2": data.jdbCardNumber2 || user.jdbCardNumber2,
  //         "google2fa_enable": data.google2fa_enable || user.google2fa_enable,
  //         "google2fa_secret": data.google2fa_secret || user.google2fa_secret,
  //         "google2fa_qr": data.google2fa_qr || user.google2fa_qr,
  //         "countryName": data.countryName || user.countryName,
  //         "cardCount": data.cardCount || user.cardCount || 0,
  //         "appid": data.appid || user.appid,
  //         "kycres": data.kycres || user.kycres,
  //         "balance_usd": data.balance_usd || user.balance_usd,
  //         "balance_btc": data.balance_btc || user.balance_btc,
  //         "balance_eth": data.balance_eth || user.balance_eth,
  //         "address1": data.address1 || user.address1,
  //         "address2": data.address2 || user.address2,
  //         "city": data.city || user.city,
  //         "state": data.state || user.state,
  //         "pincode": data.pincode || user.pincode,
  //         "d_country": data.d_country || user.d_country,
  //         "inspectionId": data.inspectionId || user.inspectionId,
  //         "deleted_at": data.deleted_at || user.deleted_at || new Date(),
  //         "urnNumber": data.urnNumber || user.urnNumber,
  //         "jdbAccountNo1": data.jdbAccountNo1 || user.jdbAccountNo1,
  //         "jdbAccountNo2": data.jdbAccountNo2 || user.jdbAccountNo2,
  //         "vendor_id": data.vendor_id || user.vendor_id,
  //         "img_sign": data.img_sign || user.img_sign,
  //         "partner_fee": data.partner_fee || user.partner_fee,
  //         "company_name": data.company_name || user.company_name,
  //         "card_applied": data.card_applied || user.card_applied,
  //         "is_doc_downloaded": data.is_doc_downloaded || user.is_doc_downloaded,
  //         "kyc_country": data.kyc_country || user.kyc_country,
  //         "response_check": data.response_check || user.response_check,
  //         "passport_file_signature": data.passport_file_signature || user.passport_file_signature,
  //         "passport_file_signature_biopic": data.passport_file_signature_biopic || user.passport_file_signature_biopic,
  //         "suspended": data.suspended || user.suspended,
  //         "suspended_reason": data.suspended_reason || user.suspended_reason,
  //         "card_email": data.card_email || user.card_email,
  //         "card_img": data.card_img || user.card_img
  //     }
  // console.warn(data.jdbCardNumber1);
  if (!user) {
    throw { message: `${email} is not found`, status: 404 };
  }

  if (data.jdbCardNumber1 !== undefined) {
    if (
      await db.User.findOne({ where: { jdbCardNumber1: data.jdbCardNumber1 } })
    ) {
      throw { message: `${data.jdbCardNumber1} is already exist`, status: 404 };
    }
  }

  Object.assign(user, data);
  await user.save();
  let resultUser = await user.get();
  resultUser = {
    ...data,
    status: 200,
    message: "Successfully Updated.",
  };
  return omitHash(resultUser);
}

async function getAllAdmins() {
  if (await db.User.scope("withHash").findAll({ where: { role_id: 2 } })) {
    return await db.User.scope("withHash").findAll({ where: { role_id: 2 } });
  }
  return { message: "No Admin User Found!", status: 404 };
}

async function getAllParnters() {
  return await db.Partner.findAll({ where: { status: "ACTIVE" } });
}

async function partnerExists(partner) {
  const user = db.Partner.findOne({
    where: { partner_name: partner, status: "ACTIVE" },
  });
  if (!user) return { message: `Partner Not Found`, status: 404 };
  return user;
}

async function getPartner(id) {
  const user = db.Partner.findOne({
    where: { id: id, status: "ACTIVE" },
  });
  if (!user) return { message: `Partner Not Found`, status: 404 };
  return user;
}

async function getAllUsers() {
  if (await db.User.scope("withHash").findAll({ where: { role_id: 3 } })) {
    return await db.User.scope("withHash").findAll({
      where: { role_id: 3 },
      order: [["updatedAt", "DESC"]],
    });
  }
  return { message: "No User Found!", status: 404 };
}

async function getById(email) {
  console.log("HERE2");
  return await getUser(email);
}

async function createUserByAdmin(data) {
  let user = await db.User.scope("withHash").findOne({
    where: { userAddress: data.userAddress, role_id: 3 },
  });

  if (!user) {
    let newUser = {
      ...data,
      role: `user`,
      role_id: 3,
      suspended: 0,
      is_kyc_approved: data.kycStatus,
    };
    // save user
    await db.User.create(newUser);
    user = newUser;
  } else {
    return { message: "User already Exists", status: 201 };
  }

  /* if (user.email_verified_at === null) {
    return { message: "Email is not verified", status: 404 };
  }
 */

  return { user };
}

async function create(params) {
  // validate
  if (!validator.validate(params.email)) {
    return { message: params.email + '" is not a valid email.', status: 409 };
  }

  if (await db.User.findOne({ where: { email: params.email } })) {
    return {
      message: 'Email "' + params.email + '" is already taken',
      status: 409,
    };
  }

  // hash password
  if (params.password) {
    params.password = await bcrypt.hash(params.password, 10);
  }

  let newUser = {
    email: params.email,
    password: params.password,
    role: `admin`,
    role_id: 2,
  };

  // save user
  await db.User.create(newUser);
  const user = await db.User.findOne({ where: { email: params.email } });
  let url = `http://172.104.182.216:3000`;
  let token = {
    userId: user.email,
    token: `${crypto.randomBytes(32).toString("hex")}`,
  };
  const link = `${url}/admin/verify-link/${user.email}`;
  await sendVerifyMail(params.email, "Verify Email Address", link);
  let mail = { message: `Verification Mail Sent Successfully`, status: 200 };
  return mail;
}

async function createPartner(params) {
  let partner = null;

  partner = await db.Partner.findOne({
    where: { partner_name: params.partnerName },
  });

  if (partner) {
    return {
      statusCode: 201,
      message: "Partner with same name already exists",
    };
  }

  partner = {
    partner_name: params.partnerName,
    partner_otc: params.partnerOtc,
    prv_otc: params.prvOtc,
    status: "ACTIVE",
  };

  return await db.Partner.create(partner);
}

async function getAllBalance(param, res) {
  const userAddress = param.params.userAddress;
  console.log(userAddress, "aaddreess");
  let wbtcBalance = 0; //await getBSCBalance(userAddress,'WBTC');
  let wethBalance = 0; //await getBSCBalance(userAddress,'WETH');
  let busdBalance = await getBSCBalance(userAddress, "BUSD");
  let prvBalance = 0; //await getBSCBalance(userAddress,'PRV');
  let USDCBalance = await getBSCBalance(userAddress, "USDC");
  let CakeBalance = 0; //await getBSCBalance(userAddress,'CAKE');
  let XVSBalance = 0; //await getBSCBalance(userAddress,'XVS');
  let ALPACABalance = 0; //await getBSCBalance(userAddress,'ALPACA');
  let EPSBalance = 0; //await getBSCBalance(userAddress,'EPS');
  let MDXBalance = 0; //await getBSCBalance(userAddress,'MDX');
  let MBOXBalance = 0; //await getBSCBalance(userAddress,'MBOX');
  let USDTBalance = await getBSCBalance(userAddress, "USDT");

  res.status(200).json({
    status: "true",
    message: "Balance fetched successful",
    btcb: 0,
    eth: 0,
    busd: busdBalance,
    PRV: 0,
    USDC: USDCBalance,
    Cake: 0,
    XVS: 0,
    ALPACA: 0,
    EPS: 0,
    MDX: 0,
    AUTO: 0,
    MBOX: 0,
    USDT: USDTBalance,
  });
}

async function getBSCBalance(userAddress, type) {
  const response = await fetch(
    `https://api.bscscan.com/api?module=account&action=tokentx&contractaddress=${
      config[type]
    }&address=${userAddress}&sort=asc&apikey=${"WT4ZSGEMCG63TE8IEFU8RPNJ1RIPBC5GJB"}`
  );

  const data = await response.json();

  const transactions = _.where(data.result, {
    to: "0x10c63ed81ef4187468544bb913af070cf4c5719a",
  });

  if (transactions.length) {
    let balance = _.reduce(
      transactions,
      function (memo, item) {
        return memo + item.value / 10 ** item.tokenDecimal;
      },
      0
    );

    return balance;
  } else {
    return 0;
  }
}

async function updatePartner(params, id) {
  let partner = null;

  if (params.partnerName) {
    partner = await db.Partner.findOne({
      where: { partner_name: params.partnerName },
    });
  }

  if (partner) {
    return { status: 201, message: "Partner with same name already exists" };
  }

  partner = await db.Partner.findOne({ where: { id: id } });

  if (!partner) {
    return { status: 404, message: "Partner not found" };
  }
  Object.assign(partner, {
    partner_name: params.partnerName || partner.partner_name,
    partner_otc: params.partnerOtc,
    prv_otc: params.prvOtc,
  });
  await partner.save();
  let resultUser = await partner.get();
  const updatedPartner = {
    partner: resultUser,
    status: 200,
  };

  return updatedPartner;
}

async function update(email, params) {
  const user = await db.User.findOne({ where: { email } });
  // validate

  if (!user) {
    return { message: `${email} is not registered`, status: 404 };
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

async function updateStatus(userAddress, params) {
  const user = await db.User.findOne({ where: { userAddress } });
  // validate
  if (!user) {
    return { message: `${userAddress} is not registered`, status: 404 };
  }
  if (!statusEnum.includes(params.status)) {
    return { message: `${params.status} is not valid option`, status: 404 };
  }

  if (params.status === "Card Activated") {
    if (user.card_activated === 2) {
      return { message: `Card is already activated by Admin`, status: 201 };
    } else {
      const newData = {
        status: params.status,
        card_activated: 2,
      };

      console.log(user.userAddress);
      Object.assign(user, newData);
      await user.save();
    }
  } else {
    const newData = {
      status: params.status,
      card_activated: user.card_activated,
    };

    console.log(user.userAddress);
    Object.assign(user, newData);
    await user.save();
  }

  let resultUserDb = await user.get();
  let resultUser = {
    status: 200,
    data: resultUserDb.status,
    card_activated: resultUserDb.card_activated,
  };
  return await resultUser;
}

async function downloadCard(params) {
  if (
    !(await db.User.findOne({
      where: { userAddress: params.userAddress, card_applied: 1 },
    }))
  ) {
    return { message: `Card not applied for this ${params.userAddress}` };
  }
  return await db.User.findOne({
    where: { userAddress: params.userAddress, card_applied: 1 },
  });
}

async function cardStatus(params, data) {
  const user = await db.User.findOne({
    where: { userAddress: params.userAddress },
  });

  if (user) {
    if (user.card_activated === 2) {
      return { message: "Your card has been activated by admin", status: 404 };
    }

    if (user.card_activated === 0) {
      return { message: "Please active your card first!", status: 404 };
    }

    if (!statusCradEnum.includes(data.status)) {
      return { message: `${data.status} is not valid option`, status: 404 };
    }

    if (data.status === "Activated" && user.card_activated === 1) {
      const newData = {
        card_activated: 2,
      };
      Object.assign(user, newData);
      await user.save();
      return { message: "Card activated succesfully", status: 200 };
    } else {
      const newData = {
        card_activated: 0,
      };
      Object.assign(user, newData);
      await user.save();
      await sendRejectMail(user.email, "Validation Unsuccessful", user);
      return { message: "Mail sent successfully", status: 200 };
    }
  } else {
    console.log("Please check card number, you have entered!");
    return {
      message: "Please check the card number, you have entered!",
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
  // console.log(resultUser.email_verified_at)
  await sendVerifySuccesfullMail(
    params.email,
    "Registration Completed",
    resultUser.email
  );
  return resultUser;
}
async function sendToMail(params) {
  if (!(await db.User.findOne({ where: { email: params.email } }))) {
    return { message: `${params.email} is not registered`, status: 404 };
  }
  let url = `http://172.104.182.216:3000`;
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
async function _delete(userAddress) {
  const user = await getUser(userAddress);

  const userBalance = await db.UserBalance.findOne({
    where: { userAddress: userAddress },
  });
  if (userBalance) await userBalance.destroy();

  await user.destroy();
}

async function deletePartner(id) {
  const partner = await getPartner(id);

  partner.status = "DELETED";

  return await partner.save();
}

// helper functions

async function getUser(userAddress) {
  console.log("HERE3");
  const user = await db.User.scope("withHash").findOne({
    where: { userAddress },
  });
  if (!user) return { message: `User Not Found`, status: 404 };
  console.log(user, "HERE4");
  return user;
}

function omitHash(user) {
  const { hash, ...userWithoutHash } = user;
  return userWithoutHash;
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
                                                <h1 style="color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;">Hello!<br/>
                                                Please click the button below to verify your email address.</h1>

                                                <a href="${text}"
                                                    style="background:#20e277;text-decoration:none !important; font-weight:500; margin-top:35px; color:#fff;text-transform:uppercase; font-size:14px;padding:10px 24px;display:inline-block;border-radius:50px;">Verify Email Address</a><br/>
                                                
                                                <p style="color:#455056; font-size:15px;line-height:24px; margin:0;">
                                                If you did not create an account, no further action is required.
                                                </p>

                                                <p style="font-size:13px;line-height:24px; margin:0;">If you’re having trouble clicking the Verify Email Address button, copy and paste the URL below
                                                into your web browser : ${text}</p>

                                                <p>Regards,<br/>
                                                    PrivacySwap</p>
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
                                                Privacyswap Team</p>
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
async function sendRejectMail(email, subject, data) {
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
            <title>Card Validation</title>
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
                                                <h1 style="color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;">Dear ${data.first_name},</h1>
                                                <span
                                                    style="display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;"></span>
                                                <p style="color:#455056; font-size:15px;line-height:24px; margin:0;">
                                                    Your card validation was unsuccessful. <br/>Please upload a clearer selfie image of you holding your passport and card.
                                                </p>
                                                <p style="color:#455056; font-size:15px;line-height:24px; margin:0;">
                                                    Thank you.
                                                    <br/>
                                                    Regards,
                                                    <br/>
                                                    PrivacySwap Team
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
