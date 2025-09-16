export default (sequelize, DataTypes) => {
  const Log = sequelize.define(
    "Log",
    {
      event_id: {
        type: DataTypes.INTEGER,
        unique: true, //
        defaultValue: DataTypes.NOW, // 
        allowNull: false,
      },
      received_timestamp: DataTypes.DATE,
      processed_timestamp: DataTypes.DATE,
      received_data: DataTypes.JSON,
      status: {
        type: DataTypes.ENUM("SUCCESS", "FAILED"),
      },
    },
    {
      tableName: "logs",
      underscored: true,
      timestamps: false,
    }
  );

  Log.associate = (models) => {
    Log.belongsTo(models.Account, {
      foreignKey: "account_id",
    });
    Log.belongsTo(models.Destination, {
      foreignKey: "destination_id",
    });
  };

  return Log;
};
