import mongoose, { Schema } from "mongoose";

const productSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["catalog", "ai_generated"],
    required: true,
    default: "catalog",
  },
  name: String,
  description: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  price: Number,
  discount: {
    type: Number,
    default: 0,
    min: 0,
  },
  stock: Number,
  image: String,
  images: [String],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  design: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Design",
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
});

export const Product = mongoose.model("Product", productSchema);
