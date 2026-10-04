import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../services/api";

export default function Flats() {
  const [form, setForm] = useState({
    societyId: "",
    wing: "",
    flatNo: "",
    ownerName: "",
    flatType: "",
    occupantType: "",
    contactNumber: "",
    pendingAmount: "",
  });

  const [errors, setErrors] = useState({}); // State to track validation errors
  const [flats, setFlats] = useState([]);
  const [societies, setSocieties] = useState([]);
  const [file, setFile] = useState(null);
  const [selectedSociety, setSelectedSociety] = useState("");
  const [loading, setLoading] = useState(false);

  // --- Validation Logic ---
  const validateForm = () => {
    let newErrors = {};

    if (!form.societyId) newErrors.societyId = "Society selection is required";
    if (!form.wing) newErrors.wing = "Wing is required";
    if (!form.flatNo) newErrors.flatNo = "Flat number is required";
    if (!form.ownerName) newErrors.ownerName = "Owner name is required";
    if (!form.flatType) newErrors.flatType = "Flat type is required";
    if (!form.occupantType) newErrors.occupantType = "Occupant status is required";

    // Contact Number Validation (Indian Standard: 10 digits)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!form.contactNumber) {
      newErrors.contactNumber = "Contact number is required";
    } else if (!phoneRegex.test(form.contactNumber)) {
      newErrors.contactNumber = "Enter a valid 10-digit mobile number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchSocieties = async () => {
    const res = await API.get("/societies");
    setSocieties(res.data);
  };

  const fetchFlats = async () => {
    const res = await API.get("/flats");
    setFlats(res.data);
  };

  useEffect(() => {
    fetchSocieties();
    fetchFlats();
  }, []);

  const handleDownload = async () => {
    try {
      const res = await API.get("/flats/template", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "flat_template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Download failed");
    }
  };

  const handleSubmit = async () => {
    // 🔥 Run validation first
    if (!validateForm()) return;

    setLoading(true);
    try {
      await API.post("/flats/add", form);
      fetchFlats();
      alert("Flat added successfully");
      setErrors({}); // Clear errors on success
    } catch (err) {
      alert(err.response?.data?.message || "Error adding flat");
    } finally {
      setLoading(false);
    }
  };

  const getAmount = () => {
    const config = {
      "1BHK": { owner: 1000, tenant: 1100 },
      "2BHK": { owner: 1200, tenant: 1300 },
      "3BHK": { owner: 1600, tenant: 1700 },
    };
    const type = form.flatType?.toUpperCase();
    const occ = form.occupantType?.toLowerCase();
    return config[type]?.[occ] || 0;
  };

  // Helper for dynamic styling
  const getInputClass = (fieldName) => `
    w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none transition-all text-sm font-medium
    ${errors[fieldName]
      ? "border-red-400 ring-4 ring-red-500/10 bg-red-50/50"
      : "border-slate-200 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500"
    }
  `;

  const labelClass = "block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1";

  return (
    <div className="max-w-6xl">
      <header className="mb-10">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Add Flat Details :- </h2>
        <p className="text-slate-500 text-sm mt-1">Onboard new flats manually or via bulk excel upload.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* --- LEFT: MANUAL ENTRY FORM --- */}
        <div className="lg:col-span-2 space-y-6 text-left">
          <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">📝</span>
              Flat Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className={labelClass}>Select Society</label>
                <select className={getInputClass("societyId")} onChange={(e) => setForm({ ...form, societyId: e.target.value })}>
                  <option value="">Choose Society...</option>
                  {societies.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
                {errors.societyId && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.societyId}</p>}
              </div>

              <div>
                <label className={labelClass}>Wing</label>
                <input placeholder="e.g. A" className={getInputClass("wing")} onChange={(e) => setForm({ ...form, wing: e.target.value })} />
                {errors.wing && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.wing}</p>}
              </div>

              <div>
                <label className={labelClass}>Flat Number</label>
                <input placeholder="e.g. 402" className={getInputClass("flatNo")} onChange={(e) => setForm({ ...form, flatNo: e.target.value })} />
                {errors.flatNo && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.flatNo}</p>}
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Owner Full Name</label>
                <input placeholder="Enter owner name" className={getInputClass("ownerName")} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
                {errors.ownerName && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.ownerName}</p>}
              </div>

              <div>
                <label className={labelClass}>Flat Configuration</label>
                <select className={getInputClass("flatType")} onChange={(e) => setForm({ ...form, flatType: e.target.value })}>
                  <option value="">Select Type</option>
                  <option value="1BHK">1BHK</option>
                  <option value="2BHK">2BHK</option>
                  <option value="3BHK">3BHK</option>
                </select>
                {errors.flatType && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.flatType}</p>}
              </div>

              <div>
                <label className={labelClass}>Occupant Status</label>
                <select className={getInputClass("occupantType")} onChange={(e) => setForm({ ...form, occupantType: e.target.value })}>
                  <option value="">Owner/Tenant</option>
                  <option value="owner">Owner Self-Occupied</option>
                  <option value="tenant">Tenant Occupied</option>
                </select>
                {errors.occupantType && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.occupantType}</p>}
              </div>

              <div>
                <label className={labelClass}>Contact Number</label>
                <input
                  type="text"
                  maxLength="10"
                  placeholder="9876543210"
                  className={getInputClass("contactNumber")}
                  value={form.contactNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, ""); // Allow only digits
                    setForm({ ...form, contactNumber: val });
                  }}
                />
                <AnimatePresence>
                  {errors.contactNumber && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="text-[10px] text-red-500 font-bold mt-1 ml-1"
                    >
                      {errors.contactNumber}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <label className={labelClass}>Pending Dues (₹)</label>
                <input type="number" placeholder="0.00" className={getInputClass("pendingAmount")} onChange={(e) => setForm({ ...form, pendingAmount: e.target.value })} />
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              <div className="bg-indigo-50 px-4 py-2 rounded-xl">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Monthly Maintenance</span>
                <span className="text-lg font-black text-indigo-700">₹{getAmount()}</span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Add Flat to Registry"}
              </button>
            </div>
          </div>
        </div>

        {/* --- RIGHT: BULK ACTIONS --- */}
        <div className="space-y-6 text-left">
          <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem]">
            <h3 className="font-bold text-emerald-900 flex items-center gap-2 mb-2">
              <span>📊</span> Bulk Import
            </h3>
            <p className="text-xs text-emerald-700/70 mb-4 leading-relaxed">
              Have many flats? Use our Excel template to import them all at once.
            </p>
            <button onClick={handleDownload} className="w-full bg-white text-emerald-600 border border-emerald-200 py-3 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-all flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Template
            </button>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">Upload Records</h3>
            <div className="space-y-4">
              <select
                className={getInputClass()}
                value={selectedSociety}
                onChange={(e) => setSelectedSociety(e.target.value)}
              >
                <option value="">Select Target Society...</option>
                {societies.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>

              <div className="group relative border-2 border-dashed border-slate-200 rounded-xl p-4 hover:border-indigo-400 transition-colors text-center">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => setFile(e.target.files[0])}
                />
                <div>
                  <span className="text-2xl block mb-1">📁</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate block px-2">
                    {file ? file.name : "Click to select Excel"}
                  </span>
                </div>
              </div>

              <button
                onClick={async () => {
                  if (!file || !selectedSociety) return alert("Select file and society");
                  const formData = new FormData();
                  formData.append("file", file);
                  formData.append("societyId", selectedSociety);
                  await API.post("/flats/upload-excel", formData);
                  alert("Flats uploaded successfully");
                  setFile(null);
                  fetchFlats();
                }}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
              >
                Upload & Sync
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
