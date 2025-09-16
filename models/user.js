export default (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    email: {
      type: DataTypes.STRING,
      unique: true,
    },
    password: DataTypes.STRING,
  }, {
    tableName: "users",
    underscored: true,
    timestamps: true,
  });

  User.associate = (models) => {
    User.hasMany(models.Account, {
      foreignKey: "created_by",
      as: "createdAccounts",
    });
    User.hasMany(models.Account, {
      foreignKey: "updated_by",
      as: "updatedAccounts",
    });
    User.hasMany(models.AccountMember, {
      foreignKey: "user_id",
    });
  };

  return User;
};
