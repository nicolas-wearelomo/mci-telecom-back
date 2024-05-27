const prisma = require("../db");
const comparePassword = require("../utils/comparePassword");
const isValidPassword = require("../utils/isValidPassword");
const signToken = require("../utils/signToken");

const loginUser = async (req, res) => {
  try {
    const user = await prisma.auth_user.findFirst({
      where: {
        email: req.body.email,
      },
    });
    if (!user) return res.status(404).send("Usuario o contraseña incorrecto");
    const isValid = await isValidPassword(req.body.password, user.password);

    // const isValidPassword2 = await comparePassword(user.password, req.body.password);

    if (!isValid) return res.status(404).send("Usuario o contraseña incorrecto");

    const token = await signToken(user.id);

    res.status(200).send(token);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
};

module.exports = { loginUser };
