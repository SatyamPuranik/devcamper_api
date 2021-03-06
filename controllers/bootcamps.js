// Here we are going to create different methods that are going to be associated with different routes. We need to export each method so that we can bring it into the routes file.
const ErrorResponse = require('../utilis/errorResponse'); //We are bringing ErrorResponse to create a error response object with a message and a statusCode
const asyncHandler = require('../middleware/async');
const geocoder = require('../utilis/geocoder');
const Bootcamp = require('../models/Bootcamp');
const path = require('path');

// @desc     Get all bootcamps
// @route    GET /api/v1/bootcamp
// @access   Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});
// exports.getBootcamps = async (req, res, next) => {
//   try {
//     const bootcamps = await Bootcamp.find();

//     res.status(200).json({
//       success: true,
//       count: bootcamps.length,
//       data: bootcamps
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// @desc     Get bootcamp
// @route    GET /api/v1/bootcamp/:id
// @access   Public

exports.getBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    // Correct format but wrong id
    // return res.status(400).json({
    //   success: false
    // });

    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }
  // In try block there are two resposes, even though one is in if statment it will give us a error. Wen we have something like this we return the first one. After returning the function will stop.

  res.status(200).json({
    success: true,
    data: bootcamp
  });
});

// exports.getBootcamp = async (req, res, next) => {
//   try {
//     const bootcamp = await Bootcamp.findById(req.params.id);

//     if (!bootcamp) {
//       // Correct format but wrong id
//       // return res.status(400).json({
//       //   success: false
//       // });

//       return next(
//         new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
//       );
//     }
//     // In try block there are two resposes, even though one is in if statment it will give us a error. Wen we have something like this we return the first one. After returning the function will stop.

//     res.status(200).json({
//       success: true,
//       data: bootcamp
//     });
//   } catch (error) {
//     // If the id is not in correct format
//     // res.status(400).json({ success: false });
//     // next(error);
//     //This will return HTML

//     // next(
//     //   new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
//     // );

//     next(error);
//   }
// };

// @desc     Create new bootcamp
// @route    POST /api/v1/bootcamp
// @access   Private
exports.createBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.create(req.body);

  res.status(201).json({
    success: true,
    data: bootcamp
  });
});
// exports.createBootcamp = async (req, res, next) => {
//   try {
//     const bootcamp = await Bootcamp.create(req.body);

//     res.status(201).json({
//       success: true,
//       data: bootcamp
//     });
//   } catch (error) {
//     // If we dont handle the error then nodemon will crash - later on we will add a handler so we can remove trycatch
//     // If we try to make the same req then catch block will work
//     // res.status(400).json({ success: false });

//     next(error);
//   }
// };

// @desc     Update bootcamp
// @route    PUT /api/v1/bootcamp/:id
// @access   Private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: bootcamp
  });
});

// @desc     Delete bootcamp
// @route    DELETE /api/v1/bootcamp/:id
// @access   Private
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
  // const bootcamp = await Bootcamp.findByIdAndDelete(req.params.id);
  // findByIdAndDelete will not trigger pre-remove middleware
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  bootcamp.remove(); //remove will trigger middleware

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc     Get bootcamps within a radius
// @route    GET /api/v1/bootcamp/radius/:zipcode/:distance
// @access   Private
exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  // Get lat/lng from geocoder
  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;

  // Clac radius using radians
  // Divide distance by radius of earth
  // Earth radius = 3,963 mi / 6,378 km
  const radius = distance / 3963;

  const bootcamps = await Bootcamp.find({
    location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });

  res.status(200).json({
    success: true,
    count: bootcamps.length,
    data: bootcamps
  });
});

// @desc     Upload photo for bootcamp
// @route    PUT /api/v1/bootcamp/:id/photo
// @access   Private
exports.bootcampPhotoUpload = asyncHandler(async (req, res, next) => {
  // const bootcamp = await Bootcamp.findByIdAndDelete(req.params.id);
  // findByIdAndDelete will not trigger pre-remove middleware
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  // Check to see if file was actually uploaded
  if (!req.files) {
    return next(new ErrorResponse('Please upload a file', 400));
  }

  const file = req.files.file;

  // Make sure the image is a photo
  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse(`Please upload a image file`, 400));
  }

  // Check file size
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(
      new ErrorResponse(
        `Please upload a image less than ${process.env.MAX_FILE_UPLOAD}`,
        400
      )
    );
  }

  // Create custom filename
  file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;

  // file also has a function mv attached to it whose first parameter is path were file needs to be sent and file name and second parameter is a callback function which takes in a possible error
  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse(`Problem with file upload`, 500));
    }

    await Bootcamp.findByIdAndUpdate(req.params.id, {
      photo: file.name
    });

    res.status(200).json({
      success: true,
      data: file.name
    });
  });
});
