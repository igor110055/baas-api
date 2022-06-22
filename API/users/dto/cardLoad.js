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
      
        quantity: { type: DataTypes.STRING, allowNull: true },
        cardLoadFee: { type: DataTypes.STRING, allowNull: true },
        firstName: { type: DataTypes.STRING, allowNull: true },
        lastName: { type: DataTypes.STRING, allowNull: true },
        otcAmount: { type: DataTypes.STRING, allowNull: true },
        prvFee: { type: DataTypes.STRING, allowNull: true },
        assetType: { type: DataTypes.STRING, allowNull: true },
        status: { type: DataTypes.STRING, allowNull: true },
        referredBy: { type: DataTypes.STRING, allowNull: true },
        userAddress: { type: DataTypes.STRING, allowNull: true },
        accountNumber: { type: DataTypes.STRING, allowNull: true },
        cardField: { type: DataTypes.STRING, allowNull: true },
        finalAmount: { type: DataTypes.STRING, allowNull: true },
        cardLoadAmount: { type: DataTypes.STRING, allowNull: true },
        partnerFee: { type: DataTypes.STRING, allowNull: true },
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

    return sequelize.define("loadcards", attributes, options);
}