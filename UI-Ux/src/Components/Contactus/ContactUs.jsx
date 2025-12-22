import React, { useState } from 'react';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaDiscord, FaTwitter, FaInstagram } from 'react-icons/fa';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add your form submission logic here
    console.log('Form submitted:', formData);
    alert('Message sent! We\'ll get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white py-16 px-6">
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,rgba(244,63,94,0.15),transparent_25%),radial-gradient(circle_at_70%_80%,rgba(244,63,94,0.12),transparent_25%)]" aria-hidden="true" />
      
      <div className="relative max-w-6xl mx-auto">
        <div className="text-center mb-12 space-y-3">
          <p className="text-sm uppercase tracking-[0.25em] text-red-300">Get in touch</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white">Contact Us</h2>
          <p className="text-zinc-300 max-w-2xl mx-auto">
            Have questions about custom orders, collaborations, or bulk pricing? Drop us a line and we'll respond within 24 hours.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Contact Info Cards */}
          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-lg shadow-red-500/5">
              <div className="flex items-start gap-4">
                <div className="mt-1 p-3 rounded-lg bg-red-500/10 text-red-400">
                  <FaEnvelope className="text-xl" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Email</h3>
                  <p className="text-sm text-zinc-300">support@animetees.com</p>
                  <p className="text-sm text-zinc-300">sales@animetees.com</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-lg shadow-red-500/5">
              <div className="flex items-start gap-4">
                <div className="mt-1 p-3 rounded-lg bg-red-500/10 text-red-400">
                  <FaPhone className="text-xl" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Phone</h3>
                  <p className="text-sm text-zinc-300">+1 (555) 123-4567</p>
                  <p className="text-xs text-zinc-400">Mon-Fri, 9AM-6PM EST</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-lg shadow-red-500/5">
              <div className="flex items-start gap-4">
                <div className="mt-1 p-3 rounded-lg bg-red-500/10 text-red-400">
                  <FaMapMarkerAlt className="text-xl" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Location</h3>
                  <p className="text-sm text-zinc-300">123 Anime Street</p>
                  <p className="text-sm text-zinc-300">Tokyo, Japan 100-0001</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-lg shadow-red-500/5">
              <h3 className="font-semibold text-white mb-3">Follow Us</h3>
              <div className="flex gap-3">
                <a href="#" className="p-3 rounded-lg bg-zinc-800 hover:bg-red-500 transition text-zinc-300 hover:text-white">
                  <FaDiscord className="text-xl" />
                </a>
                <a href="#" className="p-3 rounded-lg bg-zinc-800 hover:bg-red-500 transition text-zinc-300 hover:text-white">
                  <FaTwitter className="text-xl" />
                </a>
                <a href="#" className="p-3 rounded-lg bg-zinc-800 hover:bg-red-500 transition text-zinc-300 hover:text-white">
                  <FaInstagram className="text-xl" />
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-zinc-200">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Your full name"
                    className="w-full px-4 py-3 rounded-lg bg-zinc-950 text-white placeholder-zinc-500 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-zinc-200">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-3 rounded-lg bg-zinc-950 text-white placeholder-zinc-500 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium text-zinc-200">
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="What's this about?"
                  className="w-full px-4 py-3 rounded-lg bg-zinc-950 text-white placeholder-zinc-500 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-zinc-200">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="6"
                  placeholder="Tell us more about your inquiry..."
                  className="w-full px-4 py-3 rounded-lg bg-zinc-950 text-white placeholder-zinc-500 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition shadow-lg shadow-red-500/20"
              >
                Send Message
              </button>

              <p className="text-xs text-center text-zinc-400">
                We typically respond within 24 hours during business days
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactUs;
