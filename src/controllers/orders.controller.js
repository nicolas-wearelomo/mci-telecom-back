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
            stage: order.stage === 3 ? "Enviada" : "Cerrada", //ELIMINAR
            created_on: dayjs(order.created_on).format("DD-MM-YYYY"),
            modified_on: dayjs(order.modified_on).format("DD-MM-YYYY"),
            ordersData,
          };
        } else {
          return {
            ...order,
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

module.exports = { getAllOrders };
