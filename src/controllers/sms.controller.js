const dayjs = require("dayjs");
const prisma = require("../db");

const getHistorySims = async (req, res) => {
  const { serial_number } = req.query;

  try {
    const sms = await prisma.sms_sent.findMany({
      where: {
        serial_number: serial_number,
      },
      orderBy: {
        id: "desc",
      },
      take: 50,
    });
    let parsedSms = sms.map((el) => ({
      ...el,
      date: dayjs(el.sent_on).format("DD-MM-YYYY"),
    }));
    res.status(201).send(parsedSms);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
};

module.exports = { getHistorySims };
