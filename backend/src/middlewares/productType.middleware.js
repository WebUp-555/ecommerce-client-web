import { ApiError } from "../utils/ApiError.js";
import { Product } from "../models/products.model.js";
import Design from "../models/design.model.js";

export const resolveCartItemByType = async (req, _, next) => {
  const { itemType = "catalog", productId, designId } = req.body;

  if (!["catalog", "ai_generated"].includes(itemType)) {
    throw new ApiError(400, "Invalid itemType. Use catalog or ai_generated");
  }

  req.resolvedCartItem = { itemType };

  if (itemType === "catalog") {
    if (!productId) throw new ApiError(400, "productId is required for catalog item");

    const product = await Product.findById(productId);
    if (!product) throw new ApiError(404, "Product not found");
    if ((product.type || "catalog") !== "catalog") {
      throw new ApiError(400, "Only catalog products can be added as catalog items");
    }

    req.resolvedCartItem.product = product;
    return next();
  }

  if (!designId) throw new ApiError(400, "designId is required for ai_generated item");

  const design = await Design.findById(designId);
  if (!design) throw new ApiError(404, "Design not found");

  if (String(design.user) !== String(req.user?._id)) {
    throw new ApiError(403, "You cannot access another user's design");
  }

  if (design.isLocked) {
    throw new ApiError(400, "Design is locked after checkout and cannot be modified");
  }

  req.resolvedCartItem.design = design;
  return next();
};
