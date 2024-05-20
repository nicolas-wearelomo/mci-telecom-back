const bycrypt = require("bcrypt");

const comparePassword = async (password, candidatePassword) => {
  return await bycrypt.compare(candidatePassword, password);
};

module.exports = comparePassword;
