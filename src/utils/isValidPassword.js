const crypto = require("crypto");

function parseStoredPassword(storedPassword) {
  const [algorithm, salt, hash] = storedPassword.split("$");
  const [iterations, keylen, digest] = algorithm.replace("pbkdf2(", "").replace(")", "").split(",");
  return { iterations: parseInt(iterations), keylen: parseInt(keylen), digest, salt, hash };
}

function hashPassword(password, salt, iterations, keylen, digest) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, keylen, digest, (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey.toString("hex"));
    });
  });
}

const comparePassword = async (plainPassword, storedPassword) => {
  const { iterations, keylen, digest, salt, hash } = parseStoredPassword(storedPassword);

  const hashedPassword = await hashPassword(plainPassword, salt, iterations, keylen, digest);
  return hashedPassword === hash;
};

module.exports = comparePassword;
