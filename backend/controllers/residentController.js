const { Op } = require('sequelize')
const { Resident, Child, MedicalRecord } = require('../models')
const crud = require('../utils/crud')
const { HttpError, asyncHandler } = require('../utils/errors')
const { like } = require('../utils/search')

const ownScope = (req) => (req.user.role === 'resident' ? { userId: req.user.id } : {})

// A resident profile = the parent. Children are nested under it, each with their own records.
const rec = { model: MedicalRecord, as: 'records' }
const include = [
  { ...rec, required: false, where: { childRef: null } }, // the parent's own records only
  { model: Child, as: 'children', include: [rec] },
]
const order = [
  ['name', 'ASC'],
  [{ model: MedicalRecord, as: 'records' }, 'date', 'DESC'],
  [{ model: Child, as: 'children' }, 'birthdate', 'ASC'],
  [{ model: Child, as: 'children' }, { model: MedicalRecord, as: 'records' }, 'date', 'DESC'],
]

const base = crud(Resident, {
  label: 'Resident',
  include,
  order,
  scope: ownScope,
  // GET /residents?q=name-or-ID-or-child-name&type=adult|pregnant&is4Ps=true|false&from=YYYY-MM-DD&to=YYYY-MM-DD
  filter: async ({ q, type, is4Ps, from, to }) => ({
    ...(q && {
      [Op.or]: [
        { name: like(q) }, { residentId: like(q) },
        { id: { [Op.in]: (await Child.findAll({ where: { name: like(q) }, attributes: ['residentRef'] })).map((c) => c.residentRef) } },
      ],
    }),
    ...(type && { type }),
    ...(is4Ps && { is4Ps: is4Ps === 'true' }),
    ...((from || to) && { createdAt: { ...(from && { [Op.gte]: new Date(from) }), ...(to && { [Op.lte]: new Date(`${to}T23:59:59`) }) } }),
  }),
  beforeSave: async (req, body) => {
    delete body.records; delete body.children; delete body.residentId // managed elsewhere
    if (req.user.role === 'resident') {
      // Membership is verified and maintained by staff.
      for (const key of Object.keys(body)) {
        if (!['name', 'contact', 'address', 'type', 'birthdate'].includes(key)) delete body[key]
      }
      body.userId = req.user.id
      if (req.method === 'POST' && (await Resident.count({ where: { userId: req.user.id } }))) throw new HttpError(409, 'You already have a profile. Edit it instead.')
    }
  },
})

// Residents edit their profile; they can't delete it. (Staff can — children and records go with it.)
const remove = asyncHandler(async (req, res, next) => {
  if (req.user.role === 'resident') throw new HttpError(403, 'You can’t delete your own profile. Edit it instead.')
  return base.remove(req, res, next)
})

// ----- helpers: the parent profile (scoped), and one of their children -----
const findResident = async (req) => {
  const r = await Resident.findOne({ where: { [Op.and]: [{ id: req.params.id }, ownScope(req)] } })
  if (!r) throw new HttpError(404, 'Resident not found')
  return r
}
const findChild = async (resident, id) => {
  const c = await Child.findOne({ where: { id, residentRef: resident.id } })
  if (!c) throw new HttpError(404, 'Child not found')
  return c
}

// ----- children under a parent profile -----
const childFields = (b) => ({ name: b.name, birthdate: b.birthdate })
const addChild = asyncHandler(async (req, res) => {
  const r = await findResident(req)
  res.status(201).json(await Child.create({ ...childFields(req.body), residentRef: r.id, createdBy: req.user.id }))
})
const updateChild = asyncHandler(async (req, res) => {
  const r = await findResident(req)
  res.json(await (await findChild(r, req.params.childId)).update(childFields(req.body)))
})
const deleteChild = asyncHandler(async (req, res) => {
  const r = await findResident(req)
  await (await findChild(r, req.params.childId)).destroy() // their records, schedules and vaccinations are removed too
  res.json({ message: 'Child removed' })
})

// ----- medical records: for the parent (/:id/records) or a child (/:id/children/:childId/records) -----
const FIELDS = ['date', 'weight', 'height', 'bp', 'condition', 'medication', 'notes']
const pick = (b, req) => Object.fromEntries((req.user.role === 'resident' ? ['date','weight','height','notes'] : FIELDS).filter((k) => k in b).map((k) => [k, b[k] === '' ? null : b[k]]))
const target = async (req) => {
  const resident = await findResident(req)
  const child = req.params.childId ? await findChild(resident, req.params.childId) : null
  return { resident, child, where: { residentRef: resident.id, childRef: child ? child.id : null } }
}
const list = (where) => MedicalRecord.findAll({ where, order: [['date', 'DESC']] })
const findRecord = async (where, id) => {
  const r = await MedicalRecord.findOne({ where: { ...where, id } })
  if (!r) throw new HttpError(404, 'Record not found')
  return r
}

const addRecord = asyncHandler(async (req, res) => {
  const { resident, child, where } = await target(req)
  await MedicalRecord.create({ ...pick(req.body, req), residentRef: resident.id, childRef: child ? child.id : null, updatedBy: req.user.id })
  res.status(201).json(await list(where))
})
const updateRecord = asyncHandler(async (req, res) => {
  const { where } = await target(req)
  await (await findRecord(where, req.params.recordId)).update({ ...pick(req.body, req), updatedBy: req.user.id })
  res.json(await list(where))
})
const deleteRecord = asyncHandler(async (req, res) => {
  const { where } = await target(req)
  await (await findRecord(where, req.params.recordId)).destroy()
  res.json(await list(where))
})

module.exports = { ...base, remove, addChild, updateChild, deleteChild, addRecord, updateRecord, deleteRecord }
