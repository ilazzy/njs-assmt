export default (sequelize, DataTypes) => {
  const AccountMember = sequelize.define(
    "AccountMember",
    {},
    {
      tableName: "accountmembers",
      underscored: true,
      timestamps: true,
    }
  );

  AccountMember.associate = (models) => {
    AccountMember.belongsTo(models.Account, {
      foreignKey: "account_id",
    });
    AccountMember.belongsTo(models.User, {
      foreignKey: "user_id",
    });
    AccountMember.belongsTo(models.Role, {
      foreignKey: "role_id",
    });
  };

  return AccountMember;
};
