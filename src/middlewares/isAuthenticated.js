const jwt = require("jsonwebtoken");
require("dotenv").config();

const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");

    jwt.verify(token, process.env.JWT_SECRET);

    next();
  } catch (error) {
    res.status(401).send("Inicie sesion para continuar");
  }
};

module.exports = isAuthenticated;
