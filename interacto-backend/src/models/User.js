import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    googleId: { type: String, unique: true, sparse: true }
  },
  {
    timestamps: true
  }
);

const User = mongoose.models.User || mongoose.model('User', UserSchema);
export default User;
