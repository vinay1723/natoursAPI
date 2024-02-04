const AppError = require('../utils/appError');

const sendErrorDev = (err, req, res) => {
  //API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  //RENDERED
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: err.message,
    stack: err.stack,
  });
};

const handleJWTError = (err) =>
  new AppError('Invalid token.please login again', 401);

const handleJWTExpiredError = (err) =>
  new AppError('Your Token has expired .please  login again', 401);

const handleCastErrorDB = (error) => {
  const message = `Invalid ${error.path}:${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldDB = (err) => {
  // const value = err.message.match(/"((?:\\.|[^"\\])*)"/)[0];
  const message = `Duplicate field value: x. Please use another value!`;
  return new AppError(message, 400);
};
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const sendErrorProd = (err, req, res) => {
  //API
  //Operational,trusted error:send message to client
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
      //Programming or other unknown error: don't leak error details
    }
    console.log('ERROR💥', err);

    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }
  //RENDERED WEBSITE
  //Operational,trusted error:send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message,
    });
    //Programming or other unknown error: don't leak error details
  }
  console.log('ERROR💥', err);

  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    message: 'Please try again later.',
  });
};

module.exports = (err, req, res, next) => {
  // console.log(err.stack);
  console.log(err);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldDB(error);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (err.name === 'JsonWebTokenError') error = handleJWTError(error);
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError(error);
    sendErrorProd(error, req, res);
  }
};
