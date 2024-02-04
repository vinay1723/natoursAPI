const req = require('express/lib/request');
const res = require('express/lib/response');
// const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const Tour = require('./../models/tourModel');
// const APIFeatures = require('./../utils/APIFeatures');
const catchAsync = require('./../utils/catchAsync');
// const AppError = require('../utils/appError');
const User = require('../models/userModel');
const factory = require('./handlerFactor');
const AppError = require('../utils/appError');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('not an image please upload image only', 404), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  {
    name: 'imageCover',
    maxCount: 1,
  },
  {
    name: 'images',
    maxCount: 3,
  },
]);

//upload.single('image') req.file
//upload.array('images',5) req.files

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // console.log(req.files);
  if (!req.files.imageCover || !req.files.images) return next();

  // 1) Cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) Images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);
      req.body.images.push(filename);
    })
  );
  next();
});

//ROUTE HANDLERS
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// exports.checkID = (req, res, next, val) => {
//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid ID',
//     });
//   }
//   next();
// };

//GET

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

// exports.getAllTours = catchAsync(async (req, res, next) => {
//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limiting()
//     .pagination();

//   const allTours = await features.query;

//   res.status(200).json({
//     status: 'success',
//     data: { allTours },
//   });
// console.log(req.requestTime);
// try {
//FILTERING
// const queryObj = { ...req.query };
// console.log(req.query);
// const excludedFields = ['page', 'sort', 'limit', 'fields'];
// excludedFields.forEach((el) => delete queryObj[el]);
// //Advanced Filtering
// let queryString = JSON.stringify(queryObj);
// queryString = queryString.replace(
//   /\b(gte|gt|lte|lt)\b/g,
//   (match) => `$${match}`
// );
// console.log(queryString);
// let query = Tour.find(JSON.parse(queryString));
// console.log(query);
//2) Sorting
// console.log(req.query.sort);
// if (req.query.sort) {
//   const sortBy = req.query.sort.split(',').join(' ');
//   console.log(sortBy);
//   query = query.sort(sortBy);
// } else {
//   query = query.sort('-createdAt');
// }
//Field Limiting
// if (req.query.fields) {
//   const fields = req.query.fields.split(',').join(' ');
//   query = query.select(fields);
// } else {
//   query = query.select('-__v');
// }
// 4)Pagination
// const page = req.query.page * 1 || 1;
// const limit = req.query.limit * 1 || 100;
// const skip = (page - 1) * limit;
// query = query.skip(skip).limit(limit);
// if (req.query.page) {
//   const numTours = await Tour.countDocuments();
//   if (skip >= numTours) throw new Error('This Page does not exist');
// }
//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limiting()
//     .pagination();
//   const allTours = await features.query;
//   res.status(200).json({
//     status: 'success',
//     data: { allTours },
//   });
// } catch (err) {
//   res.status(404).json({
//     status: 'failed',
//     message: err,
//   });
// }
// });

//READING
exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);
// exports.getTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findById(req.params.id).populate('reviews');
//   //Tour.findOne({_id:req.params.id})
//   if (!tour) {
//     return next(new AppError('requested tour does not exist', 404));
//   }
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour,
//     },
//   });
// try {
//   const tour = await Tour.findById(req.params.id);
//   //Tour.findOne({_id:req.params.id})
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour,
//     },
//   });
// } catch (err) {
//   res.status(404).json({
//     status: 'failed',
//     message: err,
//   });
// }

// const id = req.params.id * 1;
// const tour = tours.find((el) => el.id === id);
// if (!tour)
//   res.status(404).json({
//     status: 'failed',
//     message: 'Invalid ID',
//   });
// if (id > tours.length)
//   res.status(404).json({
//     status: 'failed',
//     message: 'Invalid ID',
//   });
// console.log(req.params);
// res.status(200).json({
//   status: 'success',
//   data: { tour },
//   // results: tours.length,
// });
// });

// POST
// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'Missing name or price',
//     });
//   }
//   next();
// };

//CREATE TOUR
// exports.createTour = catchAsync(async (req, res, next) => {
//   const newTour = await Tour.create(req.body);
//   res.status(201).json({
//     staus: 'success',
//     data: {
//       tour: newTour,
//     },
//   });
// } catch (err) {
//   res.status(400).json({
//     status: 'fail',
//     message: err,
//   });
// });
// const newId = tours[tours.length - 1].id + 1;
// const newTour = Object.assign({ id: newId }, req.body);
// tours.push(newTour);
// fs.writeFile(
//   `${__dirname}/dev-data/data/tours-simple.json`,
//   JSON.stringify(tours),
//   (err) => {
//     res.status(201).json({
//       staus: 'success',
//       data: {
//         tour: newTour,
//       },
//     });
//   }
// );
// res.send('Done');

