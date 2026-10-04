import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../services/api";

export default function UserRegister() {
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

    if (!form.name.trim()) err.name = "Full name is required";
    if (!form.email) {
      err.email = "Email is required";
    } else if (!emailRegex.test(form.email)) {
      err.email = "Invalid email";
    }
    if (!form.contactNumber) {
      err.contactNumber = "Required";
    } else if (!phoneRegex.test(form.contactNumber)) {
      err.contactNumber = "Invalid";
    }
    if (!form.password) {
      err.password = "Password required";
    } else if (form.password.length < 6) {
      err.password = "Min 6 chars";
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
      await API.post("/auth/register", { ...form, role: "user" });
      navigate("/user/login");
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
      : "border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"}
  `;

  const labelStyle = "text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1 block";

  return (
    // Increased pt-32 to clear the navbar and added pb-12 for breathing room
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-6 pt-32 pb-12 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-emerald-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-3xl opacity-50"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-lg"
      >
        <div className="bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-white">
          
          <div className="text-center mb-6">
            {/* Reduced icon size */}
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl shadow-lg shadow-emerald-200 mb-4">
              <span className="text-2xl text-white">✨</span>
            </div>
            {/* Reduced heading and margin */}
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Join the Community</h2>
            <p className="text-slate-500 text-xs mt-1">Manage your residency in one place</p>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="md:col-span-2">
                <label className={labelStyle}>Full Name</label>
                <input placeholder="John Doe" className={inputStyle("name")} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.name}</p>}
              </div>

              <div>
                <label className={labelStyle}>Email</label>
                <input type="email" placeholder="john@example.com" className={inputStyle("email")} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                {errors.email && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.email}</p>}
              </div>

              <div>
                <label className={labelStyle}>Contact</label>
                <input maxLength="10" placeholder="98765..." className={inputStyle("contactNumber")} value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value.replace(/\D/g, "") })} />
                {errors.contactNumber && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.contactNumber}</p>}
              </div>

              <div className="md:col-span-2 text-left">
                <label className={labelStyle}>Password</label>
                <input type="password" placeholder="••••••••" className={inputStyle("password")} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                {errors.password && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.password}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              {loading ? "Registering..." : "Complete Registration"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-slate-500 text-xs font-medium">
              Already a member?{" "}
              <Link to="/user/login" className="text-emerald-600 font-black hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import API from "../../services/api";

// export default function UserRegister() {
//     const navigate = useNavigate();
//     const [form, setForm] = useState({
//         name: "",
//         email: "",
//         password: "",
//         contactNumber: "",
//     });

//     const [errors, setErrors] = useState({});
//     const [loading, setLoading] = useState(false);

//     const validate = () => {
//         let err = {};

//         if (!form.name) err.name = "Name is required";
//         if (!form.email) err.email = "Email is required";
//         if (!form.contactNumber) err.contactNumber = "Contact number is required";
//         if (!form.password || form.password.length < 6)
//             err.password = "Password must be at least 6 characters";

//         setErrors(err);
//         return Object.keys(err).length === 0;
//     };

//     const handleRegister = async () => {
//         if (!validate()) return;

//         try {
//             setLoading(true);

//             await API.post("/auth/register", {
//                 ...form,
//                 role: "user",
//             });

//             alert("User Registered");
//             navigate("/user/login");

//         } catch (err) {
//             alert(err.response?.data?.message || "Error");
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="min-h-screen flex items-center justify-center bg-gradient-to-r">
//             <div className="bg-white p-8 rounded-xl shadow-lg w-96">
//                 <h2 className="text-2xl font-bold text-center mb-6">User Register</h2>

//                 <input
//                     placeholder="Name"
//                     className="w-full p-2 border rounded mb-2"
//                     onChange={(e) => setForm({ ...form, name: e.target.value })}
//                 />
//                 {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}

//                 <input
//                     placeholder="Email"
//                     className="w-full p-2 border rounded mb-2"
//                     onChange={(e) => setForm({ ...form, email: e.target.value })}
//                 />
//                 {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}

//                 <input
//                     placeholder="Contact Number"
//                     className="w-full p-2 border rounded mb-2"
//                     onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
//                 />
//                 {errors.contactNumber && <p className="text-red-500 text-sm">{errors.contactNumber}</p>}

//                 <input
//                     type="password"
//                     placeholder="Password"
//                     className="w-full p-2 border rounded mb-2"
//                     onChange={(e) => setForm({ ...form, password: e.target.value })}
//                 />
//                 {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}

//                 <button
//                     onClick={handleRegister}
//                     className="w-full bg-green-600 text-white p-2 rounded mt-3 hover:bg-green-700 transition"
//                 >
//                     {loading ? "Registering..." : "Register"}
//                 </button>
//                 <p className="text-sm text-center mt-4">
//                     Already have an account?{" "}
//                     <span
//                         className="text-blue-600 cursor-pointer hover:underline"
//                         onClick={() => navigate("/user/login")}
//                     >
//                         Login
//                     </span>
//                 </p>
//             </div>
//         </div>
//     );
// }