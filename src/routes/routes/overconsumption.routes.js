const { Router } = require("express");
const overconsumptionControllers = require("../../controllers/overconsumptionController");

const router = Router();

router.put("/updateSims", overconsumptionControllers.upadteOverconsumption);

module.exports = router;
