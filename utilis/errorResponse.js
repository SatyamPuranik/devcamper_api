// Error objects are thrown when runtime errors occur. The Error object can also be used as a base object for user-defined exceptions.
// So we extend the Error object and create our own ErrorResponse class, where we can set the message and statusCode arguments of our choice.
class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message); //We are setting message property of Error class to message
    this.statusCode = statusCode;
  }
}

module.exports = ErrorResponse;
