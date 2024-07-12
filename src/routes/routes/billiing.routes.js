const { Router } = require("express");
const billingController = require("../../controllers/billing.controller");

const router = Router();

router.get("/getByCompany", billingController.getBillingByCompany);
// router.get("/getInfoPlan", orderController.getAllInfoPlan);

module.exports = router;
