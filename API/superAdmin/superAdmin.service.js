const config = require("config.json");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("_db/db");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const validator = require("email-validator");

module.exports = {
  authenticate,
  getAllAdmins,
  getAllUsers,
  getSuperAdmin,
  getById,
  create,
  update,
  delete: _delete,
  sendToMail,
  getVerifyEmail,
};

async function authenticate({ email, password }) {
  // console.log(email, password)
  const user = await db.User.scope("withHash").findOne({
    where: { email, role_id: 1 },
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

async function getAllAdmins() {
  if (await db.User.scope("withHash").findAll({ where: { role_id: 2 } })) {
    return await db.User.scope("withHash").findAll({ where: { role_id: 2 } });
  }
  return { message: "No Admin User Found!", status: 404 };
}

async function getAllUsers() {
  if (await db.User.scope("withHash").findAll({ where: { role_id: 3 } })) {
    return await db.User.scope("withHash").findAll({ where: { role_id: 3 } });
  }
  return { message: "No User Found!", status: 404 };
}

async function getSuperAdmin() {
  if (await db.User.scope("withHash").findAll({ where: { role_id: 1 } })) {
    return await db.User.scope("withHash").findAll({ where: { role_id: 1 } });
  }
  return { message: "No SuperAdmin Found!", status: 404 };
}

async function getById(email) {
  return await getUser(email);
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
    role: `SuperAdmin`,
    role_id: 1,
  };

  // save user
  await db.User.create(newUser);
  const user = await db.User.findOne({ where: { email: params.email } });
  let url = `http://172.104.182.216:3000`;
  let token = {
    userId: user.email,
    token: `${crypto.randomBytes(32).toString("hex")}`,
  };
  const link = `${url}/superAdmin/verify-link/${user.email}`;
  await sendVerifyMail(params.email, "Verify Email Address", link);
  let mail = { message: `Verification Mail Sent Successfully`, status: 200 };

  return mail;
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
async function _delete(id) {
  const user = await getUser(id);
  await user.destroy();
}

// helper functions

async function getUser(email) {
  const user = await db.User.scope("withHash").findOne({ where: { email } });
  if (!user) return { message: `Admin Not Found`, status: 404 };
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
