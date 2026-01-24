import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { PendingSignup } from "../models/pendingSignup.model.js";
import e from "express";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/mailer.js";
import { Product } from "../models/products.model.js";

const generate4DigitCode = () => Math.floor(1000 + Math.random() * 9000).toString();
const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60000);

const generateAccessTokenAndRefreshToken = async(userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    
    return { accessToken, refreshToken };
  } catch(error) {
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
}

const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if ([username, email, password].some((field) => !field || field.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  const code = generate4DigitCode();
  const expires = addMinutes(new Date(), 10);

  await PendingSignup.findOneAndUpdate(
    { email: email.toLowerCase() },
    {
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password, // User model will hash on final creation
      code,
      expiresAt: expires,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  try {
    await sendEmail(
      email,
      "Your verification code",
      `<p>Your verification code is <b>${code}</b>. It expires in 10 minutes.</p>`
    );
  } catch (e) {
    console.error("Failed to send verification email:", e?.message);
  }

  return res.status(201).json(
    new ApiResponse(201, { email, otpSent: true }, "Verification code sent to email. Complete verification to activate your account.")
  );
});

const login = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "Username or email is required");
  }

  const query = { $or: [] };
  if (username) query.$or.push({ username });
  if (email) query.$or.push({ email });

  const user = await User.findOne(query);
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // Prevent admins from using the user login endpoint
  if ((user.role || "").toLowerCase() === "admin") {
    throw new ApiError(403, "Admins must sign in via the admin portal");
  }

  // Require verification for all users (legacy and new)
  if (!user.isEmailVerified) {
    throw new ApiError(403, "Email not verified. Please verify using the 4-digit code sent to your email.");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);

  // ✅ Make sure you're NOT modifying the user object here
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  console.log('Logged in user (should have ONE role):', loggedInUser);

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production"
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser, // ✅ This should have only ONE role field
          accessToken,
          refreshToken
        },
        "User logged in successfully"
      )
    );
});

const logout = asyncHandler(async (req, res) => {
  console.log('=== USER LOGOUT ===');
  console.log('User:', req.user.username);
  console.log('Email:', req.user.email);
  console.log('==================');

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1
      }
    },
    {
      new: true
    }
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production"
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if(!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id);
    
    if(!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
    
    if(incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }
  
    const options = {
      httpOnly: true,
      secure: true
    };
    
    const { accessToken, newRefreshToken } = await generateAccessTokenAndRefreshToken(user._id);
    
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken
          },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async(req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if(!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }
  
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async(req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async(req, res) => {
  const { username, email } = req.body;
  
  if(!username && !email) {
    throw new ApiError(400, "At least one field is required");
  }
  
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        username,
        email
      }
    },
    { new: true }
  ).select("-password -refreshToken");
  
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found with this email");

  const code = generate4DigitCode();
  user.passwordResetCode = code;
  user.passwordResetCodeExpires = addMinutes(new Date(), 10);
  await user.save({ validateBeforeSave: false });

  try {
    await sendEmail(
      email,
      "Your password reset code",
      `<p>Your password reset code is <b>${code}</b>. It expires in 10 minutes.</p>`
    );
  } catch (e) {
    console.error("Failed to send reset email:", e?.message);
  }

  return res.status(200).json(new ApiResponse(200, { email, otpSent: true }, "Reset code sent to email"));
});

const verifyEmailCode = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) throw new ApiError(400, "Email and code are required");

  const pending = await PendingSignup.findOne({ email: email.toLowerCase() });
  if (!pending) {
    throw new ApiError(404, "No pending signup found for this email. Please register again.");
  }

  if (pending.code !== code || !pending.expiresAt || new Date(pending.expiresAt) < new Date()) {
    throw new ApiError(400, "Invalid or expired verification code");
  }

  const existedUser = await User.findOne({ $or: [{ email: pending.email }, { username: pending.username }] });
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  await User.create({
    username: pending.username,
    email: pending.email,
    password: pending.password,
    isEmailVerified: true,
  });

  await PendingSignup.deleteOne({ _id: pending._id });

  return res.status(200).json(new ApiResponse(200, {}, "Email verified successfully. You can now sign in."));
});

