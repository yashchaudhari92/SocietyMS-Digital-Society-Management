import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.8, ease: "easeOut" },
  }),
};

export default function HomePage() {
  const images = [
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2",
    "https://images.unsplash.com/photo-1507089947368-19c1da9775ae",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be",
  ];

  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 5000); // Increased to 5s for a calmer feel
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* ================= HERO ================= */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Image Slider */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImage}
              src={images[currentImage]}
              className="absolute w-full h-full object-cover"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
            />
          </AnimatePresence>
          {/* Enhanced Gradient Overlay: Darker at bottom for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-slate-900/90"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center text-white">
          <motion.span 
            variants={fadeIn} initial="hidden" animate="visible"
            className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest uppercase bg-indigo-500/20 border border-indigo-400/30 rounded-full backdrop-blur-md"
          >
            Digital Society Management
          </motion.span>
          
          <motion.h1
            variants={fadeIn} initial="hidden" animate="visible"
            className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]"
          >
            Society Management <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-blue-200">
              Made Simple & Smart
            </span>
          </motion.h1>

          <motion.p
            variants={fadeIn} initial="hidden" animate="visible" custom={0.2}
            className="mt-8 text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-light leading-relaxed"
          >
            Manage maintenance, track records, and simplify
            operations—engineered for modern residential living.
          </motion.p>

          {/* Buttons */}
          <motion.div
            variants={fadeIn} initial="hidden" animate="visible" custom={0.4}
            className="mt-12 flex flex-col sm:flex-row gap-5 justify-center items-center"
          >
            <Link
              to="/admin/login"
              className="group relative px-8 py-4 bg-white text-slate-900 rounded-xl font-bold transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95"
            >
              Admin Dashboard
            </Link>

            <Link
              to="/user/login"
              className="px-8 py-4 border border-white/30 backdrop-blur-md text-white rounded-xl font-semibold hover:bg-white/10 transition-all active:scale-95"
            >
              Resident Login
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="relative -mt-20 z-20 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: "💰", title: "Maintenance", desc: "Automated billing and history tracking with one-click reports." },
              { icon: "📊", title: "Analytics", desc: "Real-time insights into collections and pending dues for admins." },
              { icon: "🛡️", title: "Verification", desc: "Secure cloud storage for payment proofs and instant approvals." },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-8 rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 hover:border-indigo-500/50 hover:shadow-indigo-500/10 transition-all duration-300"
              >
                <div className="w-14 h-14 flex items-center justify-center text-3xl bg-slate-50 rounded-2xl group-hover:scale-110 group-hover:bg-indigo-50 transition-transform">
                  {item.icon}
                </div>
                <h3 className="mt-6 text-xl font-bold text-slate-800 tracking-tight">{item.title}</h3>
                <p className="mt-3 text-slate-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Streamlined Workflow</h2>
            <div className="h-1.5 w-20 bg-indigo-500 mx-auto mt-4 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-slate-100 -z-0"></div>
            
            {[
              { step: "01", label: "Setup Flats", desc: "Admin initializes the building structure." },
              { step: "02", label: "Upload Proof", desc: "Residents submit payments digitally." },
              { step: "03", label: "Get Verified", desc: "Instant status updates after verification." },
            ].map((item, i) => (
              <div key={i} className="relative z-10 text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shadow-lg shadow-indigo-200 mb-6">
                  {item.step}
                </div>
                <h4 className="text-lg font-bold text-slate-800">{item.label}</h4>
                <p className="mt-2 text-slate-500 text-sm max-w-[200px]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
