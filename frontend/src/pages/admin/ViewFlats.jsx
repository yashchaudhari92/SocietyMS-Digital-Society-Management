import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import API from "../../services/api";

export default function ViewFlats() {
  const [flats, setFlats] = useState([]);
  const [wingFilter, setWingFilter] = useState("");
  const [societies, setSocieties] = useState([]);
  const [selectedSociety, setSelectedSociety] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchFlats = async (societyId = "") => {
    setLoading(true);
    try {
      const res = await API.get(`/flats?societyId=${societyId}`);
      setFlats(res.data);
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSocieties = async () => {
    const res = await API.get("/societies");
    setSocieties(res.data);
  };

  useEffect(() => {
    fetchFlats();
    fetchSocieties();
  }, []);

  const handleDownloadFlats = async () => {
    if (!selectedSociety) return alert("Select society first");

    try {
      const res = await API.get(
        `/flats/download-excel?societyId=${selectedSociety}`,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Flats_Data_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Download failed");
    }
  };

  const filteredFlats = flats.filter((f) =>
    wingFilter ? f.wing === wingFilter : true
  );

  const selectClass = "px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all cursor-pointer";

  return (
    <div className="max-w-6xl text-left">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Society Flat Details</h2>
          <p className="text-slate-500 text-sm mt-1">Browse and filter flat records across your societies.</p>
        </div>

        <button
          onClick={handleDownloadFlats}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-100 transition-all active:scale-95 disabled:opacity-50"
          disabled={!selectedSociety}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export to Excel
        </button>
      </header>

      {/* Filter Bar */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-wrap gap-4 mb-8">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Society</label>
          <select
            className={selectClass}
            value={selectedSociety}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedSociety(id);
              fetchFlats(id);
            }}
          >
            <option value="">All Societies</option>
            {societies.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Filter Wing</label>
          <select
            className={selectClass}
            onChange={(e) => setWingFilter(e.target.value)}
          >
            <option value="">All Wings</option>
            {[...new Set(flats.map((f) => f.wing))].map((wing) => (
              <option key={wing} value={wing}>Wing {wing}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Dynamic Results UX */}
      {!selectedSociety && (
        <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl mb-6 flex items-center gap-3">
          <span className="text-xl">💡</span>
          <p className="text-indigo-700 text-sm font-medium">
            Select a specific society to enable full inventory data and exports.
          </p>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Wing</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Flat No</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Owner Name</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Occupant</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Maintenance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center text-slate-400 font-medium">
                    <div className="animate-pulse flex flex-col items-center gap-2">
                      <div className="h-8 w-8 bg-slate-100 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
                      Updating inventory list...
                    </div>
                  </td>
                </tr>
              ) : filteredFlats.length > 0 ? (
                filteredFlats.map((f, i) => (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    key={f._id} 
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="px-8 py-4 font-bold text-slate-900">
                      <span className="px-2 py-1 bg-slate-100 rounded-md group-hover:bg-white transition-colors">{f.wing}</span>
                    </td>
                    <td className="px-8 py-4 font-bold text-slate-700">{f.flatNo}</td>
                    <td className="px-8 py-4 text-slate-600 font-medium">{f.ownerName}</td>
                    <td className="px-8 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                        f.occupantType === 'owner' 
                          ? 'bg-blue-50 text-blue-600' 
                          : 'bg-amber-50 text-amber-600'
                      }`}>
                        {f.occupantType}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right font-black text-slate-900">
                      ₹{f.maintenanceAmount.toLocaleString()}
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center text-slate-400 font-medium italic">
                    No records found for the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
