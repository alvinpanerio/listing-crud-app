const mongoose = require("mongoose");

//account schema
const accountSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const Account = mongoose.model("Account", accountSchema);

module.exports = Account;
