import axios from "axios";
import FormData from "form-data";
import Design from "../models/design.model.js";
import Order from "../models/order.models.js";
import { calculateAiGeneratedPrice } from "../utils/pricing.js";

const HF_HEADERS = {
  Authorization: `Bearer ${process.env.HF_TOKEN}`,
  Accept: "image/png",
};

const bannedWords = [
  "naruto", "goku", "luffy", "gojo", "levi",
  "marvel", "dc", "pokemon", "dragon ball",
  "realistic human", "nsfw", "nude", "celebrity",
];

const validatePrompt = (prompt) => {
  if (!prompt) return false;

  const lower = String(prompt).toLowerCase();

  if (!lower.includes("anime")) return false;

  for (const word of bannedWords) {
    if (lower.includes(word)) return false;
  }

  return true;
};

const buildTshirtPrompt = (userPrompt) => {
  return `
${userPrompt},

anime style illustration,
large bold anime artwork printed on t-shirt chest area,
highly visible central front print,
clean bold black outlines,
flat cel shading,
high contrast lighting,
vector art style,
centered composition,
isolated subject,
plain white background,
no scenery,
no background elements,
tshirt print design,
not a blank shirt,
graphic must be clearly visible,
screen print friendly,
minimal color palette,
sharp edges,
high detail but simplified shapes,
professional streetwear graphic design,
4k resolution
`;
};

const HF_BASE_URLS = [
  "https://api-inference.huggingface.co/models",
  "https://router.huggingface.co/hf-inference/models",
];

const BG_REMOVAL_MODELS = ["briaai/RMBG-1.4", "briaai/RMBG-2.0"];
const GENERATION_MODELS = [
  "Tongyi-MAI/Z-Image-Turbo",
  "runwayml/stable-diffusion-v1-5",
  "stabilityai/stable-diffusion-2-1",
  "stabilityai/stable-diffusion-xl-base-1.0",
];

const HF_REQUEST_TIMEOUT_MS = 120000;
const HF_MAX_RETRIES_PER_MODEL = 2;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const generateWithPollinations = async (prompt) => {
  const encodedPrompt = encodeURIComponent(
    `${prompt}, anime t-shirt mockup, visible printed artwork on chest, clean white background, no text watermark`
  );

  const response = await axios.get(
    `https://image.pollinations.ai/prompt/${encodedPrompt}`,
    {
      responseType: "arraybuffer",
      timeout: 90000,
      headers: {
        Accept: "image/png,image/jpeg,*/*",
      },
    }
  );

  const mimeType = response?.headers?.["content-type"] || "image/png";
  const base64 = Buffer.from(response.data).toString("base64");
  return `data:${mimeType};base64,${base64}`;
};

class RetryableGenerationError extends Error {
  constructor(message) {
    super(message);
    this.name = "RetryableGenerationError";
  }
}

const decodeHfError = (error) => {
  if (error instanceof RetryableGenerationError) {
    return error.message;
  }

  const data = error?.response?.data;

  if (Buffer.isBuffer(data)) {
    const raw = data.toString("utf8");
    try {
      const parsed = JSON.parse(raw);
      return parsed?.error || parsed?.message || raw;
    } catch {
      return raw;
    }
  }

  if (typeof data === "object" && data !== null) {
    return data.error || data.message || JSON.stringify(data);
  }

  return error?.message || "Unknown Hugging Face error";
};

