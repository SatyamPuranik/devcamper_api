const express = require('express'); //To use express router we need to bring in express in this file too
const router = express.Router();
const {
  getBootcamps,
  getBootcamp,
  createBootcamp,
  updateBootcamp,
  deleteBootcamp,
  getBootcampsInRadius,
  bootcampPhotoUpload
} = require('../controllers/bootcamps');

const Bootcamp = require('../models/Bootcamp');
const advancedResults = require('../middleware/advancedResults');

// Include other resource routers
const courseRouter = require('./courses');

// we now no longer have access to app that was in server.js, we will replace app with router
// We now dont include /api/v1/bootcamps in this file, because we have linked the route (/api/v1/bootcamps) to this file in server.js. /api/v1/bootcamps is /
router
  .route('/')
  .get(advancedResults(Bootcamp, 'courses'), getBootcamps)
  .post(createBootcamp); //They take same URL so we can write like this
router
  .route('/:id')
  .get(getBootcamp)
  .put(updateBootcamp)
  .delete(deleteBootcamp);

router.route('/radius/:zipcode/:distance').get(getBootcampsInRadius);

router.route('/:id/photo').put(bootcampPhotoUpload);

// Re-route into other resource router
router.use('/:bootcampId/courses', courseRouter);

module.exports = router;
