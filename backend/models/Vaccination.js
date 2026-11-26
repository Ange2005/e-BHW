const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')

// One row = one dose that was given (a child's vaccine at a milestone month). No row = not given yet.
module.exports = sequelize.define('Vaccination', {
  childRef: { type: DataTypes.INTEGER, allowNull: false },    // the child
  month: { type: DataTypes.INTEGER, allowNull: false },       // milestone: 1, 3, 6, 9
  vaccine: { type: DataTypes.STRING, allowNull: false },
  givenOn: { type: DataTypes.DATEONLY, allowNull: false },
  remarks: DataTypes.TEXT,
  givenBy: DataTypes.INTEGER,
}, { tableName: 'vaccinations', indexes: [{ unique: true, fields: ['childRef', 'month', 'vaccine'] }] })
