const { Router } = require("express");
const simsControllers = require("../../controllers/sims.controller");

const router = Router();

router.get("/manufactures", simsControllers.getAllManufacturers);
router.get("/simsByCompany", simsControllers.getAllSims);

module.exports = router;
