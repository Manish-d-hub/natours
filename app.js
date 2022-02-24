const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewsRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDLEWARES
// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers
// app.use(helmet());

// const scriptSrcUrls = [
//   // 'https://api.tiles.mapbox.com/',
//   'https://api.mapbox.com',
//   'https://js.stripe.com',
//   'https://cdnjs.cloudflare.com',
//   'https://cdn.jsdelivr.net',
// ];
// // const styleSrcUrls = [
// //   'https://api.mapbox.com/',
// //   'https://api.tiles.mapbox.com/',
// //   'https://fonts.googleapis.com/',
// //   'https://cdn.jsdelivr.net',
// // ];
// // const connectSrcUrls = [
// //   'https://api.mapbox.com/',
// //   'https://a.tiles.mapbox.com/',
// //   'https://b.tiles.mapbox.com/',
// //   'https://events.mapbox.com/',
// // ];
// const fontSrcUrls = [];
// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       defaultSrc: ["'self'", 'https://*.mapbox.com'],
//       baseUri: ["'self'", 'block-all-mixed-content'],
//       fontSrc: ["'self'", 'https:', 'data:'],
//       frameAnestors: ["'self'"],
//       imgSrc: ["'self'", "'blob'", "'data:'", 'https://images.unsplash.com/'],
//       objectSrc: ["'self'"],
//       scriptSrc: [
//         "'unsafe-inline'",
//         "'self'",
//         "'blob'",
//         'https://cdnjs.cloudflare.com',
//         'https://cdnjs.cloudflare.com',
//         'https://api.mapbox.com',
//         'https://js.stripe.com',
//       ],
//       scriptSrcAttr: ["'none'"],
//       styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
//       upgradeInsecureRequests: [],
//     },
//   })
// );

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

// 3) ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
