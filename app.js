const path = require('path');
const express = require('express');
const cors = require('cors');
const req = require('express/lib/request');
const res = require('express/lib/response');
const rateLimiter = require('express-rate-limit');
const globalErrorHandler = require('./controllers/errorController');
const morgan = require('morgan');
const compression = require('compression');
const AppError = require('./utils/appError');
const tourRouter = require('./routers/tourRouters');
const usersRouter = require('./routers/userRouters');
const reviewRouter = require('./routers/reviewRouter');
const viewRouter = require('./routers/viewRouters');
const bookingRouter = require('./routers/bookingRoutes');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
//Serving static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
//MIDDLEWARES
//Set security HTTP headers

// Further HELMET configuration for Security Policy (CSP)
// const scriptSrcUrls = ['https://unpkg.com/', 'https://tile.openstreetmap.org'];
// const styleSrcUrls = [
//   'https://unpkg.com/',
//   'https://tile.openstreetmap.org',
//   'https://fonts.googleapis.com/',
// ];
// const connectSrcUrls = ['https://unpkg.com', 'https://tile.openstreetmap.org'];
// const fontSrcUrls = ['fonts.googleapis.com', 'fonts.gstatic.com'];

//set security http headers
// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       defaultSrc: [],
//       connectSrc: ["'self'", ...connectSrcUrls],
//       scriptSrc: ["'self'", ...scriptSrcUrls],
//       styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
//       workerSrc: ["'self'", 'blob:'],
//       objectSrc: [],
//       imgSrc: ["'self'", 'blob:', 'data:', 'https:'],
//       fontSrc: ["'self'", ...fontSrcUrls],
//     },
//   })
// );

// app.use(
//   helmet({
//     contentSecurityPolicy: false,
//   })
// );
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", 'data:', 'blob:', 'https:', 'ws:'],
        baseUri: ["'self'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        scriptSrc: [
          "'self'",
          'https:',
          'http:',
          'blob:',
          'https://*.mapbox.com',
          'https://js.stripe.com',
          'https://m.stripe.network',
          'https://*.cloudflare.com',
        ],
        frameSrc: ["'self'", 'https://js.stripe.com'],
        objectSrc: ["'none'"],
        styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
        workerSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://*.tiles.mapbox.com',
          'https://api.mapbox.com',
          'https://events.mapbox.com',
          'https://m.stripe.network',
        ],
        childSrc: ["'self'", 'blob:'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        formAction: ["'self'"],
        connectSrc: [
          "'self'",
          "'unsafe-inline'",
          'data:',
          'blob:',
          'https://*.stripe.com',
          'https://*.mapbox.com',
          'https://*.cloudflare.com/',
          'https://bundle.js:*',
          'ws://127.0.0.1:*/',
        ],
        upgradeInsecureRequests: [],
      },
    },
  })
);

// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       directives: {
//         'default-src': [
//           "'self'",
//           'https://js.stripe.com/v3/',
//           'https://cdnjs.cloudflare.com',
//         ],
//         'script-src': [
//           "'self'",
//           'https://js.stripe.com/v3/',
//           'https://cdnjs.cloudflare.com',
//         ],
//       },
//     },
//   })
// );

//Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//Limiter requests from api
const limiter = rateLimiter({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP.please try again in an hour',
});
app.use('/api', limiter);

//Body parser,reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
//Data sanitization against NoSQL query injection
app.use(mongoSanitize());
//Data sanitization against XSS
app.use(xss());

// app.use((req, res, next) => {
//   console.log('Hello from the middleware 👏👏');
//   next();
// });
//Clears the parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuality',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);
//Test middleware

// app.use('/', (req, res, next) => {
//   res.status(200).render('base');
// });

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

app.use(compression());

//ROUTES

// app.get('/api/v1/tours', getAllTours);
// app.get('/api/v1/tours/:id', getTour);
// app.post('/api/v1/tours', createTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Cant t find ${req.originalUrl} on this server!`,
  // });

  // const err = new Error(`can't find the ${req.originalUrl} on this server`);
  // err.statusCode = 400;
  // err.status = 'failed';
  next(new AppError(`Cant t find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
