import mongoose, { Schema } from "mongoose";

const bannerSchema = new Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String, default: "" },
    badge: { type: String, default: "Featured" },
    ctaText: { type: String, default: "Shop Now" },
    ctaLink: { type: String, default: "/products" },
    image: { type: String, required: true },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

bannerSchema.index({ order: 1, createdAt: -1 });

export const Banner = mongoose.model("Banner", bannerSchema);
