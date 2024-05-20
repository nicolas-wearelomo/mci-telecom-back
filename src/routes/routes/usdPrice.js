const { Router } = require("express");
const usdPriceController = require("../../controllers/usdPriceContorller");

const router = Router();
router.get("/", usdPriceController.getUsdPrice);

module.exports = router;
