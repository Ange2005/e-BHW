const router = require('express').Router()
const c = require('../controllers/vaccinationController')
const { protect, restrictTo } = require('../utils/auth')

router.use(protect)
router.get('/', c.list)
router.post('/', restrictTo('bhw', 'nurse', 'admin'), c.mark)
router.delete('/:id', restrictTo('bhw', 'nurse', 'admin'), c.undo)

module.exports = router
