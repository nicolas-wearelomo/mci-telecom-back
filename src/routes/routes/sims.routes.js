const { Router } = require("express");
const simsControllers = require("../../controllers/sims.controller");

const router = Router();

router.get("/manufactures", simsControllers.getAllManufacturers);

module.exports = router;
