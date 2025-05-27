const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const RiwayatToken = sequelize.define(
    "RiwayatToken",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      id_user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "id_user harus diisi",
          },
          isInt: {
            msg: "id_user harus berupa angka",
          },
        },
        references: {
          model: "users",
          key: "id",
        },
      },
      aktivitas: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Aktivitas harus diisi",
          },
          len: {
            args: [1, 100],
            msg: "Aktivitas maksimal 100 karakter",
          },
        },
      },
      token: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Token harus diisi",
          },
        },
      },
    },
    {
      tableName: "riwayat_token",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  // Class methods
  RiwayatToken.associate = function (models) {
    RiwayatToken.belongsTo(models.User, {
      foreignKey: "id_user",
      as: "user",
    });
  };

  return RiwayatToken;
};
