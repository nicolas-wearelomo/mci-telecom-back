const { Router } = require("express");
const isAuthenticated = require("../middlewares/isAuthenticated");
const loginRouter = require("./routes/login.routes");
const verifyRoutes = require("./routes/verify.routes");
const usersRoutes = require("./routes/users.routes");
const simsRoutes = require("./routes/sims.routes");
const smsRoutes = require("./routes/sms.routes");
const ordersRoutes = require("./routes/order.routes");
const billingRoutes = require("./routes/billiing.routes");
const reportsRoutes = require("./routes/report.routes");
const recordsRoutes = require("./routes/records.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const overconsumptionRoutes = require("./routes/overconsumption.routes");
const imeiRoutes = require("./routes/imei.routes");
const router = Router();

router.use("/login", loginRouter);
router.use("/auth", isAuthenticated, verifyRoutes);
router.use("/users", isAuthenticated, usersRoutes);
router.use("/sims", isAuthenticated, simsRoutes);
router.use("/sms", isAuthenticated, smsRoutes);
router.use("/orders", isAuthenticated, ordersRoutes);
router.use("/billing", isAuthenticated, billingRoutes);
router.use("/report", isAuthenticated, reportsRoutes);
router.use("/records", isAuthenticated, recordsRoutes);
router.use("/dashboard", isAuthenticated, dashboardRoutes);
router.use("/overconsumption", isAuthenticated, overconsumptionRoutes);
router.use("/imei", isAuthenticated, imeiRoutes);
module.exports = router;
