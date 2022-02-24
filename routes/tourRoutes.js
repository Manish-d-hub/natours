/* eslint-disable prettier/prettier */
const express = require('express');
const tourcontrollers = require('../controllers/tourControllers');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// router.param('id', tourcontrollers.checkID);

// TOURS ROUTES
router
  .route('/top-5-cheap')
  .get(tourcontrollers.aliasTopTours, tourcontrollers.getAllTours);

router.route('/tour-stats').get(tourcontrollers.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourcontrollers.getMonthlyPlan
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourcontrollers.getToursWithin);

router
  .route('/')
  .get(tourcontrollers.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourcontrollers.createTour
  );

router.route('/distances/:latlng/unit/:unit').get(tourcontrollers.getDistances);

router
  .route('/:id')
  .get(tourcontrollers.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourcontrollers.uploadTourImages,
    tourcontrollers.resizeTourImages,
    tourcontrollers.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourcontrollers.deleteTour
  );

router.use('/:tourId/reviews', reviewRouter);

module.exports = router;
