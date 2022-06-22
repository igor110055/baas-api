const express = require("express");
const router = express.Router();
const Joi = require("joi");
const validateRequest = require("_middleware/validate-request");
const { authorizeUser, authRole } = require("_middleware/authorize");
const userService = require("./applyForCard.service");
const { ROLE } = require("../../_role/role.dto");
const db = require("_db/db");
const fs = require("fs");
const path = require("path");

router.put("/apply", registerSchema, createCard);

function getData(req, res, next) {
  res.render;
}

function registerSchema(req, res, next) {
  const schema = Joi.object({
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    contactNumber: Joi.string().required(),
    dob: Joi.string().required(),
    email: Joi.string().required(),
    address1: Joi.string().required(),
    address2: Joi.string().required(),
    state: Joi.string().required(),
    pincode: Joi.number().required(),
    city: Joi.string().required(),
    countryName: Joi.string().required(),
    nationality: Joi.string().required(),
    passport_id: Joi.string().required(),
    img_sign: Joi.string().required(),
    passport_file_signature: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}

function createCard(req, res, next) {
  userService
    .create(req.body)
    .then(() => {
      res.json({ message: "Card Applied Successfully.", status: 200 });
    })
    .catch((err) => {
      if (err) {
        res.status(err.status).send(err);
        next;
      } else {
        res.send(err);
        next;
      }
    });
}

module.exports = router;
