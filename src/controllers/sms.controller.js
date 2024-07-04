const dayjs = require("dayjs");
const prisma = require("../db");
const { default: axios } = require("axios");

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

const getAllSmsSmart = async (req, res) => {
  const { serial_number, from, to } = req.query;
  const getIcc = await prisma.sim.findMany({
    where: {
      company: 6,
    },
    select: {
      serial_number: true,
    },
  });
  const serial_numberArray = getIcc.map((sim) => sim.serial_number);

  try {
    const sms = await prisma.sms_sent.findMany({
      where: {
        sent_on: {
          gte: dayjs(from).toDate(),
          lte: dayjs(to).toDate(),
        },
        sim_icc: { in: serial_numberArray },
      },
    });

    let smsParsed = sms.map((el) => ({ ...el, sent_on: dayjs(el.sent_on).format("DD/MM/YYYY") }));
    res.status(200).send(smsParsed);
  } catch (error) {
    console.log(error);
    res.status(200).send(error);
  }
};

const sendSmsSmart = async (req, res) => {
  const { simsSelected, message } = req.body;
  let demoSim = "89560100001241978349";
  console.log(`https://restapi7.jasper.com/rws/api/v1/devices/${demoSim}/${message}`);
  console.log(`Basic ${process.env.API_KEY_SMS_ENTEL}`);
  let data = {
    messageText: message,
  };
  try {
    const response = await axios.post(`https://restapi7.jasper.com/rws/api/v1/devices/${demoSim}/smsMessages`, data, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${process.env.API_KEY_SMS_ENTEL}`,
      },
    });

    res.status(200).send(response);
  } catch (error) {
    console.log(error);
    res.status(200).send(error);
  }
};

module.exports = { getHistorySims, getAllSmsSmart, sendSmsSmart };
