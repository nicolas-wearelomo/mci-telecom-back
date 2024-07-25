const prisma = require("../db");

const getCommercialGroupByCompay = async (req, res) => {
  const { company } = req.query;

  try {
    const planes = await prisma.data_plan.findMany({
      select: { id: true, mb_plan: true },
    });

    const sims = await prisma.sim.findMany({
      where: {
        company: parseInt(company),
      },
      select: {
        commercial_group: true,
        serial_number: true,
        service_provider: true,
        data_plan_id: true,
      },
      orderBy: {
        commercial_group: "asc",
      },
    });

    const consmptionSimFunction = async (serial_number, planId) => {
      try {
        const findPlan = planes.find((el) => el.id === planId);
        const response = await prisma.sim_summary.findFirst({
          where: {
            summary_icc: serial_number,
          },
          orderBy: {
            summary_date: "desc",
          },
          select: {
            consumption_monthly_data_val: true,
            summary_icc: true,
            commercial_group: true,
          },
        });

        return { ...response, plan: findPlan };
      } catch (error) {
        console.log(error);
      }
    };

    const uniqueCommercialGroups = [...new Set(sims.map((item) => item.commercial_group))];

    const consumptionSim = await Promise.all(
      sims.map((el) => consmptionSimFunction(el.serial_number, el.data_plan_id))
    );

    res.status(200).send({ commercial_group: uniqueCommercialGroups, consumptions: consumptionSim });
  } catch (error) {
    res.status(400).send(error);
  }
};

const getOperation = async (req, res) => {
  const { company } = req.query;

  try {
    const sims = await prisma.sim.findMany({
      where: {
        company: parseInt(company),
      },
      select: {
        commercial_group: true,
        serial_number: true,
        service_provider: true,
        data_plan_id: true,
        status: true,
      },
      orderBy: {
        commercial_group: "asc",
      },
    });

    res.status(200).send(sims);
  } catch (error) {
    res.status(400).send(error);
  }
};

const getInformation = async (req, res) => {
  const { company } = req.query;

  try {
    const sims = await prisma.sim.findMany({
      where: {
        company: parseInt(company),
      },
      select: {
        country: true,
      },
      orderBy: {
        commercial_group: "asc",
      },
    });

    const countries = [
      ...new Set(
        sims.map((el) => {
          if (el.country === "AR") return "Argentina";
          else if (el.country === "UY") return "Uruguay";
          else if (el.country === "CL") return "Chile";
          else if (el.country === "PY") return "Paraguay";
          else if (el.country === "BR") return "Brasil";
        })
      ),
    ];

    res.status(200).send(countries);
  } catch (error) {
    res.status(400).send(error);
  }
};

module.exports = { getCommercialGroupByCompay, getOperation, getInformation };
