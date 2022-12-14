const express = require('express');
const { check } = require('express-validator');

const placeControllers = require('../controllers/places-controllers');

const router = express.Router();
const fileUpload = require('../middleware/file-upload');
const checkAuth = require('../middleware/check-auth');

router.get('/:pid', placeControllers.getPlaceById);

router.get('/user/:uid', placeControllers.getPlaceByUserId);


// post, patch 라우팅에 앞서 jwt 토큰 유무를 확인해줄 미들웨어를 추가해준다.
router.use(checkAuth);

router.post(
  '/',
  fileUpload.single('image'),
  [
    check('title').not().isEmpty(),
    check('description').isLength({ min: 5 }),
    check('address').not().isEmpty(),
  ],
  placeControllers.createPlace
);

router.patch(
  '/:pid',
  [check('title').not().isEmpty(), check('description').isLength({ min: 5 })],
  placeControllers.updatePlace
);

router.delete('/:pid', placeControllers.deletePlace);

module.exports = router;
