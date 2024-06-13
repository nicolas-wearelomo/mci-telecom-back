const { Router } = require("express");
const smsControllers = require("../../controllers/sms.controller");

const router = Router();

router.get("/history", smsControllers.getHistorySims);

module.exports = router;
