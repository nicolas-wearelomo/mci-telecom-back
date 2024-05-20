require("dotenv").config();
const server = require("./src/app");

const { API_PORT } = process.env;

server.listen(API_PORT, async () => {
  console.info(`🚀 [Server]: Running on port ${API_PORT}`);
});
