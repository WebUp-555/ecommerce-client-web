import React from 'react';
import { Link } from 'react-router-dom';

const CustomTShirts = () => {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-red-600/20 via-zinc-900 to-zinc-950 text-center px-6 py-16">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_20%,rgba(244,63,94,0.2),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(244,63,94,0.15),transparent_25%),radial-gradient(circle_at_50%_80%,rgba(244,63,94,0.1),transparent_35%)]" aria-hidden="true" />
        <div className="relative max-w-4xl mx-auto space-y-4">
          <p className="text-sm uppercase tracking-[0.25em] text-red-300">Custom T-Shirts</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white">Designs that match your fandom and your fit</h1>
          <p className="text-lg text-zinc-200">
            Pick your art, colors, and finish. We calibrate sizing, fabric weight, and print methods so every shirt looks crisp and feels right.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to="/products" className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-md transition">
              Browse Blanks
            </Link>
            <a href="#process" className="border border-red-500 text-red-200 hover:text-white hover:border-white px-6 py-3 rounded-md transition">
              See the process
            </a>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12 grid gap-8 md:grid-cols-3">
        {[
          {
            title: 'Artwork ready help',
            text: 'Vectorize, color-separate, and prep files so the final print stays faithful to the original art.'
          },
          {
            title: 'Fabric + fit guidance',
            text: 'From airy 160 GSM to premium heavyweight, we match fabric and cut to the style you want.'
          },
          {
            title: 'Print methods that fit',
            text: 'DTG for gradients, screen for bold lines, puff and metallic inks for statement pieces.'
          }
        ].map((item) => (
          <div key={item.title} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-lg shadow-red-500/5">
            <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
            <p className="text-zinc-300 text-sm leading-relaxed">{item.text}</p>
          </div>
        ))}
      </section>

      <section id="process" className="max-w-5xl mx-auto px-6 pb-16">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 md:p-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-red-300">Process</p>
              <h2 className="text-3xl font-bold text-white">How we build your perfect tee</h2>
            </div>
            <Link to="/cart" className="bg-white text-zinc-900 px-5 py-2 rounded-md font-semibold hover:bg-red-50 transition">
              Start an order
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[ 
              'Moodboard + palette matching',
              'Mockups with 1-2 iterations',
              'Print test on your chosen fabric',
              'Size grading and placement checks',
              'Final approval + production run',
              'QC + fold/pack ready to ship'
            ].map((step, idx) => (
              <div key={step} className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
                <span className="text-red-400 font-semibold">{String(idx + 1).padStart(2, '0')}</span>
                <p className="text-sm text-zinc-200 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CustomTShirts;
