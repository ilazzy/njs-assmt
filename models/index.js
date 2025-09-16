// ✅ ESModule style
import { Sequelize, DataTypes } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE,
  process.env.MYSQL_USER,
  process.env.MYSQL_PASSWORD,
  {
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT || 3306,
    dialect: "mysql",
    logging: false,
  }
);

// Import and initialize models
import UserModel from "./user.js";
import AccountModel from "./account.js";
import AccountMemberModel from "./accountmember.js";
import DestinationModel from "./destination.js";
import LogModel from "./log.js";
import RoleModel from "./role.js";

const models = {
  User: UserModel(sequelize, DataTypes),
  Account: AccountModel(sequelize, DataTypes),
  AccountMember: AccountMemberModel(sequelize, DataTypes),
  Destination: DestinationModel(sequelize, DataTypes),
  Log: LogModel(sequelize, DataTypes),
  Role: RoleModel(sequelize, DataTypes),
};

// Apply associations if defined
Object.values(models).forEach((model) => {
  if (model.associate) model.associate(models);
});

// ✅ ESModule export
export { sequelize }; // models
export default models;
