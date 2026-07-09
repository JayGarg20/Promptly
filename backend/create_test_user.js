const mongoose = require("mongoose");
const User = require("./models/User");
const dotenv = require("dotenv");

dotenv.config();

const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/promptly";

async function main() {
  await mongoose.connect(mongoURI);
  console.log("Connected to MongoDB");

  const email = "example@gmail.com";
  const password = "password123";

  let user = await User.findOne({ email });
  if (user) {
    console.log("User already exists, updating password...");
    user.password = password;
    await user.save();
    console.log("Password updated successfully.");
  } else {
    console.log("User does not exist, creating new user...");
    user = new User({
      name: "Test User",
      email,
      password,
    });
    await user.save();
    console.log("User created successfully.");
  }

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