//PATCH

// exports.updateTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true,
//   });
//   if (!tour) {
//     return next(new AppError('Tour does not exists', 404));
//   }
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour,
//     },
//   });
// if (req.params.id * 1 > tours.length) {
//   res.status(404).json({
//     status: 'Failed',
//     message: 'Invalid URL',
//   });
// }
// try {
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true,
//   });
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour,
//     },
//   });
// } catch (err) {
//   res.status(404).json({
//     status: failed,
//     message: err,
//   });
// }
// });

//DELETE

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndRemove(req.params.id);
//   if (!tour) {
//     return next(new AppError('tour not found', 404));
//   }
//   res.status(200).json({
//     status: 'success',
//     message: 'Tour has been successfully deleted',
//     data: tour,
//   });

// if (req.params.id * 1 > tours.length) {
//   res.status(404).json({
//     status: 'Failed',
//     message: 'Invalid URL',
//   });
// }
// try {
//   const tour = await Tour.findByIdAndRemove(req.params.id);
//   res.status(200).json({
//     status: 'success',
//     data: tour,
//   });
// } catch (err) {
//   res.status(404).json({
//     status: failed,
//     message: err,
//   });
// }
// });

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: '$difficulty',
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
        numRating: { $sum: '$ratingsQuantity' },
        numTours: { $sum: 1 },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: stats,
  });

  // try {
  //   const stats = await Tour.aggregate([
  //     {
  //       $match: { ratingsAverage: { $gte: 4.5 } },
  //     },
  //     {
  //       $group: {
  //         _id: '$difficulty',
  //         avgRating: { $avg: '$ratingsAverage' },
  //         avgPrice: { $avg: '$price' },
  //         minPrice: { $min: '$price' },
  //         maxPrice: { $max: '$price' },
  //         numRating: { $sum: '$ratingsQuantity' },
  //         numTours: { $sum: 1 },
  //       },
  //     },
  //     {
  //       $sort: { avgPrice: 1 },
  //     },
  //   ]);

  //   res.status(200).json({
  //     status: 'success',
  //     data: stats,
  //   });
  // } catch (err) {
  //   res.status(404).json({
  //     status: 'failed',
  //     message: err,
  //   });
  // }
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year + 1;

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`2021-01-01`),
          $lte: new Date(`2021-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numTourStarts: -1,
      },
    },
  ]);

  res.status(404).json({
    status: 'success',
    data: {
      plan,
    },
  });

  // try {
  //   const year = req.params.year + 1;

  //   const plan = await Tour.aggregate([
  //     {
  //       $unwind: '$startDates',
  //     },
  //     {
  //       $match: {
  //         startDates: {
  //           $gte: new Date(`2021-01-01`),
  //           $lte: new Date(`2021-12-31`),
  //         },
  //       },
  //     },
  //     {
  //       $group: {
  //         _id: { $month: '$startDates' },
  //         numTourStarts: { $sum: 1 },
  //         tours: { $push: '$name' },
  //       },
  //     },
  //     {
  //       $addFields: { month: '$_id' },
  //     },
  //     {
  //       $project: {
  //         _id: 0,
  //       },
  //     },
  //     {
  //       $sort: {
  //         numTourStarts: -1,
  //       },
  //     },
  //   ]);

  //   res.status(404).json({
  //     status: 'success',
  //     data: {
  //       plan,
  //     },
  //   });
  // } catch (err) {
  //   res.status(404).json({
  //     status: 'failed',
  //     message: err,
  //   });
  // }
});

// /tours-distance?distance=233&center=-40,45&unit=mi
// /tours-distance/233/center/-40,45/unit/mi

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    return next(
      new AppError('please provide lat,lng in the format lat,lng', 400)
    );
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  console.log(distance, latlng, unit);
  res.status(200).json({
    status: 'sucess',
    results: tours.length,
    data: {
      tours,
    },
  });
});

exports.getDistance = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Plese provide latitude and longitude in the format lat,lng',
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: { distances },
  });
});
