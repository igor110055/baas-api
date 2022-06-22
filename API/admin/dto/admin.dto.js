const { DataTypes } = require('sequelize');
const Role = require('../../../_role/role.dto');

module.exports = model;

function model(sequelize) {
    const attributes = {
        id: {type: DataTypes.UUID, primaryKey: true , allowNull: true, defaultValue: DataTypes.UUIDV4},
        firstName: { type: DataTypes.STRING, allowNull: true },
        lastName: { type: DataTypes.STRING, allowNull: true },
        username: { type: DataTypes.STRING, allowNull: true },
        password: { type: DataTypes.STRING, allowNull: true },
        role: { type: DataTypes.STRING, allowNull: false, defaultValue: Role.ADMIN},
        first_name: { type: DataTypes.STRING, allowNull: true },
        last_name: { type: DataTypes.STRING, allowNull: true },
        email: { type: DataTypes.STRING, allowNull: true },
        email_verified_at: { type: DataTypes.STRING, allowNull: true },
        dob: { type: DataTypes.STRING, allowNull: true },
        nationality: { type: DataTypes.STRING, allowNull: true },
        passport_id: { type: DataTypes.STRING, allowNull: true },
        maiden_name: { type: DataTypes.STRING, allowNull: true },
        pep: { type: DataTypes.STRING, allowNull: true },
        contactNumber: { type: DataTypes.STRING, allowNull: true },
        password: { type: DataTypes.STRING, allowNull: true },
        status: { type: DataTypes.ENUM({values: ['pending','active','deactive']}), allowNull: true },
        remember_token: { type: DataTypes.STRING, allowNull: true },
        created_at: { type: DataTypes.DATE, allowNull: true },
        updated_at: { type: DataTypes.DATE, allowNull: true },
        countryCode: { type: DataTypes.INTEGER, allowNull: true },
        cardNumber: { type: DataTypes.STRING, allowNull: true },
        jdbCardNumber1: { type: DataTypes.STRING, allowNull: true },
        jdbCardNumber2: { type: DataTypes.STRING, allowNull: true },
        cardStatus: { type: DataTypes.ENUM({values: ['unpaid','paid','pending','assigned','verified','blocked']}), allowNull: true },
        jdbCardStatus1: { type: DataTypes.ENUM({values: ['unpaid','paid','pending','assigned','verified','blocked']}), allowNull: true },
        jdbCardStatus2: { type: DataTypes.ENUM({values: ['unpaid','paid','pending','assigned','verified','blocked']}), allowNull: true },
        google2fa_enable: { type: DataTypes.TINYINT, allowNull: true },
        google2fa_secret: { type: DataTypes.STRING, allowNull: true },
        google2fa_qr: { type: DataTypes.STRING, allowNull: true },
        countryName: { type: DataTypes.STRING, allowNull: true },
        cardCount: { type: DataTypes.INTEGER, allowNull: true },
        appid: { type: DataTypes.STRING, allowNull: true },
        is_kyc_approved: { type: DataTypes.ENUM({values: ['0','1']}), allowNull: true },
        kycres: { type: DataTypes.STRING, allowNull: true },
        balance_usd: { type: DataTypes.STRING, allowNull: true },
        balance_btc: { type: DataTypes.STRING, allowNull: true },
        balance_eth: { type: DataTypes.STRING, allowNull: true },
        address1: { type: DataTypes.STRING, allowNull: true },
        address2: { type: DataTypes.STRING, allowNull: true },
        city: { type: DataTypes.STRING, allowNull: true },
        state: { type: DataTypes.STRING, allowNull: true },
        pincode: { type: DataTypes.STRING, allowNull: true },
        d_country: { type: DataTypes.STRING, allowNull: true },
        inspectionId: { type: DataTypes.STRING, allowNull: true },
        deleted_at: { type: DataTypes.DATE, allowNull: true },
        urnNumber: { type: DataTypes.STRING, allowNull: true },
        jdbAccountNo1: { type: DataTypes.STRING, allowNull: true },
        jdbAccountNo2: { type: DataTypes.STRING, allowNull: true },
        is_kyc_details: { type: DataTypes.ENUM({values: ['0','1']}), allowNull: true },
        vendor_id: { type: DataTypes.INTEGER, allowNull: true },
        img_sign: { type: DataTypes.STRING, allowNull: true },
        partner_fee: { type: DataTypes.STRING, allowNull: true },
        company_name: { type: DataTypes.STRING, allowNull: true },
        card_applied: { type: DataTypes.TINYINT, allowNull: true },
        is_doc_downloaded: { type: DataTypes.TINYINT, allowNull: true },
        kyc_country: { type: DataTypes.STRING, allowNull: true },
        response_check: { type: DataTypes.STRING, allowNull: true },
    };

    const options = {
        defaultScope: {
            // exclude hash by default
            attributes: { exclude: ['hash'] }
        },
        scopes: {
            // include hash with this scope
            withHash: { attributes: {}, }
        }
    };

    return sequelize.define('admin', attributes, options);
}