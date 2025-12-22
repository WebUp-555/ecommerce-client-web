import mongoose, { Schema } from "mongoose";

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  price: Number,
  stock: Number,
  image: String,
  images: [String],
});

export const Product = mongoose.model("Product", productSchema);
