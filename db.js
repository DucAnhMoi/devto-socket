const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "monorail.proxy.rlwy.net",
  port: 27666,
  user: "root",
  password: "QwONuwznVIpDzytfLRvpNImiglLtLgvi",
  database: "railway",
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL database:", err.stack);
    return;
  }
  console.log("Connected to MySQL database as id", connection.threadId);
});

module.exports = connection;
