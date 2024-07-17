const dayjs = require("dayjs");
const prisma = require("../db");
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);

const getBillingByCompany = async (req, res) => {
  const { company, month, year, provider } = req.query;

  try {
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

    if (provider.includes("Movistar")) {
      from = `${fromYear}-${fromMonth}-25`;
      to = `${toYear}-${toMonth}-24`;
    } else {
      from = `${year}-${month}-01`;
      to = `${year}-${month}-31`;
    }

    let sims = [];

    const fromDate = dayjs(from).utc().startOf("day").toDate();

    let generalBilling = [];

    // TRAIGO LAS SIMS DE LAS COMPAÑIA

    if (provider.includes("Movistar") && provider.includes("Globales")) {
      sims = await prisma.sim.findMany({
        where: {
          company: parseInt(company),
          sim_global: "T",
          service_provider: "Movistar",
        },
        select: {
          serial_number: true,
          data_plan_id: true,
        },
      });

      generalBilling = await prisma.billing_company_summary.findMany({
        where: {
          start_date: fromDate,
          company_id: parseInt(company),
          is_global: "T",
          service_provider: "Movistar",
        },
        include: {
          billing_company_details: true,
        },
      });
    }

    if (provider.includes("Movistar") && provider.includes("Locales")) {
      sims = await prisma.sim.findMany({
        where: {
          company: parseInt(company),
          sim_global: "F",
          service_provider: "Movistar",
        },
        select: {
          serial_number: true,
          data_plan_id: true,
        },
      });

      generalBilling = await prisma.billing_company_summary.findMany({
        where: {
          start_date: fromDate,
          company_id: parseInt(company),
          is_global: "F",
          service_provider: "Movistar",
        },
        include: {
          billing_company_details: true,
        },
      });
    }

    if (provider.includes("Entel")) {
      sims = await prisma.sim.findMany({
        where: {
          company: parseInt(company),

          service_provider: "Entel",
        },
        select: {
          serial_number: true,
          data_plan_id: true,
        },
      });

      generalBilling = await prisma.billing_company_summary.findMany({
        where: {
          start_date: fromDate,
          company_id: parseInt(company),
          service_provider: "Entel",
        },
        include: {
          billing_company_details: true,
        },
      });
    }
    if (provider.includes("Tele2")) {
      sims = await prisma.sim.findMany({
        where: {
          company: parseInt(company),
          service_provider: "Tele2",
        },
        select: {
          data_plan_id: true,
          serial_number: true,
        },
      });

      generalBilling = await prisma.billing_company_summary.findMany({
        where: {
          start_date: fromDate,
          company_id: parseInt(company),
          service_provider: "Tele2",
        },
        include: {
          billing_company_details: true,
        },
      });
    }

    // < ------------------------------- >

    // TRAIGO LOS CONSUMOS DE LAS SIMS

    const consumptionPromiseRegister = async (data, data_plan_id) => {
      const response = await prisma.sim_summary.findMany({
        where: {
          summary_icc: data,
          summary_date: dayjs(to).toDate(),
        },
        select: {
          summary_icc: true,
          summary_date: true,
          consumption_monthly_data_val: true,
          consumption_monthly_sms_val: true,
          consumption_monthly_voice_val: true,
          status_sim: true,
        },
        orderBy: {
          summary_date: "asc",
        },
      });
      return { response, summary_icc: data, data_plan_id };
    };

    const promises = await Promise.all(sims.map((el) => consumptionPromiseRegister(el.serial_number, el.data_plan_id)));

    // < ----------------------------------- >

    // TRAIGO TODOS LOS PLANES Y AGRUPO TODAS LAS SIMS SEGUN SU PLAN (SACADAS DE SIM_SUMMARY)
    const planes = await prisma.data_plan.findMany({
      select: {
        id: true,
        carrier_data_plan_carrierTocarrier: { select: { name: true } },
        name: true,
        commercial_group: true,
        price: true,
        mb_extra: true,
        voice_mo: true,
        sms_mo: true,
        mb_plan: true,
      },
    });

    const discount = await prisma.discount_company.findMany({
      where: {
        company_id: parseInt(company),
      },
    });

    const sumarConsumos = (summaryIcc, data, data_plan_id) => {
      const findDataPlanName = (data_plan_id) => {
        const plan = planes.find((el) => el.id === data_plan_id);
        return plan
          ? `${plan.carrier_data_plan_carrierTocarrier.name} | ${plan.name} | ${plan.commercial_group}`
          : "Plan no encontrado";
      };
      let plan = planes.find((el) => el.id === data_plan_id);
      if (data.length) {
        return data.reduce(
          (acc, curr) => {
            acc.consumption_monthly_data_val += curr.consumption_monthly_data_val || 0;
            acc.consumption_monthly_sms_val += curr.consumption_monthly_sms_val || 0;
            acc.consumption_monthly_voice_val += curr.consumption_monthly_voice_val || 0;
            acc.status = curr.status_sim;
            return acc;
          },
          {
            data_plan: findDataPlanName(data_plan_id),
            plan_name: `${plan.name} | ${plan.carrier_data_plan_carrierTocarrier.name}`,
            commercial_group: plan.commercial_group,
            value_plan: plan.price,
            mb_extra_value: plan.mb_extra,
            voice_value: plan.voice_mo,
            sms_value: plan.sms_mo,
            plan_id: data_plan_id,
            summary_icc: summaryIcc,
            mb_plan: plan.mb_plan,
            consumption_monthly_data_val: 0,
            consumption_monthly_sms_val: 0,
            consumption_monthly_voice_val: 0,
          }
        );
      } else {
        return {
          data_plan: findDataPlanName(data_plan_id),
          plan_name: `${plan.name} | ${plan.carrier_data_plan_carrierTocarrier.name}`,
          commercial_group: plan.commercial_group,
          value_plan: plan.price,
          mb_plan: plan.mb_plan,
          mb_extra_value: plan.mb_extra,
          voice_value: plan.voice_mo,
          sms_value: plan.sms_mo,
          plan_id: data_plan_id,
          summary_icc: summaryIcc,
          consumption_monthly_data_val: 0,
          consumption_monthly_sms_val: 0,
          consumption_monthly_voice_val: 0,
        };
      }
    };

    const resultados = promises.map((promesa) => {
      return sumarConsumos(promesa.summary_icc, promesa.response, promesa.data_plan_id);
    });

    const groupedData = resultados.reduce((acc, curr) => {
      console.log(curr);
      const {
        data_plan,
        plan_id,
        summary_icc,
        consumption_monthly_data_val,
        consumption_monthly_sms_val,
        consumption_monthly_voice_val,
        value_plan,
        mb_value,
        mb_extra_value,
        sms_value,
        voice_value,
        mb_plan,
        commercial_group,
        status,
        plan_name,
      } = curr;
      if (!acc[data_plan]) {
        acc[data_plan] = {
          data_plan: data_plan,
          discount: discount.find((el) => el.plan_id === plan_id && el.company_id === parseInt(company)),
          plan_id: plan_id,
          commercial_group,
          plan_name,
          value_plan,
          mb_value,
          sms_value,
          voice_value,
          mb_extra_value,
          mb_plan,
          sims: [],
        };
      }

      acc[data_plan].sims.push({
        summary_icc,
        consumption_monthly_data_val,
        consumption_monthly_sms_val,
        consumption_monthly_voice_val,
        status: status === "ACTIVE" ? "Activado" : "Desactivado",
      });

      return acc;
    }, {});

    const result = Object.values(groupedData);

    function aggregateSimsDetail(simsDetail) {
      return simsDetail.map((plan) => {
        const {
          data_plan,
          plan_id,
          sims,
          commercial_group,
          plan_name,
          value_plan,
          mb_extra_value,
          sms_value,
          voice_value,
          mb_plan,
        } = plan;

        const consumption_monthly_data_val = sims.reduce((sum, sim) => sum + sim.consumption_monthly_data_val, 0);
        const consumption_monthly_sms_val = sims.reduce((sum, sim) => sum + sim.consumption_monthly_sms_val, 0);
        const consumption_monthly_voice_val = sims.reduce(
          (sum, sim) => sum + sim.consumption_monthly_voice_val / 60,
          0
        );
        const total_sims = sims.reduce((sum, sim) => sum + 1, 0);
        const active_sims = sims.reduce((sum, sim) => sum + (sim.consumption_monthly_data_val > 0 ? 1 : 0), 0);
        const total_value = sims.reduce((sum, sim) => sum + (sim.consumption_monthly_data_val > 0 ? value_plan : 0), 0);
        const sms_total = sims.reduce((sum, sim) => sum + sim.consumption_monthly_sms_val * sms_value, 0);
        const voice_total = sims.reduce((sum, sim) => sum + (sim.consumption_monthly_voice_val / 60) * voice_value, 0);
        const data_total = sims.reduce((sum, sim) => sum + (sim.consumption_monthly_data_val > 0 ? mb_plan : 0), 0);

        return {
          data_plan,
          plan_id,
          plan_name,
          commercial_group,
          value_plan,
          mb_extra_value,
          sms_value,
          voice_value,
          consumption_monthly_data_val,
          consumption_monthly_sms_val,
          consumption_monthly_voice_val,
          active_sims,
          total_sims,
          sims,
          total_value,
          data_total,
          sms_total,
          voice_total,
        };
      });
    }

    const aggregatedDetail = aggregateSimsDetail(result);

    // < ------------------------------- >
    // ESTA FUNCION ES PARA CONUSLTAR LA TABLA DEL RESUMEN QUE ACTUALMENTE NO ESTAMOS UTILIZANDO
    // function splitAndExpandRecords(records) {
    //   return records.flatMap((record) => {
    //     const mb_plan = record.mb_plan.split("|").filter(Boolean).length
    //       ? record.mb_plan.split("|").filter(Boolean)
    //       : [record.mb_plan];
    //     const mb = record.mb.split("|").filter(Boolean).length ? record.mb.split("|").filter(Boolean) : [record.mb];
    //     const sms = record.sms.split("|").filter(Boolean).length ? record.sms.split("|").filter(Boolean) : [record.sms];
    //     const voice = record.voice.split("|").filter(Boolean).length
    //       ? record.voice.split("|").filter(Boolean)
    //       : [record.voice];
    //     const value_plan = record.value_plan.split("|").filter(Boolean).length
    //       ? record.value_plan.split("|").filter(Boolean)
    //       : [record.value_plan];
    //     const value_over_data = record.value_over_data.split("|").filter(Boolean).length
    //       ? record.value_over_data.split("|").filter(Boolean)
    //       : [record.value_over_data];
    //     const value_sms = record.value_sms.split("|").filter(Boolean).length
    //       ? record.value_sms.split("|").filter(Boolean)
    //       : [record.value_sms];
    //     const value_voice = record.value_voice.split("|").filter(Boolean).length
    //       ? record.value_voice.split("|").filter(Boolean)
    //       : [record.value_voice];

    //     const maxLength = Math.max(
    //       mb_plan.length,
    //       mb.length,
    //       sms.length,
    //       voice.length,
    //       value_plan.length,
    //       value_over_data.length,
    //       value_sms.length,
    //       value_voice.length
    //     );

    //     const expandedRecords = [];
    //     for (let i = 0; i < maxLength; i++) {
    //       expandedRecords.push({
    //         ...record,
    //         billing_company_details: records.billing_company_details,
    //         mb_plan: mb_plan[i] || mb_plan[0],
    //         mb: mb[i] || mb[0],
    //         sms: sms[i] || sms[0],
    //         voice: voice[i] || voice[0],
    //         value_plan: value_plan[i] || value_plan[0],
    //         value_over_data: value_over_data[i] || value_over_data[0],
    //         value_sms: value_sms[i] || value_sms[0],
    //         value_voice: value_voice[i] || value_voice[0],
    //       });
    //     }
    //     return expandedRecords;
    //   });
    // }

    // const expandedBillingRecords = splitAndExpandRecords(generalBilling);
    // < ------------------------------- >

    // res.status(201).send({ simsDetail: result });
    res.status(201).send(aggregatedDetail);
  } catch (error) {
    console.log(error);
  }
};

module.exports = { getBillingByCompany };
