const crypto = require("crypto");

function generateSalt(length = 16) {
  return crypto.randomBytes(length).toString("hex");
}

function hashPassword(password, salt, iterations, keylen, digest) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, keylen, digest, (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey.toString("hex"));
    });
  });
}

async function changePassword(newPassword) {
  const iterations = 1000;
  const keylen = 20;
  const digest = "sha512";
  const salt = generateSalt(8);
  const hashedPassword = await hashPassword(newPassword, salt, iterations, keylen, digest);

  const storedPassword = `pbkdf2(${iterations},${keylen},${digest})$${salt}$${hashedPassword}`;

  return storedPassword;
}

module.exports = changePassword;
