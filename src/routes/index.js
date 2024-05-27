const { Router } = require("express");
const isAuthenticated = require("../middlewares/isAuthenticated");
const loginRouter = require("./routes/login.routes");
const newsRouter = require("./routes/news.routes");
const verifyRoutes = require("./routes/verify.routes");
const usdPriceRoutes = require("./routes/usdPrice");
const usersRoutes = require("./routes/users.routes");
const simsRoutes = require("./routes/sims.routes");
const router = Router();

router.use("/usd", usdPriceRoutes);
router.use("/auth", isAuthenticated, verifyRoutes);
router.use("/news", newsRouter);

router.use("/login", loginRouter);
router.use("/users", isAuthenticated, usersRoutes);
router.use("/sims", isAuthenticated, simsRoutes);
module.exports = router;
