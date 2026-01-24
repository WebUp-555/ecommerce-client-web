/**
 * Dynamically load Razorpay script from CDN
 * Returns true if script is already loaded or successfully loaded
 * Returns false if loading fails
 */
export default async function loadRazorpayScript() {
  // Check if Razorpay is already loaded
  if (window.Razorpay) {
    return true;
  }

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    
    script.onload = () => {
      if (window.Razorpay) {
        resolve(true);
      } else {
        resolve(false);
      }
    };
    
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      resolve(false);
    };
    
    document.body.appendChild(script);
  });
}
