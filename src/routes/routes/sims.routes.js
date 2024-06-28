const { Router } = require("express");
const simsControllers = require("../../controllers/sims.controller");

const router = Router();

router.get("/manufactures", simsControllers.getAllManufacturers);
router.get("/simsByCompany", simsControllers.getAllSims);
router.get("/simsLegacy", simsControllers.getAllSimsLegacy);
router.get("/detail", simsControllers.getSimsDetail);
router.get("/consumption", simsControllers.getSimsConsumption);

router.put("/updateAlias", simsControllers.updateAliasSim);

module.exports = router;
