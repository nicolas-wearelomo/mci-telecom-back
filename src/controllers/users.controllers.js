const prisma = require("../db");

const updateUser = async (req, res) => {
  const { first_name, last_name } = req.body;
  try {
    const user = await prisma.auth_user.update({
      where: {
        id: parseInt(req.query.id),
      },
      data: {
        first_name: first_name,
        last_name: last_name,
      },
    });

    res.status(201).send(user);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
};

module.exports = { updateUser };
