const { Router } = require("express");
const usersContorllers = require("../../controllers/users.controllers");

const router = Router();

router.put("/profile", usersContorllers.updateUser);

module.exports = router;
