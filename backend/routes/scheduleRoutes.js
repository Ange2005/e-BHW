const router = require('express').Router()
const c = require('../controllers/scheduleController')
const { protect, restrictTo } = require('../utils/auth')

const staff = restrictTo('bhw', 'nurse', 'admin')
router.use(protect)
router.get('/', c.list)
router.get('/:id', c.get)
router.post('/', staff, c.create)
router.route('/:id').put(staff, c.update).delete(staff, c.remove)

module.exports = router
