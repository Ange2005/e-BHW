const router = require('express').Router()
const c = require('../controllers/vaccineController')
const { protect, restrictTo } = require('../utils/auth')

const staff = restrictTo('bhw', 'nurse', 'admin')
router.use(protect)
router.route('/').get(c.list).post(c.create) // residents may submit for their own residents
router.get('/:id', c.get)
router.route('/:id').put(staff, c.update).delete(staff, c.remove) // only staff change status
module.exports = router
