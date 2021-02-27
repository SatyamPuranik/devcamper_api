// Custom error middleware

const ErrorResponse = require('../utilis/errorResponse');

const errorHandler = (error, req, res, next) => {
  let err = { ...error }; //We are creating a new object err which will be the copy of error object
  err.message = error.message;

  // Log to console for dev
  console.log(error.stack.red);

  // Mongoose bad ObjectId
  // console.log(error.name);
  if (error.name === 'CastError') {
    const message = `Resource not found with id of ${error.value}`;
    err = new ErrorResponse(message, 404);
    //We are sending error response from here rather than from catch if error.name is CastError
  }

  // Mongoose duplicate key
  if ((err.code = 11000)) {
    const message = 'Duplicate field value entered';
    err = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors).map((val) => val.message);
    console.log(error);
    err = new ErrorResponse(message, 400);
  }

  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Server Error'
  });
};

module.exports = errorHandler;
