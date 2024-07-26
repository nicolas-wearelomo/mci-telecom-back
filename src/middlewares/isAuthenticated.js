const jwt = require("jsonwebtoken");
const prisma = require("../db");
const exclude = require("../utils/exclude");
require("dotenv").config();

const isAuthenticated = async (req, res, next) => {
  const { id: userId } = req.query;

  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new Error();
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.id !== parseInt(userId)) {
      const user = await prisma.auth_user.findFirst({
        where: {
          id: decoded.id,
        },
      });

      const company = await prisma.company.findFirst({
        where: {
          id: user.company,
        },
        select: {
          name: true,
          client_type: true,
        },
      });

      if (!user) return res.status(401).end();
      const userWithOutPassword = exclude(
        { ...user, companyName: company.name, client_type: company.client_type },
        "password"
      );

      req.user = userWithOutPassword;
    }

    next();
  } catch (error) {
    res.status(400).send("Inicie sesion para continuar");
  }
};

module.exports = isAuthenticated;
