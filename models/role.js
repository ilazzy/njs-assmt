export default (sequelize, DataTypes) => {
  const Role = sequelize.define(
    "Role",
    {
      role_name: {
        type: DataTypes.ENUM("ADMIN", "MEMBER"),
      },
    },
    {
      tableName: "roles",
      underscored: true,
      timestamps: true,
    }
  );

  Role.associate = (models) => {
    Role.hasMany(models.User, {
      foreignKey: "roleId",
      as: "users",
    });
    Role.hasMany(models.AccountMember, {
      foreignKey: "role_id",
    });
  };

  return Role;
};
