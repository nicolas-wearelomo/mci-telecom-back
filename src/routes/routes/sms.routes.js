const { Router } = require("express");
const smsControllers = require("../../controllers/sms.controller");

const router = Router();

router.get("/history", smsControllers.getHistorySims);
router.get("/smart", smsControllers.getAllSmsSmart);
router.post("/new-sms-smart", smsControllers.sendSmsSmart);

module.exports = router;
