const { Router } = require("express");

const verifyRoutes = Router();

verifyRoutes.get("/verify", (req, res) => {
  res.status(200).send("valid Token");
});

module.exports = verifyRoutes;
