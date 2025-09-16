export default (sequelize, DataTypes) => {
  const Destination = sequelize.define(
    "Destination",
    {
      URL: DataTypes.STRING,
      HTTP_method: {
        type: DataTypes.ENUM("GET", "POST", "DELETE", "PUT"),
      },
      headers: DataTypes.JSON,
    },
    {
      tableName: "destinations",
      underscored: true,
      timestamps: true,
    }
  );

  Destination.associate = (models) => {
    Destination.hasMany(models.Log, {
      foreignKey: "destination_id",
    });
  };

  return Destination;
};
