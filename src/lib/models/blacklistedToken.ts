import mongoose, { Schema } from 'mongoose';

const blacklistedSchema = new Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
    expires: 3600,
  },
});

const BlacklistedToken = mongoose.models.BlacklistedToken || mongoose.model('BlacklistedToken', blacklistedSchema);

export default BlacklistedToken;
