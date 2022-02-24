/* eslint-disable prettier/prettier */
const express = require('express');

const usercontrollers = require('../controllers/userControllers');
const authController = require('../controllers/authController');

const router = express.Router();

// USERS ROUTES
router.post('/signup', authController.signUp);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// protect all routes after this middleware
router.use(authController.protect);

router.patch('/updatePassword', authController.updatePassword);
router.get('/me', usercontrollers.getMe, usercontrollers.getUser);
router.patch(
  '/updateMe',
  usercontrollers.uploadUserPhoto,
  usercontrollers.resizeUserPhoto,
  usercontrollers.updateMe
);
router.delete('/deleteMe', authController.protect, usercontrollers.deleteMe);

router.use(authController.restrictTo('adimin'));

router
  .route('/')
  .get(usercontrollers.getAllUsers)
  .post(usercontrollers.createUser);

router
  .route('/:id')
  .get(usercontrollers.getUser)
  .patch(usercontrollers.updateUser)
  .delete(usercontrollers.deleteUser);

module.exports = router;
