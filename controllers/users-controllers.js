// express 입력값 유효성 검사하는 third party 패키지
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const HttpError = require('../models/http-error');
const User = require('../models/user');
const { USER: ERROR } = require('../constants/Error');


const getUsers = async (req, res, next) => {
  // password 속성만 빼고 데이터 반환을 원할때 
  let users;
    try {
    users = await User.find({}, '-password')
  } catch (err) {
    return next(new HttpError(ERROR.FETCH, 500));
  }

  res.json({users: users.map(user => user.toObject({ getters: true}))});
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError(ERROR.INVALID, 422));
  }
  const { name, email, password } = req.body;

  // 이미 존재하는 유저인지 확인하는 로직
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    return next(new HttpError(ERROR.LOGIN, 500));
  }

  if (existingUser) return next(new HttpError(ERROR.EXISTING, 422));

  let hashedPassword; 
  try {
    hashedPassword = await bcrypt.hash(password, 12)
  } catch {
    return next(new HttpError(ERROR.SERVER, 500));
  }


  const createdUser = new User({
    name,
    email,
    image: req.file.location.split('/').pop(),
    password: hashedPassword,
    places : []
  });


  try {
    await createdUser.save();
  } catch (err) {
    return next(new HttpError(err.message, 500));
  }

  let token;

  try {
    // 첫번째 파라미터에 담고 싶은 데이터를 payload로 넘겨준다.
    // 두번째 파라미터에 서버만 알고 있는 Secret Key를 담아준다.
    // 세번째 파라미터 만료시간 그 외 찾아보면 많은 것들을 설정해줄 수 있다. 
    token = jwt.sign({userId: createdUser.id, email: createdUser.email}, process.env.JWT_SECRET_KEY , {expiresIn: '1h'}) ;
  } catch {
    return next(new HttpError(ERROR.LOGIN, 500));
  }


  res.status(201).json({ userId: createdUser.id, email: createdUser.email, accessToken: token});
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    return next(new HttpError(ERROR.LOGIN, 500));
  }

  if (!existingUser) {
    return next(new HttpError(ERROR.AUTH, 403));
  }
  
  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password)
  } catch {
    return next(new HttpError(ERROR.AUTH, 500));
  }

  if(!isValidPassword) {
    return next(new HttpError(ERROR.INVALID, 403));
  } 

  let token;
  try {
    // 첫번째 파라미터에 담고 싶은 데이터를 payload로 넘겨준다.
    // 두번째 파라미터에 서버만 알고 있는 Secret Key를 담아준다.
    // 세번째 파라미터 만료시간 그 외 찾아보면 많은 것들을 설정해줄 수 있다. 
    token = jwt.sign({userId: existingUser.id, email: existingUser.email}, process.env.JWT_SECRET_KEY , {expiresIn: '1h'}) ;
  } catch {
    return next(new HttpError(ERROR.LOGIN, 500));
  }

  res.json({ userId: existingUser.id, email: existingUser.email, accessToken: token });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
