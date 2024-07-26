const prisma = require("../db");
const comparePassword = require("../utils/comparePassword");
const isValidPassword = require("../utils/isValidPassword");
const signToken = require("../utils/signToken");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const changePassword = require("../utils/hashPasword");

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

const forgotPassword = async (req, res) => {
  try {
    const { mail } = req.body;
    const user = await prisma.auth_user.findFirst({
      where: {
        email: mail,
      },
      select: {
        email: true,
        id: true,
      },
    });

    if (!user) {
      return res.status(404).send("Correo electrónico no existe en el sistema");
    }
    const trasnporter = nodemailer.createTransport({
      host: process.env.MAILER_HOST,
      port: process.env.MAILER_PORT,
      secure: true,
      auth: {
        user: process.env.MAILER_USER,
        pass: process.env.MAILER_PASS,
      },
    });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    const resetLink = `http://localhost:3000/login/reset-password?token=${token}`;

    const mailOptions = {
      from: process.env.MAILER_FROM, // Tu correo electrónico
      to: process.env.MAILER_DESTINITY,
      subject: "Restablecer contraseña",
      text: `Haz clic en el siguiente enlace para restablecer tu contraseña: ${resetLink}`,
    };

    trasnporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(500).send("Error al enviar el correo");
      }
      res.send("Correo enviado");
    });

    res.status(200).send();
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.query;
    const { password } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.id) {
      const response = await changePassword(password);
      await prisma.auth_user.update({
        where: {
          id: decoded.id,
        },
        data: {
          password: response,
        },
      });
    }
    res.status(200).send();
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
};

module.exports = { loginUser, forgotPassword, resetPassword };
