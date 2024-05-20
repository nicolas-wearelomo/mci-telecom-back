const jwt = require("jsonwebtoken");
require("dotenv").config();

const signToken = async (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: 86400 });
};

module.exports = signToken;
