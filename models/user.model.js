const { DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");

module.exports = (sequelize) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: {
          msg: "Email sudah terdaftar",
        },
        validate: {
          notEmpty: {
            msg: "Email harus diisi",
          },
          isEmail: {
            msg: "Format email tidak valid",
          },
          len: {
            args: [1, 100],
            msg: "Email maksimal 100 karakter",
          },
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Password harus diisi",
          },
          len: {
            args: [6, 255],
            msg: "Password minimal 6 karakter",
          },
        },
      },
      role: {
        type: DataTypes.ENUM("user", "volunteer", "admin"),
        allowNull: false,
        defaultValue: "user",
        validate: {
          notEmpty: {
            msg: "Role harus diisi",
          },
          isIn: {
            args: [["user", "volunteer", "admin"]],
            msg: "Role harus berupa user, volunteer, atau admin",
          },
        },
      },
      nama_lengkap: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Nama lengkap harus diisi",
          },
          len: {
            args: [2, 100],
            msg: "Nama lengkap minimal 2 karakter dan maksimal 100 karakter",
          },
        },
      },
      telp: {
        type: DataTypes.STRING(15),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Nomor telepon harus diisi",
          },
          is: {
            args: /^[0-9+\-\s]+$/,
            msg: "Format nomor telepon tidak valid",
          },
          len: {
            args: [10, 15],
            msg: "Nomor telepon minimal 10 digit dan maksimal 15 digit",
          },
        },
      },
    },
    {
      tableName: "users",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            user.password = await bcrypt.hash(user.password, 10);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed("password")) {
            user.password = await bcrypt.hash(user.password, 10);
          }
        },
      },
    }
  );

  // Instance methods
  User.prototype.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
  };

  User.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    delete values.password;
    return values;
  };

  // Class methods
  User.associate = function (models) {
    User.hasMany(models.RiwayatToken, {
      foreignKey: "id_user",
      as: "riwayatTokens",
    });
  };

  return User;
};
