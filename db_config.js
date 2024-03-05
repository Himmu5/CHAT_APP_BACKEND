const mongoose = require("mongoose")
require("dotenv").config();

main().catch((err) => console.log(err));
main().then((s) => console.log("Db connected"));

async function main() {
  await mongoose.connect(process.env.DB_URL);
}