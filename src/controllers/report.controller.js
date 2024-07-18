const dayjs = require("dayjs");
const prisma = require("../db");

const gerReports = async (req, res) => {
  let { year, month, company } = req.query;
  console.log(req.query);

  let fromYear = year;
  let fromMonth = month;
  let toYear = year;
  let toMonth = month;

  fromYear = parseInt(fromYear);
  fromMonth = parseInt(fromMonth);

  if (month === "01") {
    fromYear -= 1;
    fromMonth = 12;
  } else {
    fromMonth -= 1;
  }

  fromMonth = fromMonth < 10 ? `0${fromMonth}` : fromMonth;

  let movistarDatefrom = `${fromYear}-${fromMonth}-25`;
  let movistarDateTo = `${toYear}-${toMonth}-24`;
  let entelTel2DateFrom = `${year}-${month}-01`;
  let entelTel2DateTo = `${year}-${month}-31`;

  try {
    const movistarSims = await prisma.sim.findMany({
      where: {
        service_provider: "Movistar",
        activation_date: {
          lte: dayjs(movistarDateTo).toDate(),
        },
        company: parseInt(company),
      },
      select: {
        serial_number: true,
        data_plan_id: true,
        service_provider: true,
        status: true,
      },
    });
    const entelSims = await prisma.sim.findMany({
      where: {
        service_provider: "Entel",
        activation_date: {
          lte: dayjs(entelTel2DateTo).toDate(),
        },
        company: parseInt(company),
      },
      select: {
        serial_number: true,
        data_plan_id: true,
        service_provider: true,
        status: true,
      },
    });
    const tele2Sims = await prisma.sim.findMany({
      where: {
        service_provider: "Tele2",
        activation_date: {
          lte: dayjs(entelTel2DateTo).toDate(),
        },
        company: parseInt(company),
      },
      select: {
        serial_number: true,
        data_plan_id: true,
        service_provider: true,
        status: true,
      },
    });

    // UNIFICAMOS TODAS LAS SIMS
    let unificatedSims = [...movistarSims, ...entelSims, ...tele2Sims];

    // TREAMOS TODOS LOS PLANES QUE EXISTEN
    const planes = await prisma.data_plan.findMany({
      select: {
        id: true,
        name: true,
        carrier_data_plan_carrierTocarrier: {
          select: {
            name: true,
          },
        },
        commercial_group: true,
        mb_plan: true,
      },
    });

    //FUNCION PARA TEAER EL CONSUMO DE LAS SIMS
    const consumptionSimsFunction = async ({ serial_number, data_plan_id, service_provider, status }) => {
      let asociatedPlan = planes.find((el) => el.id === data_plan_id);

      let planName = `${asociatedPlan.carrier_data_plan_carrierTocarrier.name} | ${asociatedPlan.name}`;
      let planComercialGroup = `${asociatedPlan.commercial_group}`;
      let mb_plan = asociatedPlan.mb_plan;
      const response = await prisma.sim_summary.findMany({
        where: {
          summary_icc: serial_number,
          summary_date: {
            gte: service_provider === "Movistar" ? dayjs(movistarDatefrom).toDate() : dayjs(entelTel2DateFrom).toDate(),
            lte: service_provider === "Movistar" ? dayjs(movistarDateTo).toDate() : dayjs(entelTel2DateTo).toDate(),
          },
        },
        select: {
          consumption_daily_data_val: true,
          consumption_daily_sms_val: true,
          consumption_daily_voice_val: true,
        },
      });
      return { response, name: planName, commercial_group: planComercialGroup, status, mb_plan };
    };

    const consumptionSims = await Promise.all(
      unificatedSims.map((el) =>
        consumptionSimsFunction({
          serial_number: el.serial_number,
          data_plan_id: el.data_plan_id,
          service_provider: el.service_provider,
          status: el.status,
          mb_plan: el.mb_plan,
        })
      )
    );

    //SUMAMOS LOS CONSUMOS DE CADA SIM

    const consumptionSimsResult = consumptionSims.map((el) => {
      if (!el.response.length) {
        return {
          mb_plan: el.mb_plan,
          name: el.name,
          commercial_group: el.commercial_group,
          status: el.status,
          consumption_daily_data_val: 0,
          consumption_daily_sms_val: 0,
          consumption_daily_voice_val: 0,
        };
      } else {
        return el.response.reduce(
          (acc, curr) => {
            acc.consumption_daily_data_val += curr.consumption_daily_data_val || 0;
            acc.consumption_daily_sms_val += curr.consumption_daily_sms_val || 0;
            acc.consumption_daily_voice_val += curr.consumption_daily_voice_val || 0;

            return acc;
          },
          {
            name: el.name,
            mb_plan: el.mb_plan,
            commercial_group: el.commercial_group,
            status: el.status,
            consumption_daily_data_val: 0,
            consumption_daily_sms_val: 0,
            consumption_daily_voice_val: 0,
          }
        );
      }
    });

    //AGRUPAMOS LAS SIMS POR NAME Y COMERCIAL GOUP

    const groupedResults = consumptionSimsResult.reduce((acc, curr) => {
      const key = `${curr.name}-${curr.commercial_group}`;
      if (!acc[key]) {
        acc[key] = {
          name: curr.name,
          mb_plan: curr.mb_plan,
          commercial_group: curr.commercial_group,
          consumption_daily_data_val: 0,
          consumption_daily_sms_val: 0,
          consumption_daily_voice_val: 0,
          cantidad_sims: 0,
          cantidad_sims_activas: 0,
        };
      }

      acc[key].consumption_daily_data_val += curr.consumption_daily_data_val;
      acc[key].consumption_daily_sms_val += curr.consumption_daily_sms_val;
      acc[key].consumption_daily_voice_val += curr.consumption_daily_voice_val;
      acc[key].cantidad_sims += 1;
      if (curr.status === "ACTIVE") {
        acc[key].cantidad_sims_activas += 1;
      }

      return acc;
    }, {});

    const finalResult = Object.values(groupedResults);

    res.status(200).send(finalResult);
  } catch (error) {}
};

module.exports = { gerReports };
