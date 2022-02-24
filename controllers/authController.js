const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');

const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Email = require('../utils/email');

const signedToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signedToken(user.id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ), // CONVERITNG THE EXPIRATION DATE TO JWT COOKIE TO ms
    httpOnly: true,
  };
  console.log(cookieOptions.expires);
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  // Remove password from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user },
  });
};

exports.signUp = catchAsync(async (req, res) => {
  const { name, email, password, passwordConfirm, role, passwordChangedAt } =
    req.body;
  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
    role,
    passwordChangedAt,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  // 1) check if email and password exist.
  if (!email || !password) {
    throw new AppError('Please provide email and password.', 400);
  }

  // 2) check if user exist and password is correct.
  const user = await User.findOne({ email }).select('+password');

  // if (!user || !(await user.correctPassword(password, user.password))) {
  //   throw new AppError('Incorrect email or password.', 401);
  // }

  if (!user) {
    throw new AppError('Incorrect email', 401);
  }
  if (!(await user.correctPassword(password, user.password))) {
    throw new AppError('password.', 401);
  }

  console.log(user);

  // 3) if everything is ok, send web token to client
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// ONLY FOR RENDERED PAGES (NO ERRORS)
exports.isLoggedIn = async (req, res, next) => {
  // 1) Getting the token and checking if it exits
  if (req.cookies.jwt) {
    try {
      // 2) Verfication token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      // console.log(decoded);

      // 3) Check if user still exists
      const currUser = await User.findById(decoded.id);
      if (!currUser) {
        return next();
        // throw new AppError('Unauthorized access: This user no longer exist', 401);
      }

      // 4) Check if user changed password after the token was issued
      if (currUser.changedPasswordAfter(decoded.iat)) {
        return next();
        // throw new AppError('Password changed: Please login again', 401);
      }

      // Grant access to protected route (there is a logged in user)
      res.locals.user = currUser;
      // req.user = currUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    // roles is an array ['admin', 'lead-guide']
    if (!roles.includes(req.user.role)) {
      throw new AppError(
        'You don not have permission to perfrom this action',
        403
      );
    }
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    throw new AppError("Couldn't find user with the given eamil address", 404);
  }

  // 2) Generate the random reset token
  const resetToken = user.createPassResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    // 3) Send it to user's email
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    new Email(user, resetURL).SendPassReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    console.log(err);
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save({ validateBeforeSave: false });

    throw new AppError(
      'There was an error in sending mail, try again later',
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1 get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpire: { $gt: Date.now() },
  });

  // 2 if token has not expired and there is user, set the new password
  if (!user) {
    throw new AppError('Token is expired or invalid', 400);
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpire = undefined;
  await user.save();

  // 3 update passwordChangedAt property for the user

  // 4 Log the user in, send JWT
  createSendToken(user, 201, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1 Get user form collection
  const currUser = await User.findById(req.user.id).select('+password');
  // 2 Check if POSTed current password is correct
  if (
    !(await currUser.correctPassword(
      req.body.passwordCurrent,
      currUser.password
    ))
  ) {
    throw new AppError('Incorrect current password', 401);
  }
  // 3 If so, update password
  currUser.password = req.body.password;
  currUser.passwordConfirm = req.body.passwordConfirm;
  await currUser.save();

  // 4 Log user in, send JWT
  createSendToken(currUser, 201, res);
});
