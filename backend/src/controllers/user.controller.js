
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { PendingSignup } from "../models/pendingSignup.model.js";
import e from "express";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/mailer.js";
import { Product } from "../models/products.model.js";
import { Contact } from "../models/contact.model.js";
import { Cart } from "../models/addToCart.model.js";
import Design from "../models/design.model.js";
import { calculateAiGeneratedPrice, calculateCatalogPrice } from "../utils/pricing.js";

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
  const { username, email, currentPassword } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "At least one field is required");
  }

  const currentUser = await User.findById(req.user?._id);
  if (!currentUser) {
    throw new ApiError(404, "User not found");
  }

  const updates = {};
  let emailVerificationTriggered = false;
  let verificationTargetEmail = "";

  if (typeof username === "string" && username.trim()) {
    const normalizedUsername = username.trim().toLowerCase();

    if (normalizedUsername !== currentUser.username) {
      const existingUsername = await User.findOne({ username: normalizedUsername, _id: { $ne: currentUser._id } });
      if (existingUsername) {
        throw new ApiError(409, "Username already exists");
      }
      updates.username = normalizedUsername;
    }
  }

  if (typeof email === "string" && email.trim()) {
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail !== currentUser.email) {
      if (!currentPassword || !currentPassword.trim()) {
        throw new ApiError(400, "Current password is required to change email");
      }

      const isPasswordCorrect = await currentUser.isPasswordCorrect(currentPassword);
      if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid current password");
      }

      const existingEmail = await User.findOne({ email: normalizedEmail, _id: { $ne: currentUser._id } });
      if (existingEmail) {
        throw new ApiError(409, "Email already exists");
      }

      const code = generate4DigitCode();
      const expires = addMinutes(new Date(), 10);

      updates.pendingEmail = normalizedEmail;
      updates.emailVerificationCode = code;
      updates.emailVerificationCodeExpires = expires;
      emailVerificationTriggered = true;
      verificationTargetEmail = normalizedEmail;
    }
  }

  if (!Object.keys(updates).length) {
    throw new ApiError(400, "No changes detected");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: updates },
    { new: true }
  ).select("-password -refreshToken");

  if (emailVerificationTriggered) {
    try {
      await sendEmail(
        verificationTargetEmail,
        "Confirm your new email",
        `<p>Your code to confirm your new email is <b>${updates.emailVerificationCode}</b>. It expires in 10 minutes.</p>`
      );
    } catch (e) {
      throw new ApiError(500, "Failed to send verification code to new email");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {
            user,
            requiresEmailVerification: true,
            pendingEmail: verificationTargetEmail
          },
          "Verification code sent to your new email. Enter the code to complete email update."
        )
      );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const verifyEmailUpdateCode = asyncHandler(async (req, res) => {
  const { code } = req.body;

  if (!code) {
    throw new ApiError(400, "Verification code is required");
  }

  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.pendingEmail || !user.emailVerificationCode || !user.emailVerificationCodeExpires) {
    throw new ApiError(400, "No pending email change request found");
  }

  if (new Date(user.emailVerificationCodeExpires) < new Date()) {
    throw new ApiError(400, "Verification code expired. Please request email change again.");
  }

  if (user.emailVerificationCode !== String(code).trim()) {
    throw new ApiError(400, "Invalid verification code");
  }

  const existingEmail = await User.findOne({ email: user.pendingEmail, _id: { $ne: user._id } });
  if (existingEmail) {
    throw new ApiError(409, "Email already exists");
  }

  user.email = user.pendingEmail;
  user.pendingEmail = undefined;
  user.emailVerificationCode = undefined;
  user.emailVerificationCodeExpires = undefined;
  user.isEmailVerified = true;
  await user.save({ validateBeforeSave: false });

  const safeUser = await User.findById(user._id).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, safeUser, "Email updated and verified successfully"));
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

export const submitContactForm = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body; 
  if (!name || !email || !subject || !message) {
    throw new ApiError(400, "All fields are required");
  }
  const emailverify=await User.findOne({email})
  if(!emailverify){
    throw new ApiError(404, "No user found with this email");
  }
  
  const contact = await Contact.create({
    name,
    email,
    subject,
    message
  });
  
  return res.status(201).json(new ApiResponse(201, contact, "Contact form submitted successfully"));
});

