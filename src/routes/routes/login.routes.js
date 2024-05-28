const { Router } = require("express");
const { loginUser, forgotPassword, resetPassword } = require("../../controllers/login.controller");

const loginRouter = Router();

loginRouter.post("/", loginUser);
loginRouter.post("/forgot-password", forgotPassword);
loginRouter.post("/reset-password", resetPassword);

module.exports = loginRouter;
