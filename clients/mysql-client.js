import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

export const createConnection = async () => {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    port: process.env.MYSQL_PORT || 3306,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });

  console.log("✅ Connected to MySQL database.");
  return connection;
};
