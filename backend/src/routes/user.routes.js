import e, { Router } from "express";
import { register, login, logout, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, forgotPassword, addToWishlist, removeFromWishlist, getWishlist, verifyEmailCode, verifyResetCode, resendSignupCode ,getRelatedProducts} from "../controllers/user.controller.js";
import { verifyJWT, requireUser } from "../middlewares/auth.middleware.js"
const router=Router()

router.route("/register").post(register)
router.route("/register/resend-code").post(resendSignupCode)
router.route("/verify-email").post(verifyEmailCode)
router.route("/login").post(login)
router.route("/logout").post(verifyJWT, requireUser, logout);
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, requireUser, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, requireUser, getCurrentUser)
router.route("/update-account").put(verifyJWT, requireUser, updateAccountDetails)
router.route("/forgot-password").post(forgotPassword)
router.route("/reset-password").post(verifyResetCode)
router.route("/wishlist").get(verifyJWT, requireUser, getWishlist)
router.route("/wishlist/add").post(verifyJWT, requireUser, addToWishlist)
router.route("/wishlist/remove").post(verifyJWT, requireUser, removeFromWishlist)
router.route("/related-products/:productId").get(getRelatedProducts);


export default router
