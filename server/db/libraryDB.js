const mysql = require("mysql");

const dbLibrary = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "hok-library",
});

dbLibrary.connect((err) => {
  if (err) throw err;
  console.log("✅ Connected to hok-library");
});

module.exports = dbLibrary;
