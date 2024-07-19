const { Router } = require("express");
const recordsController = require("../../controllers/records.controller");

const router = Router();

router.get("/all", recordsController.getAllReportsByCompany);

module.exports = router;
