import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    items: [
      {
        itemType: {
          type: String,
          enum: ["catalog", "ai_generated"],
          required: true,
        },
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        designId: { type: mongoose.Schema.Types.ObjectId, ref: "Design" },
        title: String,
        price: Number,
        quantity: Number,
        selectedOptions: {
          highResolutionExport: { type: Boolean, default: false },
          customPlacement: { type: Boolean, default: false },
          backgroundRemoval: { type: Boolean, default: false },
        },
        priceSnapshot: {
          basePrice: { type: Number, default: 0 },
          discount: { type: Number, default: 0 },
          aiGenerationFee: { type: Number, default: 0 },
          backgroundRemovalFee: { type: Number, default: 0 },
          highResolutionFee: { type: Number, default: 0 },
          customPlacementFee: { type: Number, default: 0 },
          finalUnitPrice: { type: Number, default: 0 },
          currency: { type: String, default: "INR" },
        },
        prompt: String,
        generatedImage: String,
      },
    ],

    amount: { type: Number, required: true },

    // ✅ Delivery details stored in order
    shippingAddress: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      pincode: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
    },

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

    cancelledAt: { type: Date },
    cancelReason: { type: String, default: "" },

    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
