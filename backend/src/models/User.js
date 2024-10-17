const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    money: {
      type: Number,
      required: true,
      default: 100000000, // Default value set to 100 million
    },
    teams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team", // Reference the Team model instead of individual players
      },
    ],
    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    },
  },
  {
    timestamps: true, // Adds `createdAt` and `updatedAt` fields
  }
);

// Static method for signup
userSchema.statics.signup = async function (
  firstname,
  lastname,
  email,
  password
) {
  const userExists = await this.findOne({ email });
  if (userExists) throw new Error("User already exists");

  // Email validation
  if (!validator.isEmail(email)) {
    throw new Error("Invalid email!");
  }

  // Password validation
  if (!validator.isStrongPassword(password)) {
    throw new Error("Password not strong enough!");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await this.create({
    firstname,
    lastname,
    email,
    password: hashedPassword,
    money: 100000000, // Initial money for new users
  });
  return user;
};

// Static method for login
userSchema.statics.login = async function (email, password) {
  const user = await this.findOne({ email });
  if (!user) throw new Error("Invalid email or password");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid email or password");

  return user;
};

// // Middleware to enforce team size limit before saving
// userSchema.pre("save", function (next) {
//   if (this.team.players.length > 15) {
//     throw new Error("Team size cannot exceed 15 players");
//   }
//   next();
// });

module.exports = mongoose.model("User", userSchema);
