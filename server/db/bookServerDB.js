const mysql = require("mysql");

const dbBookServer = mysql.createConnection({
  host: process.env.DB_HOST || "mysql",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "hok-book_server",
});

dbBookServer.connect((err) => {
  if (err) throw err;
  console.log("✅ Connected to hok-book_server");
});

module.exports = dbBookServer;
