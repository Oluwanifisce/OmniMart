const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastname: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    password: {
      type: String,
      // Not required for Google OAuth users (they never set a password)
      required: false,
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'customer', 'vendor', 'admin'],
        message: '{VALUE} is not a valid user role',
      },
      default: 'user',
      required: true,
    },
    // Google OAuth fields
    googleId: {
      type: String,
      unique: true,
      sparse: true,   // sparse allows multiple docs with null googleId
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
  },
  {
    timestamps: true,
    strict: 'throw',
    toJSON: { getters: true, virtuals: true },
    toObject: { getters: true, virtuals: true },
  }
);

// Virtual property for full name
userSchema.virtual('name').get(function () {
  return `${this.firstname} ${this.lastname}`.trim();
});

// Hash password prior to saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const saltround = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, saltround);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare input password with stored hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Exclude sensitive fields from output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
