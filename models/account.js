export default (sequelize, DataTypes) => {
  const Account = sequelize.define(
    "Account",
    {
      account_name: DataTypes.STRING,
      app_secret_token: {
        type: DataTypes.STRING,
        defaultValue: DataTypes.NOW,
      },
      website: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "accounts",
      underscored: true,
      timestamps: true,
    }
  );

  Account.associate = (models) => {
    Account.belongsTo(models.User, {
      foreignKey: "created_by",
      as: "creator",
    });
    Account.belongsTo(models.User, {
      foreignKey: "updated_by",
      as: "updater",
    });

    Account.hasMany(models.AccountMember, {
      foreignKey: "account_id",
    });

    Account.hasMany(models.Log, {
      foreignKey: "account_id",
    });
  };

  return Account;
};
