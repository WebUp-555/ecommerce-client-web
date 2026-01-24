// models/Order.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        title: String,
        price: Number,
        quantity: Number,
      },
    ],

    amount: { type: Number, required: true }, // in rupees
    status: { type: String, enum: ["PENDING", "PAID", "FAILED"], default: "PENDING" },

    paymentProvider: { type: String, default: "RAZORPAY" },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
