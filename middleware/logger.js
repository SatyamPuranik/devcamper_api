// @desc    Logs request to console
const logger = (req, res, next) => {
  // All middleware functions take req, res & next
  // req.hello = 'Hello World'; //Setting a value in request object, that we can access in any routes that come after this middleware
  console.log(
    `${req.method} ${req.protocol}://${req.get('host')}${req.originalUrl} `
  );
  next(); //We need to call next in every middleware we create. We call it so it knows to move on to the next piece of middleware in the cycle.
};

module.exports = logger;
