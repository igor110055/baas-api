const jwt = require('express-jwt');
const { secret } = require('config.json');
const db = require('_db/db');

function authorizeUser() {
    return [
        // authenticate JWT token and attach decoded token to request as req.user
        jwt({ secret, algorithms: ['HS256'] }),

        // attach full user record to request object
        async (req, res, next) => {
            // console.log(req.body)
            // get user with id from token 'sub' (subject) property
            const user = await db.User.findByPk(req.user.sub);
            if(user.role_id !== 3) {
                return res.status(401).json({ message: 'Unauthorized', status: 401 });
            }
            // check user still exists
            if (!user)
                return res.status(401).json({ message: 'Unauthorized', status: 401 });

            // authorization successful
            req.user = user.get();
            next();
        }
    ];
}
function authorizeAdmin() {
    return [
        // authenticate JWT token and attach decoded token to request as req.user
        jwt({ secret, algorithms: ['HS256'] }),

        // attach full user record to request object
        async (req, res, next) => {
            // get user with id from token 'sub' (subject) property
            const user = await db.User.findByPk(req.user.sub);
            if(user.role_id === 3) {
                return res.status(401).json({ message: 'Unauthorized', status: 401 });
            }
            // check user still exists
            if (!user)
                return res.status(401).json({ message: 'Unauthorized', status: 401 });

            // authorization successful
            req.user = user.get();
            next();
        }
    ];
}
function authorizeSuperAdmin() {
    return [
        // authenticate JWT token and attach decoded token to request as req.user
        jwt({ secret, algorithms: ['HS256'] }),

        // attach full user record to request object
        async (req, res, next) => {
            // get user with id from token 'sub' (subject) property
            const user = await db.User.findByPk(req.user.sub);
            // check user still exists
            if (!user)
                return res.status(401).json({ message: 'Unauthorized', status: 401 });

            // authorization successful
            req.user = user.get();
            next();
        }
    ];
}
function authRole(role) {
    return [
        // authenticate JWT token and attach decoded token to request as req.user
        jwt({ secret, algorithms: ['HS256'] }),

        // attach full user record to request object
        async (req, res, next) => {
            // get user with id from token 'sub' (subject) property
            const user = await db.User.findByPk(req.user.sub);

            if(role !== user.get().role) {
                res.status(401)
                return res.staus(401).send(`This Service Is Not Allowd For ${(user.get().role).toUpperCase()} 🚫`)
            }
            // authorization successful
            req.user = user.get();
            next();
        }
    ];
}


module.exports = {
    authorizeUser,
    authRole,
    authorizeAdmin,
    authorizeSuperAdmin
};