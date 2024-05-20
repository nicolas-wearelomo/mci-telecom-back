const { Router } = require("express");
const isAuthenticated = require("../middlewares/isAuthenticated");
const loginRouter = require("./routes/login.routes");
const newsRouter = require("./routes/news.routes");
const verifyRoutes = require("./routes/verify.routes");
const usdPriceRoutes = require("./routes/usdPrice");

const router = Router();

router.use("/login", loginRouter);
router.use("/usd", usdPriceRoutes);
router.use("/auth", isAuthenticated, verifyRoutes);
router.use("/news", newsRouter);

module.exports = router;
