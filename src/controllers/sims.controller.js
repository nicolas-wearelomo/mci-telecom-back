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

module.exports = {
  getAllManufacturers,
};
