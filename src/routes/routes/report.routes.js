const { Router } = require("express");
const reportController = require("../../controllers/report.controller");

const router = Router();

router.get("/generalReport", reportController.gerReports);

module.exports = router;
