const ErrorResponse = require('../utilis/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');
const sendEmail = require('../utilis/sendEmail');

// @desc     Register user
// @route    POST /api/v1/auth/register
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

  // // Create token
  // const token = user.getSignedJwtToken(); //We are using a method not a static. A method is called on a actual user and a static is called on the object itself. {*Same as static function in classes and methods in classes}

  // res.status(200).json({
  //   success: true,
  //   token
  // });
  sendTokenResponse(user, 200, res);
});

// @desc     Login user
// @route    POST /api/v1/auth/login
// @access   Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  //  Validate email and password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  // Check for user
  const user = await User.findOne({ email: email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  sendTokenResponse(user, 200, res);
});

// @desc     Get current logged in user
// @route    GET /api/v1/auth/me
// @access   Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc     Forgot Password
// @route    GET /api/v1/auth/forgotpassword
// @access   Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email }); //Getting the user by email that is sent in the body

  if (!user) {
    return next(new ErrorResponse('There is no user with that email', 404));
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();

  console.log(resetToken);

  await user.save({ validateBeforeSave: false }); //So resetPasswordToken and resetPasswordExpire fields will be stored in DB

  // Create reset url
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/auth/resetpassword/${resetToken}`;

  const message = `You are reciving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to :\n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password reset token',
      message
    });
    res.status(200).json({
      success: true,
      data: 'Email sent'
    });
  } catch (error) {
    // If anything goes wrong we want to get rid of resetPasswordToken & resetPasswordExpire fields in database
    console.log(error);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// CUSTOM FUNCTION - Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    // We don't want secure to be true for devlopment mode
    options.secrue = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({ success: true, token });
  // cookie takes key(what is it called), value and options
};
