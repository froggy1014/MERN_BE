const { validationResult } = require('express-validator');
const HttpError = require('../models/http-error');
const User = require('../models/user');


const getUsers = async (req, res, next) => {

  let users;
  
  try {
    // password 속성만 빼고 데이터 반환을 원할때 
    users = await User.find({}, '-password')
  } catch (err) {
    const error = new HttpError('Fetching users failed, please try again later', 500);
    return next(error);
  }

  res.json({users: users.map(user => user.toObject({ getters: true}))});

};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError('Invalid inputs passed, please check your data', 422));
  }
  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      ' Signing up failed, please try again later. existingUser',
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      'User exists alreay, please login instaed.',
      422
    );
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    image: req.file.path,
    password,
    places : []
  });


  try {
    await createdUser.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError(err.message, 500);
    return next(error);
  }

  res.status(201).json({ user: createdUser.toObject({ getters: true }) });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      ' Logging up failed, please try again later.',
      500
    );
    return next(error);
  }

  if (!existingUser || existingUser.password !== password) {
    const error = new HttpError('Invalid Credentials, could not log you in.', 401);
    return next(error);
  }
  

  res.json({ message: 'Logged in!', user : existingUser.toObject({getters: true}) });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
