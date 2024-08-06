const dayjs = require("dayjs");
const prisma = require("../db");

const gerReports = async (req, res) => {
  let { year, month, company } = req.query;
  // console.log(dayjs().subtract(13, "month"));

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
      return { response, name: planName, commercial_group: planComercialGroup, status, mb_plan, service_provider };
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
          service_provider: el.service_provider,
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
            service_provider: el.service_provider,
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
          service_provider: curr.service_provider,
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

    //agrupamos por service_provicer y sumamos los valores

    const groupByServiceProvider = (data) => {
      const result = data.reduce((acc, item) => {
        let provider = item.service_provider;
        if (provider === "Movistar") {
          provider += item.name.toLowerCase().includes("local") ? "_local" : "_global";
        }

        if (!acc[provider]) {
          acc[provider] = {
            service_provider: provider,
            consumption_daily_data_val: 0,
            consumption_daily_sms_val: 0,
            consumption_daily_voice_val: 0,
            cantidad_sims: 0,
            cantidad_sims_activas: 0,
          };
        }

        acc[provider].consumption_daily_data_val += item.consumption_daily_data_val;
        acc[provider].consumption_daily_sms_val += item.consumption_daily_sms_val;
        acc[provider].consumption_daily_voice_val += item.consumption_daily_voice_val;
        acc[provider].cantidad_sims += item.cantidad_sims;
        acc[provider].cantidad_sims_activas += item.cantidad_sims_activas;

        return acc;
      }, {});

      return Object.values(result);
    };

    const groupedData = groupByServiceProvider(finalResult);

    const getBillings = await prisma.billing_company_summary.findMany({
      where: {
        company_id: parseInt(company),
        end_date: {
          gte: dayjs().subtract(13, "month"),
        },
      },
      select: {
        id: true,
        end_date: true,
      },
    });

    const getConsumptionBillings = async (id, date) => {
      const response = await prisma.billing_company_details.findMany({
        where: {
          summary_id: id,
        },
        select: {
          consumption_data: true,
          consumption_data_over: true,
          consumption_sms: true,
          consumption_voice: true,
          value_data: true,
          value_data_extra: true,
          value_sms: true,
          value_voice: true,
          sims_active: true,
        },
      });
      let data = {
        consumption_data: 0,
        consumption_sms: 0,
        consumption_voice: 0,
        date: dayjs(date).format("MM-YYYY"),
      };

      response.forEach((el) => {
        (data.consumption_data += el.value_data * el.sims_active + el.consumption_data_over * el.value_data_extra),
          (data.consumption_sms += el.consumption_sms * el.value_sms),
          (data.consumption_voice += el.consumption_voice * el.value_voice);
      });
      // let data = {
      //   consumption_data:
      //     response.value_data * response.sims_active + response.consumption_data_over * response.value_data_extra,
      //   consumption_sms: response.consumption_sms * response.value_sms,
      //   consumption_voice: response.consumption_voice * response.value_voice,
      //   date: dayjs(date).format("MM-YYYY"),
      // };
      return data;
    };

    // console.log(getBillings);
    const billings = await Promise.all(getBillings.map((el) => getConsumptionBillings(el.id, el.end_date)));
    const summedData = billings.reduce((acc, item) => {
      // Encontrar el índice del objeto en el acumulador con la misma fecha
      const existingIndex = acc.findIndex((accItem) => accItem.date === item.date);

      if (existingIndex !== -1) {
        // Si existe, sumar los valores
        acc[existingIndex].consumption_data += item.consumption_data;
        acc[existingIndex].consumption_sms += item.consumption_sms;
        acc[existingIndex].consumption_voice += item.consumption_voice;
      } else {
        // Si no existe, agregar un nuevo objeto al acumulador
        acc.push({ ...item });
      }

      return acc;
    }, []);

    summedData.sort((a, b) => {
      const [monthA, yearA] = a.date.split("-").map(Number);
      const [monthB, yearB] = b.date.split("-").map(Number);

      return yearA !== yearB ? yearA - yearB : monthA - monthB;
    });

    res.status(200).send({ data: finalResult, acumulado: groupedData, billings: summedData });
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
};

module.exports = { gerReports };
