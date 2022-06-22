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
    userAddress: { type: DataTypes.STRING, allowNull: true },
    btcb: { type: DataTypes.DOUBLE, allowNull: true },
    eth: { type: DataTypes.DOUBLE, allowNull: true },
    busd: { type: DataTypes.DOUBLE, allowNull: true },
    bnb: { type: DataTypes.DOUBLE, allowNull: true },
    USDC:{ type: DataTypes.DOUBLE, allowNull: true },
    Cake:{ type: DataTypes.DOUBLE, allowNull: true },
    XVS:{ type: DataTypes.DOUBLE, allowNull: true },
    ALPACA:{ type: DataTypes.DOUBLE, allowNull: true },
    EPS:{ type: DataTypes.DOUBLE, allowNull: true },
    MDX:{ type: DataTypes.DOUBLE, allowNull: true },
    AUTO:{ type: DataTypes.DOUBLE, allowNull: true },
    MBOX:{ type: DataTypes.DOUBLE, allowNull: true },
    USDT:{ type: DataTypes.DOUBLE, allowNull: true },
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

  return sequelize.define("balances", attributes, options);
}
