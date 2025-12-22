import React from 'react';
import { Link } from 'react-router-dom';

const ArtistCollaborations = () => {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-red-600/20 via-zinc-900 to-zinc-950 text-center px-6 py-16">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_15%_15%,rgba(244,63,94,0.22),transparent_25%),radial-gradient(circle_at_85%_25%,rgba(244,63,94,0.18),transparent_25%),radial-gradient(circle_at_50%_85%,rgba(244,63,94,0.12),transparent_35%)]" aria-hidden="true" />
        <div className="relative max-w-4xl mx-auto space-y-4">
          <p className="text-sm uppercase tracking-[0.25em] text-red-300">Artist Collaborations</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white">Limited drops that respect the art</h1>
          <p className="text-lg text-zinc-200">
            We partner with illustrators, manga artists, and designers to produce short-run drops with premium blanks, specialty inks, and royalties baked in.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to="/wishlist" className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-md transition">
              Track a drop
            </Link>
            <a href="#collab" className="border border-red-500 text-red-200 hover:text-white hover:border-white px-6 py-3 rounded-md transition">
              How we collaborate
            </a>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12 grid gap-8 md:grid-cols-3">
        {[ 
          {
            title: 'Artist-first agreements',
            text: 'Clear splits, transparent reporting, and upfront advances for select launches.'
          },
          {
            title: 'Premium production',
            text: 'Oversize prints, foil, puff, and embroidered hits for collector-grade pieces.'
          },
          {
            title: 'Launch support',
            text: 'Campaign visuals, mockups, landing page sections, and fulfillment handled.'
          }
        ].map((item) => (
          <div key={item.title} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-lg shadow-red-500/5">
            <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
            <p className="text-zinc-300 text-sm leading-relaxed">{item.text}</p>
          </div>
        ))}
      </section>

      <section id="collab" className="max-w-5xl mx-auto px-6 pb-16 space-y-6">
        <div className="flex flex-col gap-3">
          <p className="text-sm uppercase tracking-[0.25em] text-red-300">Collaboration flow</p>
          <h2 className="text-3xl font-bold text-white">From concept to sold-out drop</h2>
          <p className="text-zinc-300 max-w-3xl">We move quickly while keeping you in control of creative and approvals.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            'Share your portfolio and theme',
            'Co-create the capsule (3-5 looks)',
            'Sample production with specialty inks',
            'Landing page sections + assets',
            'Timed drop with capped quantities',
            'Fulfillment, tracking, and post-drop report'
          ].map((step, idx) => (
            <div key={step} className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
              <span className="text-red-400 font-semibold">{String(idx + 1).padStart(2, '0')}</span>
              <p className="text-sm text-zinc-200 leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 flex flex-col gap-3">
          <h3 className="text-xl font-semibold text-white">Ready to collaborate?</h3>
          <p className="text-zinc-200 text-sm">Send us a quick intro with your portfolio and the type of drop you want to build. We respond within two business days.</p>
          <a href="/#contact" className="inline-flex w-fit bg-white text-zinc-900 px-4 py-2 rounded-md font-semibold hover:bg-red-50 transition">
            Start a collab thread
          </a>
        </div>
      </section>
    </div>
  );
};

export default ArtistCollaborations;
