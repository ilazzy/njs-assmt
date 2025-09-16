"use strict";
const { createDatabase } = require("../clients/mysql-client");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // users
    await queryInterface.createTable("users", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      email: {
        type: Sequelize.STRING,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    // roles
    await queryInterface.createTable("roles", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      role_name: {
        type: Sequelize.ENUM("ADMIN", "MEMBER"), // member basically called normal user
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    // accounts
    await queryInterface.createTable("accounts", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      account_name: {
        type: Sequelize.STRING,
      },
      app_secret_token: {
        type: Sequelize.STRING,
        defaultValue: Sequelize.NOW,
      },
      website: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      updated_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
    });

    // destinations
    await queryInterface.createTable("destinations", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      URL: {
        type: Sequelize.STRING,
      },
      HTTP_method: {
        type: Sequelize.ENUM("GET", "POST", "DELETE", "PUT"),
      },
      headers: {
        type: Sequelize.JSON,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    // accountmembers
    await queryInterface.createTable("accountmembers", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      account_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "accounts",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      user_id: {
        type: Sequelize.INTEGER, 
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      role_id: {
        type: Sequelize.INTEGER, 
        allowNull: false,
        references: {
          model: "roles",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    // logs
    await queryInterface.createTable("logs", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      event_id: {
        type: Sequelize.INTEGER,
        unique: true,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      account_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "accounts",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      received_timestamp: {
        type: Sequelize.DATE,
      },
      processed_timestamp: {
        type: Sequelize.DATE,
      },
      destination_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "destinations",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      received_data: {
        type: Sequelize.JSON,
      },
      status: {
        type: Sequelize.ENUM("SUCCESS", "FAILED"),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("logs");
    await queryInterface.dropTable("accountmembers");
    await queryInterface.dropTable("roles");
    await queryInterface.dropTable("users");
    await queryInterface.dropTable("destinations");
    await queryInterface.dropTable("accounts");

    await queryInterface.sequelize.query(
      "DROP TYPE IF EXISTS `enum_destinations_HTTP_method`;"
    );
    await queryInterface.sequelize.query(
      "DROP TYPE IF EXISTS `enum_logs_status`;"
    );
  },
};
