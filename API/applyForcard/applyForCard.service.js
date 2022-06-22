const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_db/db');

module.exports = {
    authenticate,
    // getAll,
    // getById,
    create,
    // update,
    // delete: _delete
};

async function authenticate({ email, password }) {
    // console.log(email, password)
    const user = await db.User.scope('withHash').findOne({ where: { email } });
    
    if (!user || !(await bcrypt.compare(password, user.password)))
        return {message: 'Email or password is incorrect', status: 403};

    const token = `Bearer ${jwt.sign({ sub: user.id }, config.secret, { expiresIn: '7d' })}`;
    let resultUser = await user.get();
    resultUser = {
        email: resultUser.email,
        username: resultUser.username,
    }
    return { ...omitHash(resultUser), token };
}

// async function getAll() {
//     return await db.User.findAll();
// }

// async function getById(id) {
//     return await getUser(id);
// }

async function create(params) {
    const user = await getUser(params.userAddress);
    let currentUser = await db.User.findOne({ where: { userAddress: params.userAddress } });
    // console.log(currentUser.dataValues.card_applied === 1)
    
    if (currentUser.dataValues.cardCount === 1) {
        return {message: `Card is already applied for ${params.userAddress}` , status: 409};
    }

    let newCard = {
        ...params,
        card_applied: 1,
        cardCount: 1
    }
    // console.log(params)
    Object.assign(user, newCard);
    await user.save();
    let resultUser = await user.get();
    return omitHash(resultUser);
}

async function getUser(email) {
    const user = await db.User.findOne({ where: { email: email } });
    if (!user) return {message: `User Not Found`, status: 404};
    return user;
}
function omitHash(user) {
    const { hash, ...userWithoutHash } = user;
    return userWithoutHash;
}

