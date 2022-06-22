const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('_middleware/validate-request');
const {authorizeSuperAdmin, authRole} = require('_middleware/authorize')
const superAdminService = require('./superAdmin.service');
const { ROLE } = require('../../_role/role.dto');
const path = require('path');
// routes
router.post('/login', authenticateSchema, authenticate);
router.post('/register', registerSchema, register);
router.get('/verify-link/:email', verifyEmail);
router.get('/getAllAdmins', authorizeSuperAdmin(), getAllAdmins);
router.get('/getAllUsers', authorizeSuperAdmin(), getAllUsers);
router.get('/getAllSuperAdmin', authorizeSuperAdmin(), getAllSuperAdmin);
router.get('/getOne/:email', authorizeSuperAdmin(), getById);


function verifyEmail(req, res, next) {
    superAdminService.getVerifyEmail(req.params)
    .then(user => {
        res.sendFile(path.join(__dirname+'/thankyou.html'));
    })
    .catch(next);
}

function authenticateSchema(req, res, next) {
    const schema = Joi.object({
        email: Joi.string().required(),
        password: Joi.string().required()
    });
    validateRequest(req, next, schema);
}

function authenticate(req, res, next) {
    superAdminService.authenticate(req.body)
        .then(user => res.json(user))
        .catch(next);
}

function registerSchema(req, res, next) {
    const schema = Joi.object({
        email: Joi.string().required(),
        password: Joi.string().min(6).required(),
    });
    validateRequest(req, next, schema);
}

function register(req, res, next) {
    superAdminService.create(req.body)
        .then((user) => {
            if(!user) {
                res.json({ message: 'Registration successful', status: 200 })
            } else {
                res.status(user.status).json(user);
            }
        })
        .catch((err) => {
            if(err.status !== undefined) {
                res.status(err.status).send(err)
            } else {
                res.send(err)
            }
            next;
        });
}

function getAllAdmins(req, res, next) {
    superAdminService.getAllAdmins()
        .then((user) => {
            if(user) {
                res.status(200).json(user);
            }
        })
        .catch((err) => {
            if(err.status !== undefined) {
                res.status(err.status).send(err)
            } else {
                res.send(err)
            }
            next;
        });
}

function getById(req, res, next) {
    superAdminService.getById(req.params.email)
        .then(user => {
            if(!(user.status)) {
                res.status(200).send(user);
            } else {
                res.status(user.status).send(user)
            }
        })
        .catch((err) => {
            if(!(err.status)) {
                res.status(404).send(err);
            } else {
                res.status(err.status).json(err)
            }
            next;
        });
}

function getAllUsers(req, res, next) {
    superAdminService.getAllUsers()
    .then((user) => {
        if(user) {
            res.status(200).json(user);
        }
    })
    .catch((err) => {
        if(err.status !== undefined) {
            res.status(err.status).send(err)
        } else {
            res.send(err)
        }
        next;
    });
}

function getAllSuperAdmin(req, res, next) {
    superAdminService.getSuperAdmin()
        .then(users => res.json(users))
        .catch((err) => {
            res.send(err)
            next;
        });
}

module.exports = router;