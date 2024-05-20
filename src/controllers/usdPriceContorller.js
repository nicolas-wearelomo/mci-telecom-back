const axios = require("axios");

const getUsdPrice = async (req, res) => {
  try {
    const usd_price = await axios.get("https://api.bluelytics.com.ar/v2/latest");
    res.status(200).send(usd_price.data);
  } catch (error) {
    console.log(error);
  }
};

module.exports = { getUsdPrice };
