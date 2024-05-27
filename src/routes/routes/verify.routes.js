const { Router } = require("express");

const verifyRoutes = Router();

verifyRoutes.get("/verify", (req, res) => {
  res.status(200).send(req.user);
});

module.exports = verifyRoutes;
