const multer = require('multer')
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
require('dotenv').config();

const creds = new AWS.Credentials({
  accessKeyId: process.env.S3_ACCESS_KEY_ID, 
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
});

const myAWS = new AWS.Config({
  credentials: creds,
  region: process.env.S3_REGION,
})

AWS.config.update(myAWS);

const MIME_TYPE_MAP = {
  'image/png': 'png',
  'image/jpg': 'jpg',
  'image/jpeg': 'jpeg',
}

const fileUpload = multer({
  limits: { fileSize: 1000000 },
  storage: multerS3({
      s3: new AWS.S3(),
      bucket: 'place-ive-been',
      acl: 'public-read',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: function(req, file, cb) {
          cb(null, `${Date.now().toString()}${file.originalname}`);
      },
      fileFilter: (req, file, cb) => {
            const isValid = !!MIME_TYPE_MAP[file.mimetype]
            let error = isValid ? null : new Error('Invalid mime type!')
            cb(error, isValid);
          }
  }),
});

module.exports = fileUpload;