const resendSignupCode = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");

  const pending = await PendingSignup.findOne({ email: email.toLowerCase() });
  if (!pending) throw new ApiError(404, "No pending signup found for this email. Please register again.");

  const code = generate4DigitCode();
  const expires = addMinutes(new Date(), 10);

  pending.code = code;
  pending.expiresAt = expires;
  await pending.save({ validateBeforeSave: false });

  try {
    await sendEmail(
      email,
      "Your new verification code",
      `<p>Your verification code is <b>${code}</b>. It expires in 10 minutes.</p>`
    );
  } catch (e) {
    console.error("Failed to resend verification email:", e?.message);
  }

  return res.status(200).json(new ApiResponse(200, {}, "Verification code resent"));
});

const verifyResetCode = asyncHandler(async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    throw new ApiError(400, "Email, code and new password are required");
  }

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  if (
    !user.passwordResetCode ||
    user.passwordResetCode !== code ||
    !user.passwordResetCodeExpires ||
    new Date(user.passwordResetCodeExpires) < new Date()
  ) {
    throw new ApiError(400, "Invalid or expired reset code");
  }

  user.password = newPassword;
  user.passwordResetCode = undefined;
  user.passwordResetCodeExpires = undefined;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, {}, "Password reset successfully"));
});

const addToWishlist = asyncHandler(async(req, res) => {
  const { productId } = req.body;
  
  if(!productId) {
    throw new ApiError(400, "Product ID is required");
  }
  
  const user = await User.findById(req.user?._id);
  
  // Check if product already exists in wishlist
  const existsInWishlist = user.wishlist.some(
    item => item.productId.toString() === productId
  );
  
  if(existsInWishlist) {
    throw new ApiError(400, "Product already in wishlist");
  }
  
  user.wishlist.push({
    productId,
    addedAt: new Date()
  });
  
  await user.save({ validateBeforeSave: false });
  
  return res
    .status(200)
    .json(new ApiResponse(200, user.wishlist, "Product added to wishlist successfully"));
});

const removeFromWishlist = asyncHandler(async(req, res) => {
  const { productId } = req.body;
  
  if(!productId) {
    throw new ApiError(400, "Product ID is required");
  }
  
  const user = await User.findById(req.user?._id);
  
  user.wishlist = user.wishlist.filter(
    item => item.productId.toString() !== productId
  );
  
  await user.save({ validateBeforeSave: false });
  
  return res
    .status(200)
    .json(new ApiResponse(200, user.wishlist, "Product removed from wishlist successfully"));
});

const getWishlist = asyncHandler(async(req, res) => {
  const user = await User.findById(req.user?._id)
    .populate({
      path: 'wishlist.productId',
      select: 'name price image images description category stock',
      populate: {
        path: 'category',
        select: 'name'
      }
    })
    .select('wishlist');
  
  return res
    .status(200)
    .json(new ApiResponse(200, user.wishlist, "Wishlist fetched successfully"));
});

// Add this temporary debug endpoint
const debugUser = asyncHandler(async (req, res) => {
  const { email } = req.query;
  
  // Get raw document from MongoDB
  const rawUser = await mongoose.connection.db
    .collection('users')
    .findOne({ email });
  
  console.log('Raw MongoDB document:', JSON.stringify(rawUser, null, 2));
  
  // Get via Mongoose
  const user = await User.findOne({ email });
  console.log('Mongoose document:', user.toObject());
  
  return res.json({
    raw: rawUser,
    mongoose: user
  });
});

export const getRelatedProducts = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  // 1️⃣ Find the current product
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // 2️⃣ Fetch related products (same category, exclude current)
  const relatedProducts = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
    stock: { $gt: 0 } // optional but recommended
  })
    .populate('category', 'name')
    .limit(8)
    .sort({ createdAt: -1 });

  // 3️⃣ Send response
  res.status(200).json({
    success: true,
    products: relatedProducts
  });
});


export {
  generateAccessTokenAndRefreshToken,
  register,
  login,
  logout,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  forgotPassword,
  verifyEmailCode,
  verifyResetCode,
  resendSignupCode,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  debugUser
}