const { Op } = require('sequelize')
const { Resident, Child, Vaccination, Notification } = require('../models')
const PROGRAM = require('../config/vaccinationProgram')
const { addMonths, ageInMonths, daysBetween, todayStr } = require('../utils/date')
const { HttpError, asyncHandler } = require('../utils/errors')

const statusOf = (days) => (days < 0 ? 'overdue' : days <= 14 ? 'soon' : 'upcoming') // soon = within 14 days

// GET /api/vaccinations — every child with their vaccination program, due dates and status.
// A resident gets only the children under their own profile; BHW / nurse / admin get all children.
exports.list = asyncHandler(async (req, res) => {
  const parent = { model: Resident, as: 'parent', ...(req.user.role === 'resident' && { where: { userId: req.user.id } }) }
  const children = await Child.findAll({ include: [parent], order: [['name', 'ASC']] })
  const given = children.length ? await Vaccination.findAll({ where: { childRef: { [Op.in]: children.map((c) => c.id) } } }) : []
  const today = todayStr()

  res.json(children.map((c) => ({
    _id: c.id, name: c.name, birthdate: c.birthdate, is4Ps: c.parent.is4Ps, parent: c.parent.name,
    ageMonths: ageInMonths(c.birthdate, today),
    schedule: PROGRAM.map((step) => {
      const dueDate = addMonths(c.birthdate, step.month)
      const daysUntil = daysBetween(today, dueDate)
      const vaccines = step.vaccines.map((name) => {
        const rec = given.find((g) => g.childRef === c.id && g.month === step.month && g.vaccine === name)
        return { name, status: rec ? 'done' : statusOf(daysUntil), recordId: rec?.id ?? null, givenOn: rec?.givenOn ?? null }
      })
      return { month: step.month, dueDate, daysUntil, status: vaccines.every((v) => v.status === 'done') ? 'done' : statusOf(daysUntil), vaccines }
    }),
  })))
})

// POST /api/vaccinations { childRef, month, vaccines: [names], givenOn? } — staff record doses as given.
exports.mark = asyncHandler(async (req, res) => {
  const { childRef, month, vaccines, givenOn } = req.body
  const child = await Child.findByPk(childRef, { include: [{ model: Resident, as: 'parent' }] })
  if (!child) throw new HttpError(404, 'Child not found')
  const step = PROGRAM.find((s) => s.month === Number(month))
  if (!step) throw new HttpError(400, 'Unknown vaccination month')
  const names = (Array.isArray(vaccines) ? vaccines : []).filter((v) => step.vaccines.includes(v))
  if (!names.length) throw new HttpError(400, 'Choose at least one vaccine from this schedule')

  const date = givenOn || todayStr()
  for (const vaccine of names) {
    await Vaccination.findOrCreate({ where: { childRef: child.id, month: step.month, vaccine }, defaults: { givenOn: date, givenBy: req.user.id } })
  }
  if (child.parent.userId) {
    await Notification.create({ userId: child.parent.userId, type: 'schedule', message: `${child.name}: ${names.join(', ')} (${step.month}-month vaccines) recorded as given on ${date}.` })
  }
  res.status(201).json({ message: 'Saved' })
})

// DELETE /api/vaccinations/:id — undo a wrongly recorded dose.
exports.undo = asyncHandler(async (req, res) => {
  const v = await Vaccination.findByPk(req.params.id)
  if (!v) throw new HttpError(404, 'Record not found')
  await v.destroy()
  res.json({ message: 'Removed' })
})
