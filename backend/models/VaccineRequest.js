const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')

module.exports = sequelize.define('VaccineRequest', {
  vaccine: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: { msg: 'Vaccine is required' } } },
  preferredDate: { type: DataTypes.DATEONLY, allowNull: false },
  remarks: DataTypes.TEXT,
  status: { type: DataTypes.ENUM('Pending', 'Approved', 'Completed'), allowNull: false, defaultValue: 'Pending' },
  createdBy: DataTypes.INTEGER,
}, { tableName: 'vaccine_requests' })
