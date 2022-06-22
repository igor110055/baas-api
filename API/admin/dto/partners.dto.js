const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        id: {type: DataTypes.INTEGER, primaryKey: true , allowNull: true},
        partner_name: { type: DataTypes.STRING, allowNull: true },
        partner_otc: { type: DataTypes.STRING, allowNull: true },
        prv_otc: { type: DataTypes.STRING, allowNull: true },
        status: { type: DataTypes.STRING, allowNull: true },
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

    return sequelize.define('partners', attributes, options);
}