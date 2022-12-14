import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    contacts: [
      {
        name: { type: String, required: true },
        email: String,
        phone: String,
        specialization: String,
      },
    ],
    tests: [{ type: mongoose.Schema.Types.ObjectId, ref: "Test" }],
    reminders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Reminder" }],
    files: [{ type: mongoose.Schema.Types.ObjectId, ref: "File" }],
  },
  { collection: "users", timestamps: true }
);

UserSchema.pre("save", function (next) {
  const user = this;
  if (this.isModified("password") || this.isNew) {
    bcrypt.genSalt(10, function (saltError, salt) {
      if (saltError) {
        return next(saltError);
      } else {
        bcrypt.hash(user.password, salt, function (hashError, hash) {
          if (hashError) {
            return next(hashError);
          }
          console.log(hash);
          user.password = hash;
          next();
        });
      }
    });
  } else {
    return next();
  }
});

const User = mongoose.model("User", UserSchema);

export default User;
