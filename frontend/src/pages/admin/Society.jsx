import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import API from "../../services/api";

export default function Society() {
  const [name, setName] = useState("");
  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openingBalance, setOpeningBalance] = useState("");

  const fetchSocieties = async () => {
    try {
      const res = await API.get("/societies");
      setSocieties(res.data);
    } catch (err) {
      console.error("Failed to fetch societies", err);
    }
  };

  useEffect(() => {
    fetchSocieties();
  }, []);

  const handleAdd = async () => {
    if (!name) return; // Silent return or custom toast is better than browser alert

    try {
      setLoading(true);
      await API.post("/societies/add", { name, openingBalance, });
      setName("");
      setOpeningBalance(""),
      fetchSocieties();
    } catch (err) {
      alert("Error adding society");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      {/* Header Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Society Configuration
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Register new residential societies to the management system.
        </p>
      </div>

      {/* Add Society Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-50 border border-slate-200 p-8 rounded-[2rem] mb-10"
      >
        <label className="block text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4 ml-1">
          New Society Name
        </label>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-50">🏢</span>
            <input
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900 font-medium placeholder:text-slate-300"
              placeholder="e.g. Green Valley Residency"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="relative flex-grow">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-50">💰</span>
            <input
              type="number"
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900 font-medium placeholder:text-slate-300"
              placeholder="Opening Balance (₹)"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
            />
          </div>

          <button
            onClick={handleAdd}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? "Adding..." : "Register Society"}
          </button>
        </div>
      </motion.div>

      {/* Society List Placeholder (Optional addition if you want to see them) */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">
          Registered Societies ({societies.length})
        </h3>
        {societies.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-[2rem]">
            <p className="text-slate-400 font-medium">No societies registered yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {societies.map((soc, index) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                key={soc._id || index}
                className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-lg">🏙️</div>
                  <span className="font-bold text-slate-700">{soc.name}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
