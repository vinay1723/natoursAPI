const express = require('express');
const tourControllers = require('../controllers/tourController');
const req = require('express/lib/request');
const res = require('express/lib/response');
const router = express.Router();
const authController = require('./../controllers/authController');
const reviewRouter = require('./reviewRouter');
// const reviewController = require('./../controllers/reviewController');
// router.param('id', tourControllers.checkID);
// router
// .route('/:tourId/reviews')
// .post(
//   authController.protect,
//   authController.restrictTo('user'),
//   reviewController.createReview
// );
//NESTED ROUTE FOR WHICH WE HAVE TO USE MERGE PARAMS
router.use('/:tourId/reviews', reviewRouter);

router
  .route('/top-5-cheap')
  .get(tourControllers.aliasTopTours, tourControllers.getAllTours);

router.route('/tour-stats').get(tourControllers.getTourStats);

router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourControllers.getMonthlyPlan
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourControllers.getToursWithin);
// /tours-distance?distance=233&center=-40,45&unit=mi
// /tours-distance/233/center/-40,45/unit/mi

router.route('/distances/:latlng/unit/:unit').get(tourControllers.getDistance);

router
  .route('/')
  .get(tourControllers.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourControllers.createTour
  );

router
  .route('/:id')
  .get(tourControllers.getTour)
  .patch(
    authController.restrictTo('admin', 'lead-guide'),
    tourControllers.uploadTourImages,
    tourControllers.resizeTourImages,
    tourControllers.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourControllers.deleteTour
  );

module.exports = router;
