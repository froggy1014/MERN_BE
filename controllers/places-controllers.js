const { validationResult } = require('express-validator');
const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const mongoose = require('mongoose');
const fs = require('fs');
const Place = require('.././models/place');
const User = require('../models/user');
const { PLACE: ERROR } = require('../constants/Error');

const getPlaceById = async (req, res, next) => {
  const userId = req.params.pid;

  let userPlaces;
  try {
    userPlaces = await User.findById(userId).populate('places');
  } catch (err) {
    return next(new HttpError(ERROR.SERVER, 500));
  }

  if (!userPlaces || userPlaces.places.length === 0) {
    return next(new HttpError(ERROR.WRONGID, 404));
  }

  // 몽구스는 데이터 조회후 해당 데이터를 분해하거나 할때 POJO가 아닌,
  // Mongoose Document형태이기때문에 toObject를 사용해서 POJO로 변환
  // getters: true로 해줌으로써  _id가 데이터에 프로퍼티로 남게된다. 
  res.json({ place: userPlaces.toObject({ getters: true }) });
};

const getPlaceByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let place;
  try {
    // 커서 프로퍼티를 넣어줌으로써 원하는 프로퍼티로 필터링하여 find()를 할 수 있다. 
    place = await Place.find({ creator: userId });
  } catch (err) {
    return next(new HttpError(ERROR.SERVER, 500));
  }

  if (!place) return next(new HttpError(ERROR.WRONGID, 404));

  res.json({ place: place.map((place) => place.toObject({ getters: true })) });
};

const createPlace = async (req, res, next) => {
  // 앞서서 라우트에서 검사한 유효성 검사 결과를 확인하고,
  // 에러가 있다면 에러를 던진다. 
  const errors = validationResult(req);
  if (!errors.isEmpty())  next(new HttpError(ERROR.INVALID, 422));

  
  const { address, title, description, } = req.body;
  
  let location;
  try {
    location = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }
  
  const createdPlace = new Place({
    title,
    description,
    address,
    location,
    image: req.file.location.split('/').pop(),
    creator: req.userData.userId
  });

  let user;

  try {
    user = await User.findById(req.userData.userId);
  } catch (err) { 
    return next(new HttpError(ERROR.CREATE, 500));
  }

  if(!user) {
    return next(new HttpError(ERROR.WRONGID, 404));
  }

  // 몽구스에서 저장할때 사용하는 메소드
  // document를 DB에 새로 저장할때 사용, 유니크한 아이디도 생성해줌
  // 비동기 동작을 수행함.

  // startSession()을 통해 세션을 생성 
  // 세션이 있으니 트랜잭션을 시작할 수 있습니다. 
  // 만들어진 createPlace를 DB에 저장하는데 session을 참조하게 합니다.
  // 참조하는 두개의 모델을 연결할 수 있게 해준다. 
  // user문서에 places라는 배열안에  createdPlace id만 추가해준다.
  // user를 DB에 저장하고 다시 세션을 참조해줍니다.
  // session이 트랜잭션을 commit하게 만들어서 끝내준다.
  // 과정중에 하나라도 에러가 나면 자동으로 rollback을 해준다. 
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session : sess });
    user.places.push(createdPlace);
    await user.save({ session : sess });
    await sess.commitTransaction();
  } catch (err) {
    return next(new HttpError(ERROR.CREATE, 500));
  }

  res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError(ERROR.INVALID, 422));
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    return next(new HttpError(ERROR.SERVER, 500));
  }

  // MONGODB ID는 toString을 통해서 정상적인 문자열로 바꿔줘야함
  if (place.creator.toString() !== req.userData.userId) {
    return next(new HttpError(ERROR.AUTHEDIT, 401));
  }

  // MongoDB에서 가져온 해당 아이디에 대한 title, description을 덮어써준다.
  place.title = title;
  place.description = description;

  // place 데이터를 MongoDB에 저장하는 로직
  try {
    await place.save();
  } catch (err) {
    return next(new HttpError(ERROR.SERVER, 500));
  }

  res.status(200).json({ place: place.toObject({getters: true}) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId).populate('creator');
  } catch (err) {
    return next(new HttpError(ERROR.SERVER, 500));
  }

  if(!place) return next(new HttpError(ERROR.WRONGID, 404));

  if(place.creator.id !== req.userData.userId) {
    return next(new HttpError(ERROR.AUTHDELETE, 401));
  }

  const imagePath = place.image


  // 매번 세션을 부를때마다 다른 세션값을 반환한다.
  // 반대로 endSession(); 하면 id에 대한 세션종료된다. id 값은 사라지지않음 
  // 트랜잭션으로 실행하면, 중간에 에러가나면 알아서 복구가된다. ( 원자성 )
  // pull()을 통해 id를 지워준다.
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({session: sess});
    place.creator.places.pull(place);
    await place.creator.save({session: sess});
    await sess.commitTransaction();
  } catch(err) {
    return next(new HttpError(ERROR.SERVER, 500));
  }
  
  fs.unlink(imagePath, err => {
    console.log(err)
  });

  res.status(200).json({ message: 'Deleted place.' });
};

// 함수에 대한 포인터만 보낸다.
// Express가 알아서 실행해줌.
exports.getPlaceById = getPlaceById;
exports.getPlaceByUserId = getPlaceByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
