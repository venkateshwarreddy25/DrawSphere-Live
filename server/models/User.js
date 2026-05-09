const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 60,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: false,
    select: false,
  },
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true,
  },
}, { timestamps: true })

// Compare password (used during local login)
UserSchema.methods.matchPassword = async function (entered) {
  if (!this.password) return false
  return bcrypt.compare(entered, this.password)
}

module.exports = mongoose.model('User', UserSchema)
