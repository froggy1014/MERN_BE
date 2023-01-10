const mongoose = require('mongoose');

// Schema 메소드는 스키마 생성자 함수다. 
// MongoDB 저장할 문서의 구조를 정의할 수 있다. 
const placeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  address: { type: String, required: true },
  location: { 
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  creator: { type: mongoose.Types.ObjectId, required: true, ref: 'User' }
})


// model 함수는 두가지 인자를 요구하는데, 
// 콜렉션 이름, 스키마 객체를 담은 스키마 객체 이름
module.exports = mongoose.model('Place', placeSchema);