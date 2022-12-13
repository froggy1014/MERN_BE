const request = require("requestify");
const HttpError = require('../models/http-error');
const API_KEY = 'AIzaSyB_CvZu-cDZIOJL05KK8PxDg6zl37fl2z8';

async function getCoordsForAddress(address) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`;
  
  const response = await request.get(url);

  const data = response.getBody();
  
  if(!data || data.status === 'ZERO_RESULTS') {
    const error = new HttpError('Could not find location for the specified address.', 422);
    throw error;
  }
  
  const coordinates = data.results[0].geometry.location;
  
  return coordinates;
}

module.exports = getCoordsForAddress;