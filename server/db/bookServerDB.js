const mysql = require("mysql");

const dbBookServer = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "hok-book_server",
});

dbBookServer.connect((err) => {
  if (err) throw err;
  console.log("✅ Connected to hok-book_server");
});

module.exports = dbBookServer;
