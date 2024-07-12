const { Router } = require("express");
const isAuthenticated = require("../middlewares/isAuthenticated");
const loginRouter = require("./routes/login.routes");
const verifyRoutes = require("./routes/verify.routes");
const usersRoutes = require("./routes/users.routes");
const simsRoutes = require("./routes/sims.routes");
const smsRoutes = require("./routes/sms.routes");
const ordersRoutes = require("./routes/order.routes");
const billingRoutes = require("./routes/billiing.routes");
const router = Router();

router.use("/login", loginRouter);
router.use("/auth", isAuthenticated, verifyRoutes);
router.use("/users", isAuthenticated, usersRoutes);
router.use("/sims", isAuthenticated, simsRoutes);
router.use("/sms", isAuthenticated, smsRoutes);
router.use("/orders", isAuthenticated, ordersRoutes);
router.use("/billing", isAuthenticated, billingRoutes);
module.exports = router;
