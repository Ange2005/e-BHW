const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')

module.exports = sequelize.define('Schedule', {
  childRef: DataTypes.INTEGER, // optional: the schedule is for one of the resident's children
  category: { type: DataTypes.ENUM('vaccination', 'prenatal', '4ps', 'checkup'), allowNull: false },
  service: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: { msg: 'Service details are required' } } },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  time: { type: DataTypes.STRING(5), allowNull: false, validate: { is: { args: /^\d{2}:\d{2}$/, msg: 'Time must be HH:MM' } } },
  location: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: { msg: 'Location is required' } } },
  remarks: DataTypes.TEXT,
  status: { type: DataTypes.ENUM('Scheduled', 'Completed', 'Cancelled'), allowNull: false, defaultValue: 'Scheduled' },
  createdBy: DataTypes.INTEGER,
}, { tableName: 'schedules' })
