const mongoose = require("mongoose");

//listing schema
const listingSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  uid: {
    type: String,
    required: true,
  },
  locname: {
    type: String,
    required: true,
  },
  locadd: {
    type: String,
    required: true,
  },
  desc: {
    type: String,
    required: true,
  },
  maplink: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  mainimg: {
    type: String,
    required: true,
  },
  secimg: {
    type: String,
    required: true,
  },
  thiimg: {
    type: String,
    required: true,
  },
  comments: [
    {
      username: {
        type: String,
        required: true,
      },
      uid: {
        type: String,
        required: true,
      },
      date: {
        type: String,
        required: true,
      },
      comment: {
        type: String,
        required: true,
      },
    },
  ],
});

const Listing = mongoose.model("Listing", listingSchema);

module.exports = Listing;
