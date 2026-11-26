const router = require('express').Router()
const c = require('../controllers/residentController')
const { protect } = require('../utils/auth')

router.use(protect) // staff see everyone; residents only their own (scoped in controller)
router.route('/').get(c.list).post(c.create)
router.route('/:id').get(c.get).put(c.update).delete(c.remove)

// the parent's own medical records
router.post('/:id/records', c.addRecord)
router.route('/:id/records/:recordId').put(c.updateRecord).delete(c.deleteRecord)

// children under the parent's profile, and their medical records
router.post('/:id/children', c.addChild)
router.route('/:id/children/:childId').put(c.updateChild).delete(c.deleteChild)
router.post('/:id/children/:childId/records', c.addRecord)
router.route('/:id/children/:childId/records/:recordId').put(c.updateRecord).delete(c.deleteRecord)

module.exports = router
