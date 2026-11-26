const { Op } = require('sequelize')
const { Schedule, Resident, Child } = require('../models')
const { HttpError } = require('../utils/errors')
const crud = require('../utils/crud')
const { residentIds, residentScope } = require('../utils/search')
const { notifySchedule } = require('../services/notificationService')

// GET /schedules?q=name-or-ID&date=YYYY-MM-DD&category=&status=&resident=<id>
module.exports = crud(Schedule, {
  label: 'Schedule',
  include: [{ model: Resident, as: 'resident' }, { model: Child, as: 'child' }],
  order: [['date', 'ASC'], ['time', 'ASC']],
  scope: residentScope,
  filter: async ({ q, date, category, status, resident }) => ({
    ...(q && { residentRef: { [Op.in]: await residentIds(q) } }),
    ...(resident && { residentRef: resident }),
    ...(category && { category }),
    ...(status && { status }),
    ...(date && { date }),
  }),
  beforeSave: async (req, body) => {
    if (body.resident) body.residentRef = body.resident
    delete body.resident
    if ('child' in body) { body.childRef = body.child || null; delete body.child } // optional: schedule for one of the resident's children
    if (body.childRef) {
      const owner = body.residentRef ?? (await Schedule.findByPk(req.params.id))?.residentRef
      if (!(await Child.count({ where: { id: body.childRef, residentRef: owner } }))) throw new HttpError(400, 'That child does not belong to the selected resident')
    }
    if (req.method === 'POST') body.status = 'Scheduled'
  },
  afterSave: (doc, req) => notifySchedule(doc, req.method === 'POST' ? 'assigned' : 'updated'),
})
