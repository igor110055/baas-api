process.env.PWD = process.cwd();
require("rootpath")();
const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const errorHandler = require("_middleware/error-handler");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
const basicAuth = require("express-basic-auth");
const path = require("path");
var cronJob = require("cron").CronJob;
const {
  updateAllUsersBalance,
  exportTransactions,
} = require("./API/users/user.service");
var options = {
  swaggerOptions: {
    authAction: {
      JWT: {
        name: "JWT",
        schema: {
          type: "apiKey",
          in: "header",
          name: "Authorization",
          description: "",
        },
        value: "Bearer <JWT>",
      },
    },
  },
};

app.use(
  "/api",
  basicAuth({
    authorizer: myAsyncAuthorizer,
    challenge: true,
  }),
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, options)
);

app.use(bodyParser.json({ limit: "4098mb" }));
app.use(
  bodyParser.urlencoded({
    limit: "4098mb",
    extended: true,
    parameterLimit: 50000,
  })
);
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());
app.use(cors());
app.use(
  "/public",
  express.static(path.resolve(__dirname + "/API/admin/public"))
);
function myAsyncAuthorizer(username, password) {
  const userMatches = basicAuth.safeCompare(username, `SuperAdmin`);
  const passwordMatches = basicAuth.safeCompare(password, `SuperAdmin`);

  return userMatches & passwordMatches;
}

app.use("/api/admin", require("./API/admin/admin.controller"));
app.use("/api/users", require("./API/users/users.controller"));
app.use("/api/superAdmin", require("./API/superAdmin/superAdmin.controller"));
app.use(
  "/api/applyForCard",
  require("./API/applyForcard/applyForCard.controller")
);
app.use("/api/walletAmount", require("./API/token/tokenRoute"));
// global error handler
app.use(errorHandler);

var sendTransactionMailCron = new cronJob(
  "00 20 * * *",
  async function () {
    exportTransactions("pending");
  },
  undefined,
  true,
  "GMT"
);
sendTransactionMailCron.start();
//updateAllUsersBalance()

// start server
// const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 4000;
const port = 5000;
app.listen(port, () => console.log("Server listening on port " + port));
