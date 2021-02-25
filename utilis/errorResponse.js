class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message); //We are setting message property of Error class to message
    this.statusCode = statusCode;
  }
}

module.exports = ErrorResponse;
