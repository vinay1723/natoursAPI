const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactor');
const Booking = require('./../models/bookingModel');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //1)Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  //2)create the checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
            description: tour.summary,
          },
        },
      },
    ],
    mode: 'payment',
  });
  //3) Create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.createBookingCheckout = async (req, res, next) => {
  //This
  const { tour, user, price } = req.query;

  if (!tour && !user && !price) {
    return next();
  }
  await Booking.create({ tour, user, price });

  res.redirect(req.originalUrl.split('?')[0]);
};

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);

// const transformedItems = items.map((item) => ({
//   description: item.description,
//   quantity: 1,
//   price_data: {
//       currency: "gbp",
//       unit_amount: item.price * 100,
//       product_data: {
//           name: item.title,
//           images: [item.image],
//       },
//   },
// }));
