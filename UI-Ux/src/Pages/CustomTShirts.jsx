import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { generateAnimeDesign, getMyDesignById } from "../Api/designApi";
import { useCartStore } from "./cartStore";

const FLOW_STEPS = [
  "Prompt validated (anime-only)",
  "Design record created",
  "Background removed (if reference image provided)",
  "Image refined via img2img or text2img",
  "Design saved as completed",
  "Failure updates DB properly",
];

const DESIGN_SESSION_KEY = "custom_anime_tshirt_session_v1";

const CustomTShirts = () => {
  const navigate = useNavigate();
  const addToCart = useCartStore((state) => state.addToCart);

  const [prompt, setPrompt] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [generatedImage, setGeneratedImage] = useState("");
  const [designId, setDesignId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [highResolutionExport, setHighResolutionExport] = useState(false);
  const [customPlacement, setCustomPlacement] = useState(false);
  const [backgroundRemovalUsed, setBackgroundRemovalUsed] = useState(false);
  const [priceSnapshot, setPriceSnapshot] = useState(null);
  const [isCartBusy, setIsCartBusy] = useState(false);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const raw = localStorage.getItem(DESIGN_SESSION_KEY);
        if (!raw) return;

        const session = JSON.parse(raw);
        if (!session?.designId) return;

        setPrompt(session.prompt || "");
        setDesignId(session.designId);
        setGeneratedImage(session.generatedImage || "");
        setQuantity(Number(session.quantity) || 1);
        setHighResolutionExport(Boolean(session.highResolutionExport));
        setCustomPlacement(Boolean(session.customPlacement));
        setBackgroundRemovalUsed(Boolean(session.backgroundRemovalUsed));
        setPriceSnapshot(session.priceSnapshot || null);
        setSuccess("Restored your last generated design.");

        const response = await getMyDesignById(session.designId);
        const freshDesign = response?.design;
        if (freshDesign?.generatedImage) {
          setGeneratedImage(freshDesign.generatedImage);
          setPriceSnapshot(freshDesign.priceSnapshot || session.priceSnapshot || null);
          setBackgroundRemovalUsed(Boolean(freshDesign.selectedOptions?.backgroundRemoval));
        }
      } catch {
        localStorage.removeItem(DESIGN_SESSION_KEY);
      }
    };

    restoreSession();
  }, []);

  useEffect(() => {
    if (!designId || !generatedImage) return;

    const payload = {
      designId,
      generatedImage,
      prompt,
      quantity,
      highResolutionExport,
      customPlacement,
      backgroundRemovalUsed,
      priceSnapshot,
      savedAt: Date.now(),
    };

    localStorage.setItem(DESIGN_SESSION_KEY, JSON.stringify(payload));
  }, [
    designId,
    generatedImage,
    prompt,
    quantity,
    highResolutionExport,
    customPlacement,
    backgroundRemovalUsed,
    priceSnapshot,
  ]);

  const unitEstimatedPrice =
    priceSnapshot?.finalPrice ??
    (1600 + 100 + (backgroundRemovalUsed ? 50 : 0) + (highResolutionExport ? 75 : 0) + (customPlacement ? 25 : 0));
  const totalEstimatedPrice = unitEstimatedPrice * quantity;

  const stepClass = useMemo(
    () =>
      FLOW_STEPS.map((_, idx) => {
        if (!isGenerating && !generatedImage) {
          return "border-zinc-800 bg-zinc-900/80 text-zinc-300";
        }
        if (generatedImage) {
          return "border-green-600/60 bg-green-900/15 text-green-300";
        }
        if (idx < activeStep) {
          return "border-green-600/60 bg-green-900/15 text-green-300";
        }
        if (idx === activeStep) {
          return "border-red-500 bg-red-500/15 text-red-200";
        }
        return "border-zinc-800 bg-zinc-900/80 text-zinc-300";
      }),
    [activeStep, generatedImage, isGenerating]
  );

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setError("");
  };

  const runStepAnimation = async () => {
    for (let index = 0; index < FLOW_STEPS.length - 1; index += 1) {
      setActiveStep(index);
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
  };

  const handleGenerate = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setGeneratedImage("");
    setDesignId("");
    setBackgroundRemovalUsed(Boolean(imageFile));

    if (!prompt.trim()) {
      setError("Enter an anime-only prompt.");
      return;
    }

    if (!imageFile) {
      setError("Reference image is required.");
      return;
    }

    setIsGenerating(true);
    setActiveStep(0);

    try {
      await Promise.all([
        runStepAnimation(),
        (async () => {
          const response = await generateAnimeDesign({
            prompt: prompt.trim(),
            imageFile,
            highResolutionExport,
            customPlacement,
          });

          if (!response?.success || !response?.image) {
            throw new Error(response?.message || "Design generation failed");
          }

          setGeneratedImage(response.image);
          setDesignId(response.designId || "");
          setPriceSnapshot(response.priceSnapshot || null);
          setBackgroundRemovalUsed(Boolean(response?.selectedOptions?.backgroundRemoval));
          setSuccess("Your anime T-shirt design is ready to purchase.");
        })(),
      ]);
    } catch (apiError) {
      setError(apiError?.message || "Design generation failed");
      setActiveStep(FLOW_STEPS.length - 1);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTryAnotherDesign = () => {
    setGeneratedImage("");
    setDesignId("");
    setPriceSnapshot(null);
    setSuccess("");
    setActiveStep(0);
    setBackgroundRemovalUsed(false);
    localStorage.removeItem(DESIGN_SESSION_KEY);
  };

  const addAiDesignToCart = async ({ goToPayment = false } = {}) => {
    if (!generatedImage) {
      setError("Generate your design first.");
      return;
    }

    if (!designId) {
      setError("Design ID is missing. Please generate again.");
      return;
    }

    setIsCartBusy(true);
    setError("");

    try {
      await addToCart({
        itemType: "ai_generated",
        designId,
        quantity,
        generatedImageSnapshot: generatedImage,
        selectedOptions: {
          highResolutionExport,
          customPlacement,
          backgroundRemoval: Boolean(imageFile),
        },
      });
      if (goToPayment) {
        navigate("/payment", { state: { designId } });
        return;
      }
      setSuccess("AI generated T-shirt item added to cart.");
      navigate("/cart", { state: { designId } });
    } catch (cartError) {
      setError(cartError?.message || "Could not add item to cart");
    } finally {
      setIsCartBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 py-10 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <section className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-red-700/20 via-zinc-900 to-zinc-950 p-8 md:p-10">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_15%_15%,rgba(244,63,94,0.25),transparent_35%),radial-gradient(circle_at_85%_0%,rgba(244,63,94,0.18),transparent_35%)]" aria-hidden="true" />
          <div className="relative flex flex-col gap-4">
            <p className="text-sm tracking-[0.25em] uppercase text-red-300">Create Your Own Anime T-Shirt</p>
            <h1 className="text-3xl md:text-5xl font-extrabold">Turn your anime idea into a print-ready design</h1>
            <p className="text-zinc-300 max-w-3xl">
              Upload your reference image, write an anime-only prompt, and generate a production-ready concept. Once it looks right, choose quantity, add to cart, and proceed to payment.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a href="#anime-generator" className="rounded-md bg-red-500 px-5 py-2.5 font-semibold hover:bg-red-600 transition">Start Creating</a>
              <Link to="/products" className="rounded-md border border-zinc-700 px-5 py-2.5 text-zinc-100 hover:border-red-500 hover:text-red-200 transition">Browse T-Shirt Bases</Link>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]" id="anime-generator">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 md:p-8 space-y-5">
            <h2 className="text-2xl font-bold">Generate Design</h2>
            <form onSubmit={handleGenerate} className="space-y-5">
              <div>
                <label className="block text-sm mb-2 text-zinc-200">Anime prompt</label>
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Example: anime samurai cat warrior, cel shaded, dynamic pose, tshirt design"
                  rows={4}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-white placeholder:text-zinc-500 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-zinc-200">Reference image (required)</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageChange}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-red-500 file:px-3 file:py-2 file:text-white hover:file:bg-red-600"
                />
                <p className="mt-2 text-xs text-zinc-400">
                  Upload a clear image. It is required for background removal and final T-shirt design generation.
                </p>
              </div>

              {preview && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                  <img src={preview} alt="Reference preview" className="h-48 w-full rounded-md object-contain bg-zinc-900" />
                </div>
              )}

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full rounded-lg bg-red-500 py-3 font-semibold hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGenerating ? "Generating anime design..." : "Create Anime T-Shirt Design"}
              </button>
            </form>

            {error && <p className="rounded-md border border-red-700 bg-red-900/30 px-3 py-2 text-sm text-red-200">{error}</p>}
            {success && <p className="rounded-md border border-green-700 bg-green-900/20 px-3 py-2 text-sm text-green-200">{success}</p>}
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 md:p-8 space-y-4">
            <h2 className="text-2xl font-bold">Generation Pipeline</h2>
            <p className="text-sm text-zinc-400">Step-by-step backend flow</p>
            <div className="space-y-3">
              {FLOW_STEPS.map((step, idx) => (
                <div key={step} className={`rounded-lg border px-3 py-3 text-sm ${stepClass[idx]}`}>
                  <span className="font-semibold mr-2">{idx + 1}.</span>
                  {step}
                </div>
              ))}
            </div>
          </section>
        </div>

        {generatedImage && (
          <section className="grid gap-6 lg:grid-cols-2 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 md:p-8">
            <div>
              <h3 className="text-2xl font-bold mb-3">Your Generated Anime Design</h3>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                <img src={generatedImage} alt="Generated anime t-shirt design" className="h-80 w-full rounded-md object-contain bg-zinc-900" />
              </div>
              {designId && <p className="mt-3 text-xs text-zinc-400">Design ID: {designId}</p>}
            </div>

            <div className="rounded-xl border border-red-800/50 bg-red-950/10 p-5 space-y-5">
              <h3 className="text-2xl font-bold">Ready to purchase?</h3>
              <p className="text-zinc-300 text-sm">
                Choose quantity and custom options, then add to cart or buy now directly.
              </p>

              <div>
                <label className="block text-sm mb-2 text-zinc-200">Customization</label>
                <div className="space-y-2 text-sm">
                  <label className="flex items-center gap-2 text-zinc-200">
                    <input
                      type="checkbox"
                      checked={highResolutionExport}
                      onChange={(e) => setHighResolutionExport(e.target.checked)}
                    />
                    High resolution export (+₹75)
                  </label>
                  <label className="flex items-center gap-2 text-zinc-200">
                    <input
                      type="checkbox"
                      checked={customPlacement}
                      onChange={(e) => setCustomPlacement(e.target.checked)}
                    />
                    Custom placement (+₹25)
                  </label>
                </div>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-sm text-zinc-300">
                <p>Base T-shirt: ₹1600</p>
                <p>AI generation: ₹100</p>
                <p>Background removal: {backgroundRemovalUsed ? '₹50' : '₹0'}</p>
                <p>High resolution export: {highResolutionExport ? '₹75' : '₹0'}</p>
                <p>Custom placement: {customPlacement ? '₹25' : '₹0'}</p>
                <p>Unit price: ₹{unitEstimatedPrice}</p>
                <p>Count: {quantity}</p>
                <p className="mt-2 font-semibold text-white">
                  Estimated total: ₹{totalEstimatedPrice}
                </p>
              </div>

              <div>
                <label className="block text-sm mb-2 text-zinc-200">Count</label>
                <div className="inline-flex rounded-lg border border-zinc-700 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800"
                  >
                    -
                  </button>
                  <div className="px-5 py-2 bg-zinc-950 min-w-[56px] text-center font-semibold">{quantity}</div>
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.min(10, prev + 1))}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  disabled={isCartBusy}
                  onClick={() => addAiDesignToCart({ goToPayment: false })}
                  className="rounded-lg bg-zinc-100 text-zinc-900 py-2.5 font-semibold hover:bg-white disabled:opacity-60"
                >
                  Add to Cart
                </button>
                <button
                  type="button"
                  disabled={isCartBusy}
                  onClick={() => addAiDesignToCart({ goToPayment: true })}
                  className="rounded-lg bg-red-500 py-2.5 font-semibold hover:bg-red-600 disabled:opacity-60"
                >
                  Buy Now
                </button>
              </div>

              <button
                type="button"
                onClick={handleTryAnotherDesign}
                className="w-full rounded-lg border border-zinc-700 py-2.5 text-zinc-200 hover:bg-zinc-900"
              >
                Not satisfied? Try another design
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default CustomTShirts;
