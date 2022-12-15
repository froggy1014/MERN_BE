const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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

  let hashedPassword; 
  try {
    hashedPassword = await bcrypt.hash(password, 12)
  } catch {
    const error = new HttpError('Could not create user, please try again', 500);
    return next(error);
  }


  const createdUser = new User({
    name,
    email,
    image: req.file.path,
    password: hashedPassword,
    places : []
  });


  try {
    await createdUser.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError(err.message, 500);
    return next(error);
  }

  let token;

  try {
    // 첫번째 파라미터에 담고 싶은 데이터를 payload로 넘겨준다.
    // 두번째 파라미터에 서버만 알고 있는 Secret Key를 담아준다.
    // 세번째 파라미터 만료시간 그 외 찾아보면 많은 것들을 설정해줄 수 있다. 
    token = jwt.sign({userId: createdUser.id, email: createdUser.email}, process.env.JWT_SECRET_KEY , {expiresIn: '1h'}) ;
  } catch {
    const error = new HttpError('Signing up failed, please try again later.', 500);
    return next(error);
  }


  res.status(201).json({ userId: createdUser.id, email: createdUser.email, accessToken: token});
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

  if (!existingUser) {
    const error = new HttpError('Invalid Credentials, could not log you in.', 403);
    return next(error);
  }
  
  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password)
  } catch {
    const error = new HttpError('Could not log you in, please check yout ceredentials and try agai.', 500);
    return next(error);
  }

  if(!isValidPassword) {
    const error = new HttpError('Invalid Credentials, could not log you in.', 403);
    return next(error);
  } 

  let token;
  try {
    // 첫번째 파라미터에 담고 싶은 데이터를 payload로 넘겨준다.
    // 두번째 파라미터에 서버만 알고 있는 Secret Key를 담아준다.
    // 세번째 파라미터 만료시간 그 외 찾아보면 많은 것들을 설정해줄 수 있다. 
    token = jwt.sign({userId: existingUser.id, email: existingUser.email}, process.env.JWT_SECRET_KEY , {expiresIn: '1h'}) ;
  } catch {
    const error = new HttpError('Logging in failed, please try again later.', 500);
    return next(error);
  }

  res.json({ userId: existingUser.id, email: existingUser.email, accessToken: token });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
