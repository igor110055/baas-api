require("dotenv").config();
const config = require("config.json");
const mysql = require("mysql2/promise");
const { Sequelize } = require("sequelize");
module.exports = db = {};

initialize();

async function initialize() {
  // create db if it doesn't already exist
  const database = process.env.DATABASE;
  const user = process.env.DATABASE_USER;
  const password = process.env.DATABASE_PASSWORD;
  // const connection = await mysql.createConnection({ host, port, user, password });
  // connect to db
  const sequelize = new Sequelize(database, user, password, {
    dialect: "mysql",
  });
  if (!sequelize) {
    console.log(`Connection Failed 🚫`);
  } else {
    console.log(`Connected ✅`);
  }
  // init models and add them to the exported db object
  db.User = require("../API/users/dto/user.dto")(sequelize);
  db.UserBalance = require("../API/users/dto/userBalance.dto")(sequelize);
  db.BSCFee = require("../API/users/dto/bscFee.dto")(sequelize);
  db.Partner = require("../API/admin/dto/partners.dto")(sequelize);
  db.LoadCard = require("../API/users/dto/cardLoad")(sequelize);
  db.Blocks = require("../API/token/blocks")(sequelize);

  // db.Admin = require('../API/admin/dto/admin.dto')(sequelize);

  // sync all models with database
  await sequelize.sync();
}
