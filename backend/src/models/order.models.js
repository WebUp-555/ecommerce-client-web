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
        "PENDING_PAYMENT",
        "PAID",
        "ACCEPTED",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
        "FAILED",
        "REJECTED",
      ],
      default: "PENDING_PAYMENT",
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
