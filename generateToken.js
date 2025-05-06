const jwt = require("jsonwebtoken");
const { faker } = require("@faker-js/faker");

// Generate random user data using Faker
function generateRandomUser(role = "user") {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  return {
    id: faker.string.uuid(),
    email: faker.internet.email({ firstName, lastName }),
    name: `${firstName} ${lastName}`,
    role,
  };
}

function generateToken(customPayload = {}) {
  const defaultPayload = generateRandomUser(customPayload.role || "admin");
  const payload = { ...defaultPayload, ...customPayload };
  const secret = process.env.JWT_SECRET || "your-secret-key";
  return jwt.sign(payload, secret, { expiresIn: "24h" });
}

// Generate tokens with random user data
const adminToken = generateToken();
console.log("\nGenerated Admin Token:");
console.log(adminToken);

const userToken = generateToken({ role: "user" });
console.log("\nGenerated User Token:");
console.log(userToken);

// Multiple random users
console.log("\nGenerating multiple random tokens:");
for (let i = 0; i < 3; i++) {
  const role = i === 0 ? "admin" : "user";
  const token = generateToken({ role });
  console.log(`\n${role.toUpperCase()} Token ${i + 1}:`);
  verifyToken(token);
}

// Verify and decode a token
function verifyToken(token) {
  try {
    const secret = process.env.JWT_SECRET || "your-secret-key";
    const decoded = jwt.verify(token, secret);
    console.log("Decoded Token:", JSON.stringify(decoded, null, 2));
    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return null;
  }
}

module.exports = { generateToken, verifyToken, generateRandomUser };
