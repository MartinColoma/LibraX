const mysql = require("mysql");

const dbLibrary = mysql.createConnection({
  host: process.env.DB_HOST || "mysql",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "hok-library",
});

dbLibrary.connect((err) => {
  if (err) throw err;
  console.log("✅ Connected to hok-library");
});

module.exports = dbLibrary;
