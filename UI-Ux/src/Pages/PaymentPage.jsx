import React, { useState, useEffect } from "react";
import { statesAndDistricts } from "../data/statesDistricts.js";
import { ShoppingBag, MapPin, Phone, User, CreditCard, Shield } from "lucide-react";
import { useCartStore } from "./cartStore.js";

const PaymentPage = () => {
  const { cartItems, totalAmount } = useCartStore();
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    pincode: "",
    city: "",
    state: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [orderSummary, setOrderSummary] = useState({
    subtotal: 0,
    shipping: 0,
    tax: 0,
    total: 0,
    itemCount: 0
  });

  const states = Object.keys(statesAndDistricts).sort();

  // Helpers to normalize and match state/district names from geocoder results
  const normalize = (val = "") =>
    val
      .toLowerCase()
      .replace(/[.,]/g, " ")
      .replace(/\b(state of|district of|district|dist\.?|dt\.?|mandal|taluk|taluka|sub\-division)\b/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const findStateByDistrict = (rawDistrict) => {
    const target = normalize(rawDistrict || "");
    if (!target) return null;
    return (
      Object.entries(statesAndDistricts).find(([state, dists]) =>
        dists.some((d) => normalize(d) === target || normalize(d).includes(target) || target.includes(normalize(d)))
      )?.[0] || null
    );
  };

  const findStateMatch = (rawState) => {
    const target = normalize(rawState || "");
    if (!target) return null;
    return (
      states.find((st) => normalize(st) === target) ||
      states.find((st) => normalize(st).includes(target)) ||
      states.find((st) => target.includes(normalize(st))) ||
      rawState
    );
  };

  const findDistrictMatch = (rawDistrict, stateKey) => {
    const options = statesAndDistricts[stateKey] || [];
    const target = normalize(rawDistrict || "");
    if (!target) return "";
    return (
      options.find((d) => normalize(d) === target) ||
      options.find((d) => normalize(d).includes(target)) ||
      options.find((d) => target.includes(normalize(d))) ||
      ""
    );
  };

  // Calculate order summary from cart
  useEffect(() => {
    const subtotal = totalAmount || cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 500 ? 0 : 50;
    const tax = Math.round(subtotal * 0.18); // 18% GST
    const total = subtotal + shipping + tax;
    
    setOrderSummary({
      subtotal,
      shipping,
      tax,
      total,
      itemCount: cartItems.length
    });
  }, [cartItems, totalAmount]);

  const handlePayment = () => {
    if (Object.values(formData).some((val) => val.trim() === "")) {
      alert("Please fill in all delivery details.");
      return;
    }
    
    if (orderSummary.itemCount === 0) {
      alert("Your cart is empty!");
      return;
    }
    
    setIsProcessing(true);
    // Razorpay integration will go here
    setTimeout(() => {
      alert("✅ Proceeding to payment...");
      setIsProcessing(false);
    }, 1000);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported in this browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          const addr = data.address || {};
          const stateCandidates = [addr.state, addr.state_district, addr.region, addr.state_code]
            .filter(Boolean)
            .map((s) => s.trim());

          const districtCandidates = [
            addr.district,
            addr.county,
            addr.city_district,
            addr.region,
            addr.state_district,
            addr.city,
            addr.town,
            addr.village,
            addr.suburb,
          ].filter(Boolean);

          // Step 1: try to match state directly from candidates
          let matchedState = stateCandidates.map(findStateMatch).find(Boolean) || null;

          // Step 2: if state missing, infer from district name
          if (!matchedState) {
            const inferred = districtCandidates.map(findStateByDistrict).find(Boolean);
            matchedState = inferred || null;
          }

          // Step 3: match district using the resolved state
          let matchedDistrict = matchedState
            ? districtCandidates
                .map((d) => findDistrictMatch(d, matchedState))
                .find((d) => d && d.length)
            : "";

          // Fallback: keep the raw district-like value if no match in dataset
          const fallbackDistrict = districtCandidates.find(Boolean) || "";

          setFormData((prev) => ({
            ...prev,
            address: data.display_name || prev.address,
            city: matchedDistrict || fallbackDistrict || prev.city,
            state: matchedState || prev.state,
            pincode: addr.postcode || prev.pincode,
          }));
        } catch (error) {
          console.error("Reverse geocoding failed", error);
          alert("Could not fetch address from location. Please enter manually.");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error("Geolocation error", error);
        alert("Location permission denied or unavailable.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-4">
            <ShoppingBag className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent mb-2">
            Secure Checkout
          </h1>
          <p className="text-gray-400">Complete your order with safe and secure payment</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Delivery Details Form - Takes 2 columns */}
          <div className="md:col-span-2">
            <div className="bg-zinc-900/50 backdrop-blur-lg rounded-2xl p-8 border border-zinc-800 shadow-2xl">
              <div className="flex items-center mb-6">
                <MapPin className="w-6 h-6 text-red-500 mr-3" />
                <h2 className="text-2xl font-bold">Delivery Details</h2>
              </div>

              <div className="space-y-5">
                {/* Full Name */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  />
                </div>

                {/* Phone Number */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  />
                </div>

                {/* Address */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-300">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Complete Address
                    </label>
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      disabled={isLocating}
                      className={`text-xs font-semibold px-3 py-1 rounded-full border transition ${
                        isLocating
                          ? "border-zinc-700 text-gray-500 cursor-not-allowed"
                          : "border-red-500 text-red-400 hover:bg-red-500/10"
                      }`}
                    >
                      {isLocating ? "Locating..." : "Use current location"}
                    </button>
                  </div>
                  <textarea
                    name="address"
                    placeholder="House no., Building name, Street, Area"
                    value={formData.address}
                    onChange={handleChange}
                    rows="3"
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition resize-none"
                  />
                </div>

                {/* State and District */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      State
                    </label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                    >
                      <option value="">Select State</option>
                      {states.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      District
                    </label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      disabled={!formData.state}
                      className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Select District</option>
                      {formData.state && statesAndDistricts[formData.state] ? (
                        statesAndDistricts[formData.state].map((district) => (
                          <option key={district} value={district}>
                            {district}
                          </option>
                        ))
                      ) : null}
                    </select>
                  </div>
                </div>

                {/* Pincode */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Pincode
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    placeholder="Enter pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    maxLength="6"
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-gradient-to-br from-red-900/20 to-pink-900/20 backdrop-blur-lg rounded-2xl p-6 border border-red-800/30 shadow-2xl sticky top-6">
              <h3 className="text-xl font-bold mb-6 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-red-500" />
                Order Summary
              </h3>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-300">
                  <span>Subtotal ({orderSummary.itemCount} items)</span>
                  <span className="font-semibold">₹{orderSummary.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Shipping</span>
                  <span className={`font-semibold ${orderSummary.shipping === 0 ? 'text-green-400' : ''}`}>
                    {orderSummary.shipping === 0 ? 'Free' : `₹${orderSummary.shipping}`}
                  </span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Tax (GST 18%)</span>
                  <span className="font-semibold">₹{orderSummary.tax.toLocaleString()}</span>
                </div>
                <div className="border-t border-zinc-700 pt-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span className="text-red-500">₹{orderSummary.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Secure Badge */}
              <div className="bg-zinc-800/50 rounded-lg p-4 mb-6 flex items-start">
                <Shield className="w-5 h-5 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-400 mb-1">Secure Payment</p>
                  <p className="text-xs text-gray-400">
                    Your payment information is encrypted and secure with Razorpay
                  </p>
                </div>
              </div>

              {/* Payment Button */}
              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 transform ${
                  isProcessing
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 hover:scale-105 shadow-lg hover:shadow-red-500/50"
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  "Proceed to Payment"
                )}
              </button>

              <p className="text-xs text-center text-gray-500 mt-4">
                By clicking, you agree to our Terms & Conditions
              </p>
            </div>
          </div>
        </div>

        {/* Payment Methods Info */}
        <div className="mt-10 text-center">
          <p className="text-gray-400 text-sm mb-3">Powered by Razorpay - Supports all payment methods</p>
          <div className="flex items-center justify-center gap-4 flex-wrap opacity-50">
            <span className="text-xs text-gray-500">Cards</span>
            <span className="text-gray-600">•</span>
            <span className="text-xs text-gray-500">UPI</span>
            <span className="text-gray-600">•</span>
            <span className="text-xs text-gray-500">Net Banking</span>
            <span className="text-gray-600">•</span>
            <span className="text-xs text-gray-500">Wallets</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
