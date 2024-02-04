const express = require('express');
//mergeParams:true indicates that inorder to access the tour id in tour router router.use('/:tourId/reviews', reviewRouter); we can access the parametrs in tour router which is parent router this concept is called nested routing.
const router = express.Router({ mergeParams: true });
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(authController.restrictTo('admin'), reviewController.updateReview)
  .delete(authController.restrictTo('admin'), reviewController.delete);
module.exports = router;
