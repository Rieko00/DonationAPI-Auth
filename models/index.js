const { Sequelize } = require("sequelize");
const dbConfig = require("../config/db.config.js");

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  port: dbConfig.DB_PORT,
  dialect: dbConfig.dialect,
  pool: dbConfig.pool,
  logging: false, // Set to console.log to see SQL queries
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.User = require("./user.model.js")(sequelize);
db.RiwayatToken = require("./riwayat_token.model.js")(sequelize);

// Setup associations
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
