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

    amount: { type: Number, required: true },

    status: {
      type: String,
      enum: [
        "pending_payment",
        "paid",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "failed",
      ],
      default: "pending_payment",
    },

    // ✅ Add here
    cancelledAt: { type: Date },
    cancelReason: { type: String, default: "" },

    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
