const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const { Model } = require('mongoose');
const APIFeatures = require('./../utils/APIFeatures');
//DELETE
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndRemove(req.params.id);
    if (!doc) {
      return next(new AppError('tour not found', 404));
    }
    res.status(204).json({
      status: 'success',
      message: 'Tour has been successfully deleted',
      data: null,
    });
  });

//UPDATE
exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      return next(new AppError('Tour does not exists', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

//CREATE

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      staus: 'success',
      data: {
        data: doc,
      },
    });
    // } catch (err) {
    //   res.status(400).json({
    //     status: 'fail',
    //     message: err,
    //   });
  });

//getOne

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;
    //Tour.findOne({_id:req.params.id})
    if (!doc) {
      return next(
        new AppError('requested user does not exist please sign up', 404)
      );
    }
    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    const filter = { tour: req.params.tourId };
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limiting()
      .pagination();

    // const allDocs = await features.query.explain();
    const allDocs = await features.query;
    res.status(200).json({
      status: 'success',
      data: { allDocs },
    });
  });
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
