const { Router } = require("express");
const orderController = require("../../controllers/orders.controller");

const router = Router();

router.get("/getAll", orderController.getAllOrders);

module.exports = router;
