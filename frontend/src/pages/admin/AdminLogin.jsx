import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../services/api";
import { AuthContext } from "../../context/AuthContext";

export default function AdminLogin() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    let err = {};
    if (!form.email) err.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) err.email = "Email is invalid";
    if (!form.password) err.password = "Password is required";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault(); // Added to support "Enter" key press
    setServerError("");
    if (!validate()) return;

    try {
      setLoading(true);
      const res = await API.post("/auth/login", { ...form });
      login(res.data);
      navigate("/admin/dashboard");
    } catch (err) {
      setServerError(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-6">
      {/* Abstract Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-3xl opacity-50"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="bg-white p-10 rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100">
          
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 mb-4">
              <span className="text-2xl">🔐</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Admin Portal</h2>
            <p className="text-slate-500 mt-2 text-sm">Welcome back! Please enter your details.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Server Error Message */}
            <AnimatePresence>
              {serverError && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium"
                >
                  {serverError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 ml-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="admin@society.com"
                className={`w-full px-4 py-3.5 rounded-xl bg-slate-50 border transition-all outline-none text-slate-900 ${
                  errors.email ? "border-red-300 ring-4 ring-red-500/5" : "border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5"
                }`}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {errors.email && <p className="mt-1.5 text-xs text-red-500 font-medium ml-1">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 ml-1">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className={`w-full px-4 py-3.5 rounded-xl bg-slate-50 border transition-all outline-none text-slate-900 ${
                  errors.password ? "border-red-300 ring-4 ring-red-500/5" : "border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5"
                }`}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              {errors.password && <p className="mt-1.5 text-xs text-red-500 font-medium ml-1">{errors.password}</p>}
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-200 hover:bg-indigo-600 hover:shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Authenticating...
                </span>
              ) : (
                "Sign In to Dashboard"
              )}
            </button>
          </form>

          {/* Footer Link */}
          <p className="mt-8 text-center text-slate-500 text-sm">
            Not an admin? <Link to="/user/login" className="text-indigo-600 font-bold hover:underline">Resident Login</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
