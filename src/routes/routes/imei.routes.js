const { Router } = require("express");
const imeiControllers = require("../../controllers/imeiController");

const router = Router();

router.put("/updateSims", imeiControllers.changeImei);

module.exports = router;
