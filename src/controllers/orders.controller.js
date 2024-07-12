const dayjs = require("dayjs");
const prisma = require("../db");

const getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.shipping.findMany({
      where: {
        company_id: parseInt(req.query.company),
      },
    });

    const ordersWithData = await Promise.all(
      orders.map(async (order) => {
        let ordersData = [];
        if (order.order_id !== "||") {
          let ids = order.order_id.match(/\d+/g).map(Number);
          for (const id of ids) {
            let orderPlan = await prisma.order_sim.findUnique({
              where: { id },
              select: { quantity: true, sim_size: true, data_plan: true, opertor_sim: true },
            });
            let dataPlan = await prisma.data_plan.findUnique({
              where: { id: orderPlan.data_plan },
              select: { name: true },
            });
            ordersData.push({ ...orderPlan, ...dataPlan });
          }

          return {
            ...order,
            shipping_type: order.shipping_type === 1 ? "Retiro en tienda" : "Despacho a domicilio",
            stage: order.stage === 3 ? "Enviada" : "Cerrada", //ELIMINAR
            created_on: dayjs(order.created_on).format("DD-MM-YYYY"),
            modified_on: dayjs(order.modified_on).format("DD-MM-YYYY"),
            ordersData,
          };
        } else {
          return {
            ...order,
            shipping_type: order.shipping_type === 1 ? "Retiro en tienda" : "Despacho a domicilio",
            stage: order.stage === 3 ? "Enviada" : "Cerrada", //ELIMINAR
            created_on: dayjs(order.created_on).format("DD-MM-YYYY"),
            modified_on: dayjs(order.modified_on).format("DD-MM-YYYY"),
            ordersData,
          };
        }
      })
    );

    res.status(200).send(ordersWithData);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
};

const getAllInfoPlan = async (req, res) => {
  const { company } = req.query;

  try {
    const response = await prisma.company_pool.findMany({
      where: {
        company_id: parseInt(company),
      },
      select: {
        plan_id: true,
      },
    });

    const filteredResponse = response.filter((item) => item.plan_id !== null);

    const uniquePlans = filteredResponse.filter(
      (value, index, self) => index === self.findIndex((t) => t.plan_id === value.plan_id)
    );

    const planIds = uniquePlans.map((item) => item.plan_id);

    const dataPlan = await prisma.data_plan.findMany({
      where: {
        id: {
          in: planIds,
        },
      },

      select: {
        id: true,
        name: true,
        carrier_data_plan_carrierTocarrier: {
          select: {
            name: true,
          },
        },
      },
    });

    const dataFinal = [];

    dataPlan.forEach((el) => {
      const carrierName = el.carrier_data_plan_carrierTocarrier.name;
      const plan = { planId: el.id, amount: el.name };

      let carrier = dataFinal.find((c) => c.name === carrierName);
      if (!carrier) {
        carrier = { name: carrierName, amount: [plan] };
        dataFinal.push(carrier);
      } else {
        const amountsSet = new Set(carrier.amount.map((p) => p.amount));
        if (!amountsSet.has(plan.amount)) {
          carrier.amount.push(plan);
        }
      }
    });

    const communes = await prisma.commune.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    });

    res.status(200).send({ carriers: dataFinal, communes });
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
};

const createOrder = async (req, res) => {
  try {
    console.log(req.body);
    const createOrder = async (resumen) => {
      const order = await prisma.order_sim.create({
        data: {
          user_id: req.body.createdBy,
          opertor_sim: resumen.planes,
          data_plan: resumen.id,
          quantity: `${resumen.cantidad}`,
          is_active: "T",
          created_on: new Date(),
          modified_on: new Date(),
          created_by: req.body.createdBy,
          modified_by: req.body.createdBy,
          sim_size: resumen.size === "Estándar" ? 1 : resumen.size === "Nano" ? 3 : 2,
        },
      });
      return order;
    };

    const ordersCreated = await Promise.all(req.body.resumen.map((el) => createOrder(el)));
    const ordersId = `|${ordersCreated.map((el) => `${el.id}|`)}`.replaceAll(",", "");

    const shipping = await prisma.shipping.create({
      data: {
        order_id: ordersId,
        address: req.body.shippingType === 2 ? req.body.address : "",
        number_address: req.body.shippingType === 2 ? req.body.number : "",
        country: req.body.shippingType === 2 ? "Chile" : "",
        commune: req.body.shippingType === 2 ? req.body.commune : "",
        is_active: "T",
        created_by: req.body.createdBy,
        created_on: new Date(),
        tracking_number_sent: "F",
        comments: req.body.shippingType === 2 ? req.body.comment : "",
        shipping_type: req.body.shippingType,
        contact_name: req.body.shippingType === 2 ? req.body.contactName : "",
        contact_phone_number: req.body.shippingType === 2 ? req.body.number : "",
        company_id: req.body.company,
        modified_on: new Date(),
        modified_by: req.body.createdBy,
      },
    });

    res.status(201).send(shipping);
  } catch (error) {
    res.status(400).send(error);
    console.log(error);
  }
};

module.exports = { getAllOrders, getAllInfoPlan, createOrder };
