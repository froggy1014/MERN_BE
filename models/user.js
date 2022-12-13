const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const userSchema = new mongoose.Schema({
  name: { type: 'string', required: true },
  email: { type: 'string', required: true },
  password: { type: 'string', required: true, unique: true },
  name: { type: 'string', required: true, minlength: 6 },
  image: { type: 'string', required: true },
  places: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Place'  }]
});


userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);