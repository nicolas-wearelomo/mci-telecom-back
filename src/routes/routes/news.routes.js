const { Router } = require("express");
const newsControllers = require("../../controllers/news.controller");
const isAuthenticated = require("../../middlewares/isAuthenticated");

const router = Router();

router.get("/", newsControllers.getAllNews);
router.post("/", isAuthenticated, newsControllers.createNews);
router.delete("/:id", isAuthenticated, newsControllers.deleteNews);
router.put("/:id", isAuthenticated, newsControllers.editNews);

module.exports = router;
