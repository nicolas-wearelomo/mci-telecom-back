const dayjs = require("dayjs");
const prisma = require("../db");

const getAllManufacturers = async (req, res) => {
  try {
    const manufactures = await prisma.sim.findMany({
      where: {
        AND: [
          {
            comm_module_manufacturer: {
              not: null,
            },
          },
          {
            comm_module_manufacturer: {
              not: "",
            },
          },
        ],
      },
      select: {
        comm_module_manufacturer: true,
      },
    });

    const topTenManufactures = [];

    manufactures.forEach((el) => {
      let isCreated = topTenManufactures.find((item) => item?.name === el.comm_module_manufacturer);
      if (!isCreated) {
        topTenManufactures.push({ name: el.comm_module_manufacturer, cant: 1 });
      } else {
        isCreated.cant += 1;
      }
    });

    const topTenSortedManufactures = topTenManufactures.sort((a, b) => b.cant - a.cant).slice(0, 10);

    res.status(200).send(topTenSortedManufactures);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
};

const getAllSims = async (req, res) => {
  const { company, service_provider } = req.query;
  try {
    const response = await prisma.sim.findMany({
      where: {
        company: parseInt(company),
        service_provider: service_provider,
      },
      orderBy: {
        id: "asc",
      },
    });
    res.status(200).send(response);
  } catch (error) {
    console.log(error);
    res.status(200).send(error);
  }
};

const getAllSimsLegacy = async (req, res) => {
  const { company } = req.query;
  try {
    const response = await prisma.sim_legacy.findMany({
      where: {
        company: parseInt(company),
      },
      orderBy: {
        id: "asc",
      },
    });
    res.status(200).send(response);
  } catch (error) {
    console.log(error);
    res.status(200).send(error);
  }
};

const updateAliasSim = async (req, res) => {
  const { id } = req.query;
  try {
    const response = await prisma.sim.update({
      where: {
        id: parseInt(id),
      },
      data: {
        alias_sim: req.body.alias_sim,
      },
    });
    res.status(201).send(response);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
};
const getSimsDetail = async (req, res) => {
  const { serial_number, from, to } = req.query;

  try {
    const response = await prisma.sim_summary.findMany({
      where: {
        summary_icc: serial_number,
        summary_date: {
          gte: dayjs(from).toDate(), // gte (greater than or equal) para 'from'
          lte: dayjs(to).toDate(), // lte (less than or equal) para 'to'
        },
      },
      select: {
        summary_icc: true,
        summary_date: true,
        consumption_daily_data_val: true,
        consumption_daily_sms_val: true,
        consumption_monthly_data_val: true,
      },
      orderBy: {
        summary_date: "asc",
      },
    });

    let parsedDate = response.map((el) => {
      return { ...el, date: dayjs(el.summary_date).add(1, "day").format("DD-MM-YYYY") };
    });

    res.status(200).send(parsedDate);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
};
module.exports = {
  getAllManufacturers,
  getAllSims,
  updateAliasSim,
  getAllSimsLegacy,
  getSimsDetail,
};
