const fs = require('fs');

// express 상수 -> 함수가 됨. 
const express = require('express');

// HTTP post put 요청시 request body 에 들어오는 데이터값을 읽을 수 있는 구문으로 파싱함과 동시에 req.body 로 입력해주어 응답 과정에서 요청에 body 프로퍼티를 새로이 쓸 수 있게 해주는 미들웨어
const bodyParser = require('body-parser');

const mongoose = require('mongoose');

// 라우터를 가져와 미들웨어로 사용  
const placesRoutes = require('./routes/places-routes');
const usersRoutes = require('./routes/users-routes');
const HttpError = require('./models/http-error');
const port = process.env.PORT || 5002

// 환경변수 가져오기 
require('dotenv').config();

// app객체에 express 메소드들이 담기게 된다. 
const app = express();

// app.use()
// path 적게되면 필터링 시작함 
// app.http 는 param을 두개 받는다. 
// path, 그리고 요청과 같이온 미들웨서 함수

// 제일 먼저 일단 req.body를 파싱을 한다. 
app.use(bodyParser.json());


// cors에 대한 처리 
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Methods','GET, POST, PATCH, DELETE')
  next();
})

// 라우팅
app.use('/api/places/', placesRoutes);
app.use('/api/users/', usersRoutes);

// 상단에 해당하는 path가 없다면 404를 반환합니다.
app.use((req, res, next) => {
  const error = new HttpError('Could not find this route.', 404);
  throw error;
});

// 매개변수에 error를 추가하게 되면  오류처리 미들웨어로 인식
// 앞에서 오류가 있으면 실행하는 미들웨어 함수가 되어버림
app.use((error, req, res, next) => {
  // 동기적인 방식때는 throw error도 괜찮지만
  // DB를 다루는 비동기코드를 다룰땐 next(error);


  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }
  // 이미 응답이 전송된 상태인지 ? 
  if (res.headerSent) {
    return next(error);
  }

  // 사용자가 지정한 에러 코드 || 서버 에러
  res.status(error.code || 500);

  // 사용자가 지정한 에러 메세지 || 기본 서버 에러 메세지 
  res.json({ message: error.message || 'An unknown error occurred!' });
});

// mongodb.net 뒤에 있는게 데이터베이스 이름
mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.9m2yq56.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
  )
  .then(() => {
    console.log('connected')
    app.listen(port);
  })
  .catch((err) => {
    console.log(err);
  });
