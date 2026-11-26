const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')

const Resident = sequelize.define('Resident', {
  residentId: { type: DataTypes.STRING(32), unique: true }, // e.g. RES-LX2K9A1B (generated)
  name: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: { msg: 'Name is required' } } },
  type: { type: DataTypes.ENUM('adult', 'pregnant'), allowNull: false },
  birthdate: { type: DataTypes.DATEONLY, allowNull: false }, // due date when pregnant
  address: DataTypes.STRING,
  contact: DataTypes.STRING,
  is4Ps: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }, // 4Ps member YES/NO
  createdBy: DataTypes.INTEGER,
}, { tableName: 'residents' })

Resident.beforeValidate((r) => {
  if (!r.residentId) r.residentId = 'RES-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 4).toUpperCase()
})

module.exports = Resident