const postToHfModel = async (modelName, payload, config = {}) => {
  let lastError;
  const finalConfig = {
    timeout: HF_REQUEST_TIMEOUT_MS,
    ...config,
  };

  for (const baseUrl of HF_BASE_URLS) {
    try {
      return await axios.post(`${baseUrl}/${modelName}`, payload, finalConfig);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
};

const postWithModelFallback = async (modelNames, payload, config = {}) => {
  let lastError;

  for (const modelName of modelNames) {
    for (let attempt = 1; attempt <= HF_MAX_RETRIES_PER_MODEL; attempt += 1) {
      try {
        const response = await postToHfModel(modelName, payload, config);
        return { response, modelName };
      } catch (error) {
        lastError = error;
        const message = decodeHfError(error).toLowerCase();
        const status = error?.response?.status;
        const shouldRetrySameModel =
          message.includes("loading") ||
          message.includes("estimated_time") ||
          message.includes("internal error") ||
          message.includes("we're working hard to fix this") ||
          message.includes("try again") ||
          message.includes("rate limit") ||
          status === 429 ||
          status === 500 ||
          status === 502 ||
          status === 503;
        const shouldTryNextModel =
          message.includes("not found") ||
          message.includes("does not exist") ||
          status === 404 ||
          status === 500 ||
          status === 502 ||
          status === 503 ||
          status === 504;

        if (shouldRetrySameModel && attempt < HF_MAX_RETRIES_PER_MODEL) {
          await wait(1500 * attempt);
          continue;
        }

        if (!shouldTryNextModel) {
          throw error;
        }
      }
    }
  }

  throw lastError;
};

export const generateAnimeTshirt = async (req, res) => {
  const { prompt, highResolutionExport, customPlacement } = req.body;
  const file = req.file;
  const normalizedPrompt = String(prompt || "").trim();
  const normalizeBoolean = (value) => value === true || value === "true";

  if (!file?.buffer) {
    return res.status(400).json({ message: "Image file required" });
  }

  if (!validatePrompt(normalizedPrompt)) {
    return res.status(400).json({
      message: "Only original anime-style designs allowed.",
    });
  }

  const selectedOptions = {
    highResolutionExport: normalizeBoolean(highResolutionExport),
    customPlacement: normalizeBoolean(customPlacement),
    backgroundRemoval: true,
  };

  if (!process.env.HF_TOKEN) {
    return res.status(500).json({
      success: false,
      message: "HF_TOKEN is missing on server",
    });
  }

  let design;
  const tshirtNegativePrompt = `
realistic photo,
3d render,
blurry,
low resolution,
complex background,
text watermark,
logo,
nsfw,
multiple characters cluttered,
blank t-shirt,
plain empty shirt,
no print on shirt
`;

  try {
    const designPayload = {
      user: req.user._id,
      prompt: normalizedPrompt,
      status: "processing",
      selectedOptions,
      originalImage: `data:${file.mimetype};base64,${Buffer.from(file.buffer).toString("base64")}`,
    };

    design = await Design.create(designPayload);

    const { response: bgRemoved } = await postWithModelFallback(
      BG_REMOVAL_MODELS,
      file.buffer,
      {
        headers: HF_HEADERS,
        responseType: "arraybuffer",
      }
    );

    const bgBase64 = Buffer.from(bgRemoved.data).toString("base64");
    design.backgroundRemovedImage = `data:image/png;base64,${bgBase64}`;
    await design.save();

    const form = new FormData();
    form.append("inputs", bgRemoved.data, {
      filename: "input.png",
      contentType: "image/png",
    });

    form.append(
      "parameters",
      JSON.stringify({
        prompt: buildTshirtPrompt(normalizedPrompt),
        negative_prompt: tshirtNegativePrompt,
        strength: 0.9,
        guidance_scale: 7.5,
      })
    );

    let generated;

    try {
      generated = (
        await postWithModelFallback(
          GENERATION_MODELS,
          form,
          {
            headers: {
              ...form.getHeaders(),
              Authorization: `Bearer ${process.env.HF_TOKEN}`,
              Accept: "image/png",
            },
            responseType: "arraybuffer",
          }
        )
      ).response;
    } catch (img2imgError) {
      const text2imgPayload = {
        inputs: buildTshirtPrompt(normalizedPrompt),
        parameters: {
          negative_prompt: tshirtNegativePrompt,
          guidance_scale: 7.5,
          num_inference_steps: 35,
        },
      };

      generated = (
        await postWithModelFallback(
          GENERATION_MODELS,
          text2imgPayload,
          {
            headers: {
              ...HF_HEADERS,
              "Content-Type": "application/json",
            },
            responseType: "arraybuffer",
          }
        )
      ).response;
    }

    const genBase64 = Buffer.from(generated.data).toString("base64");
    const generatedImage = `data:image/png;base64,${genBase64}`;
    const priceSnapshot = calculateAiGeneratedPrice({
      hasBackgroundRemoval: true,
      selectedOptions,
    });

    design.generatedImage = generatedImage;
    design.printReadyImage = design.printReadyImage || generatedImage;
    design.status = "completed";
    design.priceSnapshot = priceSnapshot;

    await design.save();

    return res.status(200).json({
      success: true,
      designId: design._id,
      image: generatedImage,
      selectedOptions,
      priceSnapshot,
    });

  } catch (error) {
    const hfErrorMessage = decodeHfError(error);
    console.error("Design generation error:", hfErrorMessage);

    const lowered = String(hfErrorMessage || "").toLowerCase();
    const isHfTransientInternal =
      lowered.includes("internal error") ||
      lowered.includes("working hard to fix") ||
      lowered.includes("service unavailable") ||
      lowered.includes("model is loading") ||
      error?.response?.status === 500 ||
      error?.response?.status === 502 ||
      error?.response?.status === 503 ||
      error?.response?.status === 504;

    if (design && isHfTransientInternal) {
      try {
        const fallbackGeneratedImage = await generateWithPollinations(buildTshirtPrompt(design.prompt));
        const fallbackPrice = calculateAiGeneratedPrice({
          hasBackgroundRemoval: Boolean(design.backgroundRemovedImage),
          selectedOptions: design.selectedOptions || {
            highResolutionExport: false,
            customPlacement: false,
            backgroundRemoval: Boolean(design.backgroundRemovedImage),
          },
        });

        design.generatedImage = fallbackGeneratedImage;
        design.printReadyImage = design.printReadyImage || fallbackGeneratedImage;
        design.status = "completed";
        design.priceSnapshot = fallbackPrice;
        design.rejectedReason = `HF transient fallback provider used: ${hfErrorMessage}`.slice(0, 500);
        await design.save();

        return res.status(200).json({
          success: true,
          designId: design._id,
          image: fallbackGeneratedImage,
          selectedOptions: design.selectedOptions,
          priceSnapshot: fallbackPrice,
          fallbackUsed: true,
          fallbackProvider: "pollinations",
          message: "Primary generation service was busy, so a fallback provider was used.",
        });
      } catch {
        throw new RetryableGenerationError("Generation service is temporarily busy. Please retry in a few seconds.");
      }
    }

    if (design) {
      design.status = "failed";
      design.rejectedReason = hfErrorMessage.slice(0, 500);
      await design.save();
    }

    const status = [429, 502, 503, 504].includes(error?.response?.status)
      ? error.response.status
      : error instanceof RetryableGenerationError
        ? 503
      : 500;

    return res.status(status).json({
      success: false,
      message: hfErrorMessage || "Design generation failed",
    });
  }
};

export const getMyDesigns = async (req, res) => {
  const designs = await Design.find({ user: req.user._id }).sort({ createdAt: -1 });
  return res.status(200).json({ success: true, designs });
};

export const getMyDesignById = async (req, res) => {
  const design = await Design.findOne({ _id: req.params.id, user: req.user._id });
  if (!design) {
    return res.status(404).json({ success: false, message: "Design not found" });
  }

  return res.status(200).json({ success: true, design });
};

export const updateMyDesignOptions = async (req, res) => {
  const design = await Design.findOne({ _id: req.params.id, user: req.user._id });
  if (!design) {
    return res.status(404).json({ success: false, message: "Design not found" });
  }

  if (design.isLocked) {
    return res.status(400).json({ success: false, message: "Design is locked and cannot be modified" });
  }

  const normalizeBoolean = (value) => value === true || value === "true";
  const selectedOptions = {
    highResolutionExport: normalizeBoolean(req.body.highResolutionExport),
    customPlacement: normalizeBoolean(req.body.customPlacement),
    backgroundRemoval: Boolean(design.backgroundRemovedImage),
  };

  const priceSnapshot = calculateAiGeneratedPrice({
    hasBackgroundRemoval: Boolean(design.backgroundRemovedImage),
    selectedOptions,
  });

  design.selectedOptions = selectedOptions;
  design.priceSnapshot = priceSnapshot;
  await design.save();

  return res.status(200).json({ success: true, design });
};

export const adminGetAllDesigns = async (req, res) => {
  const designs = await Design.find()
    .populate("user", "username email")
    .populate("lockedOrder", "status amount createdAt")
    .sort({ createdAt: -1 });
  return res.status(200).json({ success: true, designs });
};

export const adminModerateDesign = async (req, res) => {
  const { id } = req.params;
  const { action, reason = "" } = req.body;

  if (!["approve", "reject", "disable"].includes(action)) {
    return res.status(400).json({ success: false, message: "Invalid moderation action" });
  }

  const design = await Design.findById(id);
  if (!design) {
    return res.status(404).json({ success: false, message: "Design not found" });
  }

  if (action === "approve") {
    design.moderation.state = "approved";
    design.status = "approved";
  }
  if (action === "reject") {
    design.moderation.state = "rejected";
    design.status = "rejected";
  }
  if (action === "disable") {
    design.moderation.state = "disabled";
    design.status = "disabled";
  }

  design.moderation.reason = reason;
  design.moderation.reviewedBy = req.user?._id;
  design.moderation.reviewedAt = new Date();

  await design.save();

  return res.status(200).json({ success: true, design });
};

export const adminGetPrintableDesign = async (req, res) => {
  const design = await Design.findById(req.params.id)
    .populate("user", "username email")
    .populate("lockedOrder", "status amount createdAt");
  if (!design) {
    return res.status(404).json({ success: false, message: "Design not found" });
  }

  if (["failed", "rejected", "disabled"].includes(design.status)) {
    return res.status(400).json({
      success: false,
      message: `Design is not printable in current status: ${design.status}`,
    });
  }

  let orderStatus = design.lockedOrder?.status || "";

  if (!orderStatus && design.lockedOrder) {
    const linkedOrder = await Order.findById(design.lockedOrder).select("status");
    orderStatus = linkedOrder?.status || "";
  }

  if (orderStatus !== "paid") {
    return res.status(403).json({
      success: false,
      message: "Print view is allowed only for paid orders",
    });
  }

  const printableImage =
    design.printReadyImage ||
    design.generatedImage ||
    design.backgroundRemovedImage ||
    design.originalImage ||
    "";

  if (!printableImage) {
    return res.status(404).json({ success: false, message: "Printable image not available" });
  }

  return res.status(200).json({
    success: true,
    design: {
      _id: design._id,
      user: design.user,
      prompt: design.prompt,
      status: design.status,
      selectedOptions: design.selectedOptions,
      priceSnapshot: design.priceSnapshot,
      printableImage,
      generatedImage: design.generatedImage,
      printReadyImage: design.printReadyImage,
      orderStatus,
      lockedOrder: design.lockedOrder,
      createdAt: design.createdAt,
    },
  });
};

export const adminDeleteUnpaidDesign = async (req, res) => {
  const design = await Design.findById(req.params.id).populate("lockedOrder", "status");
  if (!design) {
    return res.status(404).json({ success: false, message: "Design not found" });
  }

  let orderStatus = design.lockedOrder?.status || "";
  if (!orderStatus && design.lockedOrder) {
    const linkedOrder = await Order.findById(design.lockedOrder).select("status");
    orderStatus = linkedOrder?.status || "";
  }

  if (orderStatus === "paid") {
    return res.status(403).json({
      success: false,
      message: "Paid designs cannot be deleted",
    });
  }

  await Design.findByIdAndDelete(design._id);
  return res.status(200).json({ success: true, message: "Unpaid design deleted" });
};