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
          gte: dayjs(from).toDate(),
          lte: dayjs(to).toDate(),
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

const getSimsConsumption = async (req, res) => {
  const from = `${req.query.year}-${req.query.month}-01`;
  const to = `${req.query.year}-${req.query.month}-31`;
  try {
    const response = await prisma.sim.findMany({
      where: {
        company: parseInt(6),
        service_provider: "Movistar",
        created_on: {
          lte: dayjs(to).toDate(),
        },
      },
      select: {
        serial_number: true,
        status: true,
        data_plan_id: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    const consumptionPlanPromise = async (data) => {
      const response = await prisma.data_plan.findUnique({
        where: {
          id: parseInt(data.data_plan_id),
        },
        select: {
          carrier_data_plan_carrierTocarrier: {
            select: {
              name: true,
            },
          },
          name: true,
          mb_plan: true,
        },
      });

      return {
        ...data,
        mb_contratados: response.mb_plan,
        plan: `${response?.name} | ${response?.carrier_data_plan_carrierTocarrier?.name}`,
        carrier: response?.carrier_data_plan_carrierTocarrier?.name,
      };
    };

    const consumptionPromise = async (data) => {
      const response = await prisma.sim_summary.findMany({
        where: {
          summary_icc: data.serial_number,
          summary_date: {
            gte: dayjs(from).toDate(),
            lte: dayjs(to).toDate(),
          },
        },
        select: {
          summary_icc: true,
          summary_date: true,
          consumption_daily_data_val: true,
          consumption_daily_sms_val: true,
          consumption_daily_voice_val: true,
          status_sim: true,
        },
        orderBy: {
          summary_date: "asc",
        },
      });

      return { ...data, response };
    };
    const consumptionPlan = await Promise.all(response.map((el) => consumptionPlanPromise(el)));

    const consumption = await Promise.all(consumptionPlan.map((el) => consumptionPromise(el)));

    const parsedData = consumption.map((el) => {
      let mb = 0;
      let sms = 0;
      let min = 0;
      el.response.forEach((item) => {
        mb += item.consumption_daily_data_val;
        sms += item.consumption_daily_sms_val;
        min += item.consumption_daily_voice_val;
      });
      return {
        status: el.status,
        plan: el.plan,
        carrier: el.carrier,
        sms_eviados: sms,
        minutos: min,
        mb_consumidos: mb,
        mb_contratados: el.mb_contratados,
      };
    });

    const aggregatedData = parsedData.reduce((acc, current) => {
      const existing = acc.find((item) => item.plan === current.plan);
      if (existing) {
        existing.sms_eviados += current.sms_eviados;
        existing.minutos += current.minutos;
        existing.mb_consumidos += current.mb_consumidos;
        existing.mb_contratados += current.mb_contratados;
        existing.total_sims += 1;
        existing.sims_active += current.status === "ACTIVE" ? 1 : 0;
        existing.sims_inactive += current.status === "DEACTIVATED" ? 1 : 0;
      } else {
        acc.push({ ...current, total_sims: 1, sims_active: 0, sims_inactive: 0 });
      }
      return acc;
    }, []);

    const finalData = aggregatedData.map((item) => ({
      ...item,
      mb_consumidos: item.mb_consumidos.toFixed(2),
    }));

    const dataToSend = finalData.map((el) => {
      return {
        ...el,
        consumo: `${((el.mb_consumidos * 100) / el.mb_contratados).toFixed(2)} %`,
        sms_eviados: `${el.sms_eviados} SMS`,
        minutos: `${el.minutos} MIN`,
        mb_sobreconsumo: `0 MB`,
        sims_active: `${el.sims_active}`,
        sims_inactive: `${el.sims_inactive}`,
        mb_contratados: `${el.mb_contratados} MB`,
        mb_consumidos: `${el.mb_consumidos} MB`,
        mb_disponibles: `${(el.mb_contratados - el.mb_consumidos).toFixed(2)} MB`,
      };
    });
    let total_local = 0;
    let total_global = 0;
    let active_local = 0;
    let active_global = 0;
    let inactive_local = 0;
    let inactive_global = 0;
    let activation_ready_local = 0;
    let activation_ready_global = 0;
    let test_local = 0;
    let test_global = 0;
    consumption.forEach((el) => {
      if (el.carrier.toLowerCase().includes("local")) {
        total_local += 1;
        if (el.status === "ACTIVE") {
          active_local += 1;
        } else if (el.status === "DEACTIVATED") {
          inactive_local += 1;
        } else if (el.status === "ACTIVATION_READY") {
          activation_ready_local += 1;
        } else {
          test_local += 1;
        }
      } else {
        total_global += 1;
        if (el.status === "ACTIVE") {
          active_global += 1;
        } else if (el.status === "DEACTIVATED") {
          inactive_global += 1;
        } else if (el.status === "ACTIVATION_READY") {
          activation_ready_global += 1;
        } else {
          test_global += 1;
        }
      }
    });

    res.status(200).send({
      data: dataToSend,
      status: {
        local: { active_local, inactive_local, activation_ready_local, test_local, total_local },
        global: { active_global, inactive_global, activation_ready_global, test_global, total_global },
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

module.exports = {
  getAllManufacturers,
  getAllSims,
  updateAliasSim,
  getAllSimsLegacy,
  getSimsDetail,
  getSimsConsumption,
};
