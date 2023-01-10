const PLACE = {
  "SERVER" : "Something went wrong, could not find a place",
  "WRONGID" : "Could not find a place for the provided Id",
  "INVALID" : "Invalid inputs passed, please check your data",
  "CREATE" : "Creating place failed, please try again",
  "AUTHEDIT" : "You are not allowed to edit this place",
  "AUTHDELETE" : "You are not allowed to delete this place",
}

const USER = {
  "SERVER" : "Something went wrong, please try again",
  "FETCH" : "Fetching failed, please try again later",
  "INVALID" : "Invalid inputs passed, please check your data",
  "LOGIN" : "Signing up failed, please try again later. existingUser",
  "EXISTING" : "User exists alreay, please login instaed.",
  "AUTH" : "Invalid Credentials, could not log you in.",
}

module.exports = {
  PLACE, 
  USER
};