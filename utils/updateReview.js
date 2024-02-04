const Tour = require('./../models/tourModel');
exports.updateReview = async function (tourId, stats) {
  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: stats[0].nRating,
    ratingsAverage: stats[0].avgRating,
  });
};
