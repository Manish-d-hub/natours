const express = require('express');
const reviewControllers = require('../controllers/reviewControllers');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(reviewControllers.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewControllers.setTourUserIds,
    reviewControllers.createReview
  );

router
  .route('/:id')
  .get(reviewControllers.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewControllers.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewControllers.deleteReview
  );

module.exports = router;
