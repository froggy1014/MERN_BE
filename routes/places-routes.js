const express = require('express');
const { check } = require('express-validator');

const placeControllers = require('../controllers/places-controllers');

// 이 router는 한 모듈에 라우트를 다 등록하고
// app으로 export하여 하나의 라우터로 사용가능.
const router = express.Router();
const fileUpload = require('../middleware/file-upload');
const checkAuth = require('../middleware/check-auth');

router.get('/:pid', placeControllers.getPlaceById);

router.get('/user/:uid', placeControllers.getPlaceByUserId);

// post, patch 라우팅에 앞서 jwt 토큰 유무를 확인해줄 미들웨어를 추가해준다.
router.use(checkAuth);

// HTTP 뒤에 미들웨어는 하나일 필요가 없다. 여러개를 사용함으로써
// 하나하나 처리할 수 있음.
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
  [
    check('title').not().isEmpty(), 
    check('description').isLength({ min: 5 })
  ],
  placeControllers.updatePlace
);

router.delete('/:pid', placeControllers.deletePlace);

module.exports = router;
