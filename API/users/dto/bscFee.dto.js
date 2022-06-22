const { DataTypes } = require("sequelize");

module.exports = model;

function model(sequelize) {
    const attributes = {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            allowNull: true,
            defaultValue: DataTypes.UUIDV4,
        },
        email: { type: DataTypes.STRING, allowNull: true },
        card_load_fee: { type: DataTypes.STRING, allowNull: true },
        bsc_token_otc_percentage: { type: DataTypes.DOUBLE, allowNull: true },
        bsc_stables_otc_per: { type: DataTypes.DOUBLE, allowNull: true },
        bsc_token_otc_options: { type: DataTypes.JSON, allowNull: true },
        bsc_stables_otc_options: { type: DataTypes.JSON, allowNull: true },
        updatedAt: { type: DataTypes.DATE, allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: true },
    };

    const options = {
        defaultScope: {
            // exclude hash by default
            attributes: { exclude: ["hash"] },
        },
        scopes: {
            // include hash with this scope
            withHash: { attributes: {} },
        },
    };

    return sequelize.define("bscFee", attributes, options);
}