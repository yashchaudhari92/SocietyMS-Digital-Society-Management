import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../services/api";

export default function AdminRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    contactNumber: "",
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    let err = {};
    const emailRegex = /\S+@\S+\.\S+/;
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!form.name.trim()) err.name = "Required";
    if (!form.email) {
      err.email = "Required";
    } else if (!emailRegex.test(form.email)) {
      err.email = "Invalid email";
    }
    if (!form.contactNumber) {
      err.contactNumber = "Required";
    } else if (!phoneRegex.test(form.contactNumber)) {
      err.contactNumber = "Invalid (10 digits)";
    }
    if (!form.password || form.password.length < 6) {
      err.password = "Min 6 characters";
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    try {
      setLoading(true);
      // Logic assumes your backend register endpoint accepts role: "admin"
      await API.post("/auth/register", { 
        ...form, 
        role: "admin" 
      });
      alert("Admin Account Created Successfully");
      navigate("/admin/login");
    } catch (err) {
      setServerError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (fieldName) => `
    w-full px-4 py-3 rounded-xl bg-slate-100/50 border transition-all outline-none text-slate-900 text-sm
    ${errors[fieldName] 
      ? "border-red-300 ring-4 ring-red-500/10" 
      : "border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"}
  `;

  const labelStyle = "text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1 block";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-6 pt-32 pb-12 relative overflow-hidden text-left">
      {/* Aesthetic Background Blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-slate-200 rounded-full blur-3xl opacity-50"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-white">
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-900 rounded-xl shadow-lg shadow-slate-200 mb-4">
              <span className="text-2xl">🛡️</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Admin Sign Up</h2>
            <p className="text-slate-500 text-xs mt-1">Create your administrative credentials</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <AnimatePresence>
              {serverError && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0 }}
                  className="bg-red-50 border border-red-100 text-red-600 px-4 py-2 rounded-xl text-xs font-medium text-center"
                >
                  {serverError}
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className={labelStyle}>Full Name</label>
              <input 
                placeholder="e.g. Yashwant Chaudhari" 
                className={inputStyle("name")} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
              />
              {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.name}</p>}
            </div>

            <div>
              <label className={labelStyle}>Admin Email</label>
              <input 
                type="email" 
                placeholder="admin@society.com" 
                className={inputStyle("email")} 
                onChange={(e) => setForm({ ...form, email: e.target.value })} 
              />
              {errors.email && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.email}</p>}
            </div>

            <div>
              <label className={labelStyle}>Contact Number</label>
              <input 
                type="text"
                maxLength="10"
                placeholder="9876543210" 
                className={inputStyle("contactNumber")} 
                value={form.contactNumber}
                onChange={(e) => setForm({ ...form, contactNumber: e.target.value.replace(/\D/g, "") })} 
              />
              {errors.contactNumber && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.contactNumber}</p>}
            </div>

            <div>
              <label className={labelStyle}>Master Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                className={inputStyle("password")} 
                onChange={(e) => setForm({ ...form, password: e.target.value })} 
              />
              {errors.password && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl shadow-xl shadow-slate-200 hover:bg-indigo-600 transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
            >
              {loading ? "Registering..." : "Create Admin Account"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-slate-500 text-xs font-medium">
              Already have admin access?{" "}
              <Link to="/admin/login" className="text-indigo-600 font-black hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}