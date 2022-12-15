const { validationResult } = require('express-validator');
const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const mongoose = require('mongoose');
const fs = require('fs');
const Place = require('.././models/place');
const User = require('../models/user');

const getPlaceById = async (req, res, next) => {
  const userId = req.params.pid;

  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate('places');
  } catch (err) {
    const error = new HttpError(
      'something went wrong, could not find a place',
      500
    );
    return next(error);
  }

  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    const error = new HttpError(
      'could not find a place for the provided id',
      404
    );
    return next(error);
  }

  // 몽구스는 데이터 조회후 해당 데이터를 분해하거나 할때 POJO가 아닌,
  // Mongoose Document형태이기때문에 toObject를 사용해서 POJO로 변환
  res.json({ place: userWithPlaces.toObject({ getters: true }) });
};

const getPlaceByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let place;
  try {
    place = await Place.find({ creator: userId });
  } catch (err) {
    const error = new HttpError(
      'something went wrong, could not find a place',
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError(
      'could not find a place for the provided userId',
      404
    );
    return next(error);
  }

  res.json({ place: place.map((place) => place.toObject({ getters: true })) });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next(new HttpError('Invalid inputs passed, please check your data', 422));
  }

  const { address, creator, title, description, } = req.body;

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
    image: req.file.path,
    creator
  });


  let user;

  try {
    user = await User.findById(creator);
  } catch (err) { 
    const error = new HttpError('Creating place failed, please try again', 500);
    return next(error);
  }

  if(!user) {
    const error = new HttpError('Could not find user for provided id', 404);
    return next(error);
  }

  // 몽구스에서 저장할때 사용하는 메소드
  // document를 DB에 새로 저장할때 사용, 유니크한 아이디도 생성해줌
  // 비동기 동작을 수행함.
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session : sess });
    user.places.push(createdPlace);
    await user.save({ session : sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'Creating place failed, please try again.',
      500
    );
    return next(error);
  }

  res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError('Invalid inputs passed, please check your data', 422));
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      'Something wen wrong, could not update places.',
      500
    );
    return next(error);
  }

  // MONGODB ID는 toString을 통해서 정상적인 문자열로 바꿔줘야함
  if (place.creator.toString() !== req.userData.userId) {
    const error = new HttpError(
      'You are not allowed to edit this place',
      401
    );
    return next(error);
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    const error = new HttpError('Something wen wrong, could not update place', 500);
    return next(error);
  }

  res.status(200).json({ place: place.toObject({getters: true}) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId).populate('creator');
  } catch (err) {
    const error = new HttpError('Something wen wrong, could not delete place', 500);
    return next(error);
  }

  if(!place) {
    const error = new HttpError('Could not find place for this id.', 404);
    return next(error);
  }

  if(place.creator !== req.userData.userId) {
    const error = new HttpError(
      'You are not allowed to delete this place',
      401
    );
    return next(error);
  }

  const imagePath = place.image


  try {
    // 매번 세션을 부를때마다 다른 세션값을 반환한다.
    // 반대로 endSession(); 하면 id에 대한 세션종료된다. id 값은 사라지지않음 
    const sess = await mongoose.startSession();
    // 트랜잭션으로 실행하면, 중간에 에러가나면 알아서 복구가된다. ( 원자성 )
    sess.startTransaction();
    await place.remove({session: sess});
    place.creator.places.pull(place);
    await place.creator.save({session: sess});
    await sess.commitTransaction();
  } catch(err) {
    const error = new HttpError('Something went wrong, could not delete place', 500);
    return next(error);
  }
  
  fs.unlink(imagePath, err => {
    console.log(err)
  });

  res.status(200).json({ message: 'Deleted place.' });
};

exports.getPlaceById = getPlaceById;
exports.getPlaceByUserId = getPlaceByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
