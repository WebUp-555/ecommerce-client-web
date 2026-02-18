import React from 'react';

const SuccessMessage = ({ message }) => {
  if (!message) return null;

  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-green-500/50 bg-green-500/10 px-4 py-3 text-green-200 shadow-[0_8px_24px_rgba(34,197,94,0.15)]"
      role="status"
      aria-live="polite"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-0.5 h-4 w-4 shrink-0 text-green-400"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M9 12l2 2 4-4" />
      </svg>
      <span className="block text-sm leading-relaxed">{message}</span>
    </div>
  );
};

export default SuccessMessage;
