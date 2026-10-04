import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../services/api";
import { AuthContext } from "../../context/AuthContext";

export default function UserLogin() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    let err = {};
    if (!form.email) err.email = "Email is required";
    if (!form.password) err.password = "Password is required";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    try {
      setLoading(true);
      const res = await API.post("/auth/login", { ...form });
      login(res.data);
      navigate("/user/dashboard");
    } catch (err) {
      setServerError(err.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-6">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-emerald-100 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute bottom-[20%] left-[10%] w-[30%] h-[30%] bg-blue-100 rounded-full blur-3xl opacity-40"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md"
      >
        <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-100 mb-6">
              <span className="text-2xl text-white">🏠</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Resident Login</h2>
            <p className="text-slate-500 mt-2">Welcome to your society portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Server Error Alert */}
            <AnimatePresence>
              {serverError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm font-medium text-center"
                >
                  {serverError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
              <input
                type="email"
                placeholder="name@example.com"
                className={`w-full px-5 py-4 rounded-2xl bg-slate-100/50 border transition-all outline-none text-slate-900 ${
                  errors.email ? "border-red-300 ring-4 ring-red-500/10" : "border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                }`}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {errors.email && <p className="text-xs text-red-500 font-semibold ml-2">{errors.email}</p>}
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className={`w-full px-5 py-4 rounded-2xl bg-slate-100/50 border transition-all outline-none text-slate-900 ${
                  errors.password ? "border-red-300 ring-4 ring-red-500/10" : "border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                }`}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              {errors.password && <p className="text-xs text-red-500 font-semibold ml-2">{errors.password}</p>}
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-emerald-200 hover:bg-emerald-700 hover:shadow-emerald-300 transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              {loading ? "Verifying..." : "Sign In"}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center space-y-3">
            <p className="text-slate-500 text-sm">
              New resident?{" "}
              <Link to="/user/register" className="text-emerald-600 font-bold hover:underline transition-all">
                Create an account
              </Link>
            </p>
            <p className="text-xs">
              <Link to="/admin/login" className="text-slate-400 hover:text-slate-600 transition-colors">
                Are you an Admin? Click here
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

