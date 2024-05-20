const prisma = require("../db");

const createNews = async (req, res) => {
  try {
    const response = await prisma.news.create({
      data: { ...req.body, createdAt: new Date(), status: true },
    });
    res.status(201).send(response);
  } catch (error) {
    res.status(400).send(error);
  }
};

const deleteNews = async (req, res) => {
  let state = true;
  if (req.query.state === "false") {
    state = false;
  }
  try {
    const response = await prisma.news.update({
      where: { id: parseInt(req.params.id) },
      data: {
        status: state,
      },
    });
    res.status(201).send(response);
  } catch (error) {
    res.status(400).send(error);
  }
};

const editNews = async (req, res) => {
  try {
    const response = await prisma.news.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.status(201).send(response);
  } catch (error) {
    res.status(400).send(error);
  }
};

const getAllNews = async (req, res) => {
  try {
    const users = await prisma.sim.findMany({
      where: {
        service_provider: "Movistar",
        company: 250,
      },
    });
    res.status(200).send(users);
  } catch (error) {
    res.status(400).send(error);
    console.log(error);
  }
};

module.exports = { createNews, getAllNews, deleteNews, editNews };
