const catchAsync = require('../utils/catchAsync');
const User = require('./../models/userModel');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const { promisify } = require('util');
const Email = require('./../utils/email');
const crypto = require('crypto');
const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token: token,
    user: user,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);

  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();
  // {
  //   name: req.body.name,
  //   email: req.body.email,
  //   password: req.body.password,
  //   passwordConfirm: req.body.passwordConfirm,
  //   passwordChangedAt: req.body.passwordChangedAt,
  // }
  // const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
  //   expiresIn: process.env.JWT_EXPIRES_IN,
  // });
  createSendToken(newUser, 201, res);
  // const token = signToken(newUser._id);

  // res.status(201).json({
  //   status: 'success',
  //   data: { newUser },
  //   token,
  // });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const message = 'please provide the email and password';
  //1.check if email and password exist
  if (!email || !password) return next(new AppError(message, 400));
  //2.check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');
  const correct = await user.correctPassword(password, user.password);
  // console.log(password, user.password);
  // console.log(correct);
  // console.log(user);
  if (!user || !correct) {
    return next(new AppError('Incorrect password or Email', 401));
  }
  //3.If everthing is ok send the token to the client
  createSendToken(user, 200, res);
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
  });
};
exports.protect = catchAsync(async (req, res, next) => {
  //1)  Getting token check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in Please log in to get access.', 401)
    );
  }
  //2 verification of the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);
  //3 check if user exists
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError('the user belongs to this token no longer exists', 401)
    );
  }

  //4)check if user changed password after the token was issued
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'user recently changed the password!please log in again',
        401
      )
    );
  }
  //GRANT ACCESS TO PROTECTED ROUTE
  req.user = freshUser;
  res.locals.user = freshUser;
  next();
});

//only for rendered pages,no errors
exports.isLoggedin = async (req, res, next) => {
  //1)  Getting token check of it's there
  try {
    let token;
    if (req.cookies.jwt) {
      token = req.cookies.jwt;

      const decoded = await promisify(jwt.verify)(
        token,
        process.env.JWT_SECRET
      );
      console.log(decoded);
      //3 check if user exists
      const freshUser = await User.findById(decoded.id);
      if (!freshUser) {
        return next();
      }

      //4)check if user changed password after the token was issued
      if (freshUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      //there is a logged in user
      res.locals.user = freshUser;
      return next();
    }
  } catch (err) {
    return next();
  }

  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles ['admin','lead-guide] role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('you do not have permissin to perform this action', 403)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on posted email
  console.log(req.body.email);
  const user = await User.findOne({
    email: req.body.email,
  });
  // console.log(user);
  if (!user) {
    return next(new AppError('There is no user with this email address', 404));
  }

  //2)Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  //3) Send it to user's email

  // const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\n If you didn't forget your password, please ignore this email`;

  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token (valid for 10 min)',
    //   message,
    // });

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email.Try this again later!'
      ),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on the reset token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  console.log(hashedToken);
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpire: { $gte: Date.now() },
  });
  //2) If token has not expires, and there is user set the new password

  if (!user) {
    return next(new AppError('Token is Invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  //3)update changedPasswordAt property for the user
  //4) Log the user in ,send JWT
  createSendToken(user, 200, res);
  // const token = signToken(user._id);

  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1)Get user from collection
  const user = await User.findById(req.user.id).select('+password');
  //2)check if posted current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your curresnt password is wrong', 401));
  }
  //3)if so update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  //4)Log user in,send JWT
  createSendToken(user, 200, res);
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token: token,
  // });
});
