export const AI_PRICING = {
  baseTshirtPrice: 1600,
  aiGenerationFee: 100,
  backgroundRemovalFee: 50,
  highResolutionFee: 75,
  customPlacementFee: 25,
  currency: "INR",
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const calculateCatalogPrice = (product) => {
  const basePrice = toNumber(product?.price);
  const discount = Math.max(0, toNumber(product?.discount));
  const finalPrice = Math.max(0, basePrice - discount);

  return {
    basePrice,
    discount,
    finalPrice,
    currency: AI_PRICING.currency,
  };
};

export const calculateAiGeneratedPrice = ({
  hasBackgroundRemoval = false,
  selectedOptions = {},
} = {}) => {
  const backgroundRemoval = Boolean(selectedOptions.backgroundRemoval ?? hasBackgroundRemoval);
  const highResolutionExport = Boolean(selectedOptions.highResolutionExport);
  const customPlacement = Boolean(selectedOptions.customPlacement);

  const finalPrice =
    AI_PRICING.baseTshirtPrice +
    AI_PRICING.aiGenerationFee +
    (backgroundRemoval ? AI_PRICING.backgroundRemovalFee : 0) +
    (highResolutionExport ? AI_PRICING.highResolutionFee : 0) +
    (customPlacement ? AI_PRICING.customPlacementFee : 0);

  return {
    baseTshirtPrice: AI_PRICING.baseTshirtPrice,
    aiGenerationFee: AI_PRICING.aiGenerationFee,
    backgroundRemovalFee: backgroundRemoval ? AI_PRICING.backgroundRemovalFee : 0,
    highResolutionFee: highResolutionExport ? AI_PRICING.highResolutionFee : 0,
    customPlacementFee: customPlacement ? AI_PRICING.customPlacementFee : 0,
    finalPrice,
    currency: AI_PRICING.currency,
    selectedOptions: {
      backgroundRemoval,
      highResolutionExport,
      customPlacement,
    },
  };
};
