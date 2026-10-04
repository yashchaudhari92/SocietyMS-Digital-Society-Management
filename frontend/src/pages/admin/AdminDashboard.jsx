import { useState, useContext } from "react"; // Added useContext
import { useNavigate } from "react-router-dom"; // Added useNavigate
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../../context/AuthContext"; // Import your existing context
import Society from "./Society";
import Flats from "./Flats";
import ViewFlats from "./ViewFlats";
import AdminPayments from "./AdminPayments";
import AdminSummary from "./AdminSummary";
import Expense from "./Expense";
import Balance from "./Balance";
import Gifts from "./Gifts";
// import ManageFlatAmounts from "./ManageFlatAmounts";

export default function AdminDashboard() {
  const { user, logout } = useContext(AuthContext); // Use your existing logic
  const navigate = useNavigate();
  const [tab, setTab] = useState("society");

  const menuItems = [
    { id: "society", label: "Society Profile", icon: "🏢" },
    { id: "flats", label: "Add Flat Details", icon: "➕" },
    { id: "view", label: "View Flats", icon: "🏙️" },
    { id: "payments", label: "Payment Records", icon: "💰" },
    { id: "summary", label: "Financial Summary", icon: "📊" },
    { id: "balance", label: "Balance", icon: "🏦" },
    { id: "expense", label: "Expense Tracker", icon: "💸" },
    { id: "gifts", label: "Gifts", icon: "🎁" },
    // { id: "manageAmount", label: "Manage Flat Amounts", icon: "🛠️" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      
      {/* --- Sidebar --- */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col fixed h-screen z-30">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <span className="text-white text-lg">🏢</span>
            </div>
            <span className="text-xl font-black tracking-tighter uppercase">
              Society<span className="text-indigo-600">MS</span>
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
            Main Menu
          </p>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                tab === item.id
                  ? "bg-slate-900 text-white shadow-xl shadow-slate-400/20"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer with functional Logout */}
        <div className="p-6 border-t border-slate-50">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-600 hover:text-white transition-all active:scale-95"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <div className="flex-1 ml-72 flex flex-col">
        
        {/* Top Header Bar */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-10 flex justify-between items-center sticky top-0 z-20">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-800">
              {menuItems.find(i => i.id === tab)?.label}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin Control Panel</p>
          </div>

          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
                {/* Dynamically show the logged in user's name */}
                <p className="text-xs font-black text-slate-900">{user?.name || "Admin"}</p>
                <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-tighter">Admin</p>
             </div>
             <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold uppercase shadow-lg shadow-slate-200">
               {user?.name ? user.name.substring(0, 2) : "AD"}
             </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 min-h-[calc(100vh-160px)]"
            >
              {tab === "society" && <Society />}
              {tab === "flats" && <Flats />}
              {tab === "view" && <ViewFlats />}
              {tab === "payments" && <AdminPayments />}
              {tab === "summary" && <AdminSummary />}
              {tab === "balance" && <Balance />}
              {tab === "expense" && <Expense />}
              {tab === "gifts" && <Gifts />}
              {/* {tab === "manageAmount" && <ManageFlatAmounts />} */}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}