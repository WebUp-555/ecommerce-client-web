import mongoose, { Schema } from "mongoose";

// Pending signup records live briefly until email verification completes.
// expiresAt has a TTL index to auto-clean stale requests.
const pendingSignupSchema = new Schema({
  username: { type: String, required: true, trim: true, lowercase: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  password: { type: String, required: true }, // plaintext for short-lived pending state; User model will hash on save
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true });

export const PendingSignup = mongoose.model("pending_signups", pendingSignupSchema);