export const addToCart = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "User not authenticated");
  }

  let {
    itemType = "catalog",
    productId,
    designId,
    quantity,
    selectedOptions = {},
    generatedImageSnapshot,
  } = req.body;
  quantity = Number(quantity) || 0;

  if (quantity < 1) {
    throw new ApiError(400, "Valid quantity is required");
  }

  if (!["catalog", "ai_generated"].includes(itemType)) {
    throw new ApiError(400, "Invalid itemType");
  }

  const resolvedItem = req.resolvedCartItem || {};

  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  if (itemType === "catalog") {
    const product = resolvedItem.product || await Product.findById(productId);
    if (!product) throw new ApiError(404, "Product not found");

    const existingItem = cart.items.find((item) => item.itemType === "catalog" && item.product?.toString() === String(product._id));
    const existingQuantity = existingItem?.quantity || 0;

    if (product.stock < (quantity + existingQuantity)) {
      throw new ApiError(400, `Insufficient stock. Available: ${product.stock}, Requested: ${quantity + existingQuantity}`);
    }

    const pricing = calculateCatalogPrice(product);
    const itemIndex = cart.items.findIndex((item) => item.itemType === "catalog" && item.product?.toString() === String(product._id));

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
      cart.items[itemIndex].priceSnapshot = {
        unitPrice: pricing.finalPrice,
        finalPrice: pricing.finalPrice,
        currency: pricing.currency,
      };
    } else {
      cart.items.push({
        itemType: "catalog",
        product: product._id,
        quantity,
        selectedOptions: {
          highResolutionExport: false,
          customPlacement: false,
          backgroundRemoval: false,
        },
        priceSnapshot: {
          unitPrice: pricing.finalPrice,
          finalPrice: pricing.finalPrice,
          currency: pricing.currency,
        },
      });
    }
  } else {
    const design = resolvedItem.design || await Design.findById(designId);
    if (!design) throw new ApiError(404, "Design not found");
    if (String(design.user) !== String(userId)) {
      throw new ApiError(403, "You cannot access another user's design");
    }
    if (design.isLocked) {
      throw new ApiError(400, "Design is locked after checkout and cannot be modified");
    }

    const pricing = calculateAiGeneratedPrice({
      hasBackgroundRemoval: Boolean(design.backgroundRemovedImage),
      selectedOptions,
    });

    const itemIndex = cart.items.findIndex((item) => item.itemType === "ai_generated" && item.design?.toString() === String(design._id));

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = quantity;
      cart.items[itemIndex].selectedOptions = pricing.selectedOptions;
      cart.items[itemIndex].generatedImageSnapshot =
        design.generatedImage ||
        design.printReadyImage ||
        design.backgroundRemovedImage ||
        generatedImageSnapshot ||
        "";
      cart.items[itemIndex].priceSnapshot = {
        unitPrice: pricing.finalPrice,
        finalPrice: pricing.finalPrice,
        currency: pricing.currency,
      };
    } else {
      cart.items.push({
        itemType: "ai_generated",
        design: design._id,
        quantity,
        selectedOptions: pricing.selectedOptions,
        generatedImageSnapshot:
          design.generatedImage ||
          design.printReadyImage ||
          design.backgroundRemovedImage ||
          generatedImageSnapshot ||
          "",
        priceSnapshot: {
          unitPrice: pricing.finalPrice,
          finalPrice: pricing.finalPrice,
          currency: pricing.currency,
        },
      });
    }

    design.isAddedToCart = true;
    design.selectedOptions = pricing.selectedOptions;
    design.priceSnapshot = pricing;
    await design.save();
  }

  await cart.save();

  res.status(200).json({ success: true, message: "Item added to cart successfully", cart });
});

export const removeFromCart = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "User not authenticated");
  }

  const { itemType = "catalog", productId, designId } = req.body;
  if (itemType === "catalog" && !productId) {
    throw new ApiError(400, "productId is required");
  }
  if (itemType === "ai_generated" && !designId) {
    throw new ApiError(400, "designId is required");
  }

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  const initialLength = cart.items.length;
  cart.items = cart.items.filter((item) => {
    if (itemType === "catalog") {
      return !(item.itemType === "catalog" && item.product?.toString() === productId);
    }
    return !(item.itemType === "ai_generated" && item.design?.toString() === designId);
  });

  if (cart.items.length === initialLength) {
    throw new ApiError(404, "Item not found in cart");
  }

  await cart.save();
  res.status(200).json({ success: true, message: "Item removed from cart successfully", cart });
});

export const getCart = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "User not authenticated");
  }

  const cart = await Cart.findOne({ user: userId })
    .populate("items.product")
    .populate("items.design");
  if (!cart) {
    return res.status(200).json({ success: true, cart: null, totalAmount: 0, items: [] });
  }

  const validItems = [];
  let totalAmount = 0;

  for (const item of cart.items) {
    const qty = Number(item.quantity) || 0;
    if (qty <= 0) continue;

    if (item.itemType === "catalog") {
      if (!item.product) continue;
      const pricing = calculateCatalogPrice(item.product);
      item.priceSnapshot = {
        unitPrice: pricing.finalPrice,
        finalPrice: pricing.finalPrice,
        currency: pricing.currency,
      };
      totalAmount += pricing.finalPrice * qty;
      validItems.push(item);
      continue;
    }

    let designDoc = item.design;
    if (!designDoc || !designDoc._id) {
      if (item.design) {
        designDoc = await Design.findById(item.design);
      }
    }

    if (!designDoc) continue;
    if (String(designDoc.user) !== String(userId)) continue;

    const generatedImageSnapshot =
      designDoc.generatedImage ||
      designDoc.printReadyImage ||
      designDoc.backgroundRemovedImage ||
      designDoc.originalImage ||
      item.generatedImageSnapshot ||
      "";

    item.generatedImageSnapshot = generatedImageSnapshot;
    item.design = designDoc;

    const pricing = calculateAiGeneratedPrice({
      hasBackgroundRemoval: Boolean(designDoc.backgroundRemovedImage),
      selectedOptions: item.selectedOptions || {},
    });
    item.selectedOptions = pricing.selectedOptions;
    item.priceSnapshot = {
      unitPrice: pricing.finalPrice,
      finalPrice: pricing.finalPrice,
      currency: pricing.currency,
    };
    totalAmount += pricing.finalPrice * qty;
    validItems.push(item);
  }

  cart.items = validItems;
  await cart.save();

  const responseCart = cart.toObject({ virtuals: false });
  responseCart.items = (responseCart.items || []).map((item) => {
    const resolvedImage =
      item.itemType === "ai_generated"
        ? (
            item.generatedImageSnapshot ||
            item.design?.generatedImage ||
            item.design?.printReadyImage ||
            item.design?.backgroundRemovedImage ||
            item.design?.originalImage ||
            ""
          )
        : (item.product?.image || item.product?.productImage || "");

    return {
      ...item,
      resolvedImage,
    };
  });

  res.status(200).json({ success: true, cart: responseCart, totalAmount });
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
  verifyEmailUpdateCode,
  forgotPassword,
  verifyEmailCode,
  verifyResetCode,
  resendSignupCode,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  debugUser,
  
  
}
