const jwt = require('jsonwebtoken');
const HttpError = require("../models/http-error");

module.exports = (req, res, next) => {
  
  if(req.method === 'OPTIONS'){
    return next();
  }

  try {
    const token = req.headers.authorization.split(' ')[1]; // Authorization: 'Bearer TOKEN'
    if(!token) {
      throw new Error('Authentication failed');
    }

    // Secret Key를 통해 유효성을 검사한다.  
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // 이런식으로 미들웨어 중간에서 req에 객체에 데이터를 담아 넘겨줄 수 있다.
    req.userData = {userId: decodedToken.userId};
    next();
  } catch {
    const error = new HttpError('Authentication failed', 403);
    return next(error);
  }
}