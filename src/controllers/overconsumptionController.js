const prisma = require("../db");

const upadteOverconsumption = async (req, res) => {
  console.log("entrooo");
  try {
    let dataToUpdate = {
      over_consumption_conf: req.body.selectedConfig,
    };
    if (req.body.selected === true) {
      dataToUpdate.email_for_alert_imei = req.body.email;
    }

    console.log(dataToUpdate);
    const updateFunction = async (id) => {
      return await prisma.sim.update({
        where: {
          id: id,
        },
        data: dataToUpdate,
      });
    };

    if (req.body.selectedSims.length) {
      const response = await Promise.all(req.body.selectedSims.map((el) => updateFunction(el.id)));
      return res.status(201).send(response);
    } else {
      return -res.status(200).send([]);
    }
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
};

module.exports = { upadteOverconsumption };
