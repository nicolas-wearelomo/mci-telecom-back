const dayjs = require("dayjs");
const prisma = require("../db");

const getBillingByCompany = async (req, res) => {
  const { company, month, year } = req.query;
  let isGlobal = "true";
  let service_provider = "Movistar";
  console.log("entroo");
  try {
    if (service_provider === "Movistar" && isGlobal === "true") {
      console.log("222entroo");
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

      let from = "";
      let to = "";

      if (company === "6") {
        from = `${fromYear}-${fromMonth}-25`;
        to = `${toYear}-${toMonth}-24`;
      } else {
        from = `${year}-${month}-01`;
        to = `${year}-${month}-31`;
      }

      const movistarGlobalSims = await prisma.sim.findMany({
        where: {
          company: parseInt(company),
          sim_global: "T",
        },
        select: {
          serial_number: true,
        },
      });

      const consumptionPromiseRegister = async (data) => {
        const response = await prisma.sim_summary.findMany({
          where: {
            summary_icc: data,
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
        return { response };
      };

      const promises = await Promise.all(movistarGlobalSims.map((el) => consumptionPromiseRegister(el.serial_number)));
      console.log("Termino");
      const sumarConsumos = (data) => {
        if (data.length) {
          return data.reduce(
            (acc, curr) => {
              acc.consumption_daily_data_val += curr.consumption_daily_data_val || 0;
              acc.consumption_daily_sms_val += curr.consumption_daily_sms_val || 0;
              acc.consumption_daily_voice_val += curr.consumption_daily_voice_val || 0;
              return acc;
            },
            {
              summary_icc: data[0].summary_icc,
              consumption_daily_data_val: 0,
              consumption_daily_sms_val: 0,
              consumption_daily_voice_val: 0,
            }
          );
        }
      };
      // Crear el nuevo array con los resultados
      const resultados = promises.map((promesa) => {
        return sumarConsumos(promesa.response);
      });

      console.log(resultados);
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = { getBillingByCompany };
