const ErrorResponse = require('../utilis/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');

// @desc     Register user
// @route    GET /api/v1/auth/register
// @access   Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role
  });

  // Create token
  const token = user.getSignedJwtToken(); //We are using a method not a static. A method is called on a actual user and a static is called on the object itself. {*Same as static function in classes and methods in classes}

  res.status(200).json({
    success: true,
    token
  });
});
