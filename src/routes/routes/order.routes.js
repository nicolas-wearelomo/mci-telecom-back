const { Router } = require("express");
const orderController = require("../../controllers/orders.controller");

const router = Router();

router.get("/getAll", orderController.getAllOrders);
router.get("/getInfoPlan", orderController.getAllInfoPlan);

module.exports = router;
