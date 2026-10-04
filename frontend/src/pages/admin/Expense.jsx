import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import API from "../../services/api";

export default function Expense() {
  const [form, setForm] = useState({
    date: "",
    taskName: "",
    amount: "",
    paidTo: "",
    paymentMode: "",
    givenBy: "",
  });

  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({
    weekly: 0,
    monthly: 0,
    yearly: 0,
  });

  const fetchExpenses = async () => {
    const res = await API.get("/expenses");
    setExpenses(res.data);
  };

  const fetchSummary = async () => {
    const res = await API.get("/expenses/summary");
    setSummary(res.data);
  };

  useEffect(() => {
    fetchExpenses();
    fetchSummary();
  }, []);

  const handleSubmit = async () => {
    if (!form.date || !form.taskName || !form.amount) {
      return alert("Fill required fields");
    }

    await API.post("/expenses/add", form);

    setForm({
      date: "",
      taskName: "",
      amount: "",
      paidTo: "",
      paymentMode: "",
      givenBy: "",
    });

    fetchExpenses();
    fetchSummary();
  };

  const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all text-sm font-medium";
  const labelClass = "block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1";

  return (
    <div className="max-w-6xl text-left">
      <header className="mb-8">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Expense Tracker</h2>
        <p className="text-slate-500 text-sm mt-1">Record and monitor society expenditures and vendor payments.</p>
      </header>

      {/* --- ANALYTICS CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { label: "Weekly Spend", value: summary.weekly, color: "text-blue-600", bg: "bg-blue-50/50" },
          { label: "Monthly Spend", value: summary.monthly, color: "text-emerald-600", bg: "bg-emerald-50/50" },
          { label: "Annual Spend", value: summary.yearly, color: "text-indigo-600", bg: "bg-indigo-50/50" }
        ].map((item, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={item.label}
            className={`p-6 rounded-[2rem] border border-slate-100 shadow-sm bg-white overflow-hidden relative group transition-all hover:shadow-md`}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 ${item.bg} rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110`} />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 relative z-10">{item.label}</h3>
            <p className={`text-3xl font-black ${item.color} relative z-10 font-mono tracking-tight`}>
              ₹{item.value.toLocaleString()}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- FORM SECTION --- */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm sticky top-24">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-sm">＋</span>
              New Entry
            </h3>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>Date of Expense</label>
                <input
                  type="date"
                  className={inputClass}
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>

              <div>
                <label className={labelClass}>Task / Description</label>
                <input
                  placeholder="e.g. Lift Maintenance"
                  className={inputClass}
                  value={form.taskName}
                  onChange={(e) => setForm({ ...form, taskName: e.target.value })}
                />
              </div>

              <div>
                <label className={labelClass}>Amount (₹)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  className={inputClass}
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>

              <div>
                <label className={labelClass}>Paid To</label>
                <input
                  placeholder="Vendor or Person Name"
                  className={inputClass}
                  value={form.paidTo}
                  onChange={(e) => setForm({ ...form, paidTo: e.target.value })}
                />
              </div>

              <div>
                <label className={labelClass}>Given By</label>
                <input
                  placeholder="e.g. Treasurer / Resident Name"
                  className={inputClass}
                  value={form.givenBy}
                  onChange={(e) => setForm({ ...form, givenBy: e.target.value })}
                />
              </div>

              <div>
                <label className={labelClass}>Payment Method</label>
                <select
                  className={inputClass}
                  value={form.paymentMode}
                  onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                >
                  <option value="">Select Mode</option>
                  <option value="cash">💵 Cash</option>
                  <option value="upi">📱 UPI / QR</option>
                  <option value="bank">🏦 Bank Transfer</option>
                </select>
              </div>

              <button
                onClick={handleSubmit}
                className="w-full mt-4 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-indigo-600 shadow-lg shadow-slate-200 transition-all active:scale-95"
              >
                Add Expense
              </button>
            </div>
          </div>
        </div>

        {/* --- TABLE SECTION --- */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Paid To</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Given By</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Mode</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {expenses.length > 0 ? (
                    expenses.map((e, i) => (
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        key={e._id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-6 py-4 text-xs font-bold text-slate-500">
                          {new Date(e.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800">{e.taskName}</td>
                        <td className="px-6 py-4 text-slate-600 font-medium">{e.paidTo}</td>
                        <td className="px-6 py-4 text-slate-600 font-medium">{e.givenBy}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-[10px] font-black uppercase text-slate-500">
                            {e.paymentMode}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-red-600">
                          ₹{e.amount.toLocaleString()}
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-20 text-center text-slate-400 font-medium">
                        No expenses logged yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
