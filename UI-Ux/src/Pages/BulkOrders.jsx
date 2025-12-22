import React from 'react';
import { Link } from 'react-router-dom';

const BulkOrders = () => {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-red-600/20 via-zinc-900 to-zinc-950 text-center px-6 py-16">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_10%_10%,rgba(244,63,94,0.2),transparent_25%),radial-gradient(circle_at_90%_20%,rgba(244,63,94,0.18),transparent_25%),radial-gradient(circle_at_50%_80%,rgba(244,63,94,0.1),transparent_35%)]" aria-hidden="true" />
        <div className="relative max-w-4xl mx-auto space-y-4">
          <p className="text-sm uppercase tracking-[0.25em] text-red-300">Bulk Orders</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white">Event tees delivered on-time, on-budget</h1>
          <p className="text-lg text-zinc-200">
            Conventions, college fests, launches, or crew merch—we handle sizing, deadlines, and logistics while keeping prints sharp and consistent.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to="/products" className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-md transition">
              Pick a base
            </Link>
            <a href="#packages" className="border border-red-500 text-red-200 hover:text-white hover:border-white px-6 py-3 rounded-md transition">
              Packages
            </a>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12 grid gap-8 lg:grid-cols-3">
        {[ 
          {
            title: 'Guaranteed timelines',
            text: 'Clear production schedules with buffer time and milestone check-ins.'
          },
          {
            title: 'Sizing made easy',
            text: 'Shared sizing sheets and fit guides to avoid last-minute swaps.'
          },
          {
            title: 'Shipping options',
            text: 'Bulk to one location or split shipments for remote teams.'
          }
        ].map((item) => (
          <div key={item.title} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-lg shadow-red-500/5">
            <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
            <p className="text-zinc-300 text-sm leading-relaxed">{item.text}</p>
          </div>
        ))}
      </section>

      <section id="packages" className="max-w-5xl mx-auto px-6 pb-16 space-y-6">
        <div className="flex flex-col gap-3">
          <p className="text-sm uppercase tracking-[0.25em] text-red-300">Packages</p>
          <h2 className="text-3xl font-bold text-white">Choose how involved you want us</h2>
          <p className="text-zinc-300 max-w-3xl">All packages include print QC, fold/pack, and a single shipment. Add-ons: individual bagging, custom tags, rush production.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              name: 'Essentials',
              price: '50-150 pcs',
              points: ['Standard DTG or screen', '2 revisions on artwork', '7-10 day production']
            },
            {
              name: 'Pro',
              price: '150-500 pcs',
              points: ['Priority slotting', 'Pantone matching', '5-7 day production']
            },
            {
              name: 'Premier',
              price: '500+ pcs',
              points: ['Dedicated PM', 'Pre-production sample', 'Freight or split shipping']
            }
          ].map((pkg) => (
            <div key={pkg.name} className="rounded-xl border border-red-500/40 bg-zinc-900/80 p-6 flex flex-col gap-4">
              <div>
                <p className="text-red-300 text-xs uppercase tracking-[0.25em]">{pkg.price}</p>
                <h3 className="text-2xl font-semibold text-white">{pkg.name}</h3>
              </div>
              <ul className="space-y-2 text-sm text-zinc-200">
                {pkg.points.map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <span className="text-red-400">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <Link to="/payment" className="mt-auto bg-white text-zinc-900 px-4 py-2 rounded-md font-semibold hover:bg-red-50 transition text-center">
                Reserve a slot
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default BulkOrders;
