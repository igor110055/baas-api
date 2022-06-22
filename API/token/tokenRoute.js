const express= require('express');
const router = express.Router();
const token = require('../token/token');


router.get('/getBalance', token.BalanceOF);


module.exports= router

