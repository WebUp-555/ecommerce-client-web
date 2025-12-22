

import { Link } from 'react-router-dom';

const serviceItems = [
  {
    title: 'Custom T-Shirts',
    copy: 'Built-to-fit designs with the right fabrics, placement, and print method for your style.',
    to: '/services/custom-tshirts'
  },
  {
    title: 'Bulk Orders for Events',
    copy: 'Timed drops for conventions, crews, and launches with sizing and logistics handled.',
    to: '/services/bulk-orders'
  },
  {
    title: 'Artist Collaborations',
    copy: 'Limited-run capsules with specialty prints, clear splits, and launch support.',
    to: '/services/artist-collaborations'
  }
];

const Services = () => {
  return (
    <section className="bg-zinc-900 text-white py-12 text-center px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-red-500">Our Services</h2>
          <p className="text-zinc-300 max-w-2xl mx-auto text-sm">
            Pick a path that fits your drop. Each service includes print quality checks and a responsive support crew.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {serviceItems.map((item) => (
            <div key={item.title} className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-6 text-left flex flex-col gap-4 shadow-lg shadow-red-500/5">
              <div className="space-y-1">
                <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-zinc-300 leading-relaxed">{item.copy}</p>
              </div>
              <Link to={item.to} className="inline-flex items-center gap-2 text-red-400 hover:text-white font-semibold">
                Learn more
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
