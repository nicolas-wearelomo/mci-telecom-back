const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const cors = require("cors");
const router = require("./routes/index.js");

const server = express();

const corsOptions = {
  origin: process.env.CORS,
  credentials: true,
  optionSuccessStatus: 200,
};

server.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
server.use(bodyParser.json({ limit: "50mb" }));
server.use(cookieParser());
server.use(morgan("dev"));
server.use(cors(corsOptions));

server.use("/uploads", express.static("uploads"));
server.use("/", router);

server.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || err;
  console.error(err);
  res.status(status).send(message);
});

module.exports = server;
