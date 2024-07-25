const { Router } = require("express");
const dashboardControllers = require("../../controllers/dashborads.controller");

const router = Router();

router.get("/commercialGroup", dashboardControllers.getCommercialGroupByCompay);
router.get("/operation", dashboardControllers.getOperation);
router.get("/information", dashboardControllers.getInformation);

module.exports = router;
