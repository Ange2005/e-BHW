const { DataTypes } = require('sequelize')
const bcrypt = require('bcryptjs')
const { sequelize } = require('../config/db')

const User = sequelize.define('User', {
  name: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: { msg: 'Name is required' } } },
  email: {
    type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: { msg: 'Invalid email' } },
    set(v) { this.setDataValue('email', String(v).toLowerCase().trim()) },
  },
  password: { type: DataTypes.STRING, allowNull: false, validate: { len: { args: [6, 100], msg: 'Password must be at least 6 characters' } } },
  role: { type: DataTypes.ENUM('admin', 'nurse', 'bhw', 'resident'), allowNull: false, defaultValue: 'resident' },
  contact: DataTypes.STRING,
  active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: 'users',
  defaultScope: { attributes: { exclude: ['password'] } }, // password only loaded via User.scope('withPassword')
  scopes: { withPassword: { attributes: {} } },
})

User.beforeSave(async (u) => { if (u.changed('password')) u.password = await bcrypt.hash(u.password, 10) })
User.prototype.matchPassword = function (plain) { return bcrypt.compare(plain, this.password) }

module.exports = User
