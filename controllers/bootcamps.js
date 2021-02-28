// Here we are going to create different methods that are going to be associated with different routes. We need to export each method so that we can bring it into the routes file.
const ErrorResponse = require('../utilis/errorResponse'); //We are bringing ErrorResponse to create a error response object with a message and a statusCode
const asyncHandler = require('../middleware/async');
const geocoder = require('../utilis/geocoder');
const Bootcamp = require('../models/Bootcamp');

// @desc     Get all bootcamps
// @route    GET /api/v1/bootcamp
// @access   Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
  let query;

  // Copy req.query
  const reqQuery = { ...req.query };

  // Fields to exclude for filtering
  const removeFields = ['select', 'sort', 'page', 'limit'];

  // Loop over removeFields and delete them from reqQuery
  removeFields.forEach((param) => delete reqQuery[param]);

  // Create query string
  let queryStr = JSON.stringify(reqQuery);

  // Create operators ($gt, $gte..)
  queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`
  );

  // Finding resource
  query = Bootcamp.find(JSON.parse(queryStr));

  // Select Fields
  if (req.query.select) {
    // We will be doing select=name,description in our query. So when we encounter ',' we want to break it and push it in fields array. feilds = ['name', 'description']
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    // Default sort
    query = query.sort('-createdAt'); // '-' is for decending sort
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Bootcamp.countDocuments();

  query = query.skip(startIndex).limit(limit);

  // Executing query
  const bootcamps = await query;

  // Pagination result
  const pagination = {};
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  res.status(200).json({
    success: true,
    count: bootcamps.length,
    pagination,
    data: bootcamps
  });
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
  const bootcamp = await Bootcamp.findByIdAndDelete(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

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
