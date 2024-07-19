const dayjs = require("dayjs");
const prisma = require("../db");

const getAllReportsByCompany = async (req, res) => {
  const from = dayjs(req.query.from).format("YYYY-MM-DD");
  const to = dayjs(req.query.to).format("YYYY-MM-DD");

  const fromDate = dayjs(from).startOf("day").toDate();
  const toDate = dayjs(to).endOf("day").toDate();

  let conditionToFind = {
    created_on: {
      gte: fromDate,
      lte: toDate,
    },
    company_id: parseInt(6),
  };

  try {
    const response = await prisma.custom_syslog.findMany({
      where: conditionToFind,
    });

    res.status(200).send(response);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
};

module.exports = { getAllReportsByCompany };
