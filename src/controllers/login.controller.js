const prisma = require("../db");
const comparePassword = require("../utils/comparePassword");
const signToken = require("../utils/signToken");

const loginUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        mail: req.body.user,
      },
    });
    const users = await prisma.user.findMany();

    if (!user) return res.status(404).send("Usuario o contraseña incorrecto");

    const isValidPassword = await comparePassword(user.password, req.body.password);

    if (!isValidPassword) return res.status(404).send("Usuario o contraseña incorrecto");

    const token = await signToken(user.id);

    res.status(200).send(token);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
};

module.exports = { loginUser };
