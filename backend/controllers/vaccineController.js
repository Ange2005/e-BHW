const { Op } = require('sequelize')
const { VaccineRequest, Resident } = require('../models')
const crud = require('../utils/crud')
const { HttpError } = require('../utils/errors')
const { like, residentIds, residentScope } = require('../utils/search')

// GET /vaccine-requests?q=resident-or-vaccine&status=Pending
module.exports = crud(VaccineRequest, {
  label: 'Vaccine request',
  include: [{ model: Resident, as: 'resident' }],
  scope: residentScope,
  filter: async ({ q, status }) => ({
    ...(q && { [Op.or]: [{ residentRef: { [Op.in]: await residentIds(q) } }, { vaccine: like(q) }] }),
    ...(status && { status }),
  }),
  beforeSave: async (req, body) => {
    if (body.resident) body.residentRef = body.resident
    delete body.resident
    if (req.user.role !== 'resident') return
    delete body.status
    if (req.method === 'POST') {
      if (!(await Resident.count({ where: { id: body.residentRef, userId: req.user.id } }))) throw new HttpError(403, 'You can only request for your own residents')
      body.status = 'Pending'
    }
  },
})
