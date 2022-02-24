const express = require('express');
const authController = require('../controllers/authController');
const viewController = require('../controllers/viewsController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.get(
  '/',
  bookingController.createBookingsCheckout,
  authController.isLoggedIn,
  viewController.getOverview
);
router.get('/tours/:slug', authController.isLoggedIn, viewController.getTour);
router.get('/login', authController.isLoggedIn, viewController.loginUser);
router.get('/me', authController.protect, viewController.getAccount);

router.get('/my-tours', authController.protect, viewController.getMyTours);

router.post(
  '/submit-user-data',
  authController.protect,
  viewController.updateUserData
);

module.exports = router;

// ######################################################################
// // Allowing mapbox
// const CSP = 'Content-Security-Policy';
// const POLICY =
//   "default-src 'self' https://*.mapbox.com ;" +
//   "base-uri 'self';block-all-mixed-content;" +
//   "font-src 'self' https: data:;" +
//   "frame-ancestors 'self';" +
//   "img-src http://localhost:8000 'self' blob: data:;" +
//   "object-src 'none';" +
//   "script-src https: cdn.jsdelivr.net cdnjs.cloudflare.com api.mapbox.com 'self' blob: ;" +
//   "script-src-attr 'none';" +
//   "style-src 'self' https: 'unsafe-inline';" +
//   'upgrade-insecure-requests;';

// router.use((req, res, next) => {
//   res.setHeader(CSP, POLICY);
//   next();
// });
