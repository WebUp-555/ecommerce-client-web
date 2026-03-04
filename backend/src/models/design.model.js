import mongoose from "mongoose";

const designSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    prompt: {
      type: String,
      required: true,
    },

    originalImage: {
      type: String, // Cloudinary / S3 URL
    },

    backgroundRemovedImage: {
      type: String,
    },

    generatedImage: {
      type: String,
    },

    printReadyImage: {
      type: String, // 300 DPI final export
    },

    status: {
      type: String,
      enum: ["processing", "completed", "failed", "approved", "rejected", "disabled"],
      default: "processing",
    },

    type: {
      type: String,
      enum: ["ai_generated"],
      default: "ai_generated",
    },

    moderation: {
      state: {
        type: String,
        enum: ["pending", "approved", "rejected", "disabled"],
        default: "pending",
      },
      reason: {
        type: String,
        default: "",
      },
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      reviewedAt: {
        type: Date,
      },
    },

    selectedOptions: {
      highResolutionExport: {
        type: Boolean,
        default: false,
      },
      customPlacement: {
        type: Boolean,
        default: false,
      },
      backgroundRemoval: {
        type: Boolean,
        default: false,
      },
    },

    priceSnapshot: {
      baseTshirtPrice: { type: Number, default: 0 },
      aiGenerationFee: { type: Number, default: 0 },
      backgroundRemovalFee: { type: Number, default: 0 },
      highResolutionFee: { type: Number, default: 0 },
      customPlacementFee: { type: Number, default: 0 },
      finalPrice: { type: Number, default: 0 },
      currency: { type: String, default: "INR" },
    },

    isPremiumGeneration: {
      type: Boolean,
      default: false,
    },

    isAddedToCart: {
      type: Boolean,
      default: false,
    },

    rejectedReason: {
      type: String,
    },

    isLocked: {
      type: Boolean,
      default: false,
    },

    lockedAt: {
      type: Date,
    },

    lockedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Design", designSchema);