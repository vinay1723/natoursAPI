const express = require('express');
const viewController = require('./../controllers/viewController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

// router.get('/', (req, res, next) => {
//   res.status(200).render('base', {
//     tour: 'The forest Hiker',
//     user: 'Vinay',
//   });
// });
// router.use(authController.isLoggedin);
router
  .route('/')
  .get(
    bookingController.createBookingCheckout,
    authController.isLoggedin,
    viewController.getOverview
  );
router.route('/login').get(authController.isLoggedin, viewController.loginPage);

router
  .route('/tour/:slug')
  .get(authController.isLoggedin, viewController.getTour);
router.route('/me').get(authController.protect, viewController.getAccount);
router
  .route('/my-tours')
  .get(authController.protect, viewController.getMyTours);

module.exports = router;
