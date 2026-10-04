import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API, { IMAGE_BASE_URL } from "../../services/api";

export default function AdminPayments() {
    const [payments, setPayments] = useState([]);
    const [filter, setFilter] = useState("all");
    const [month, setMonth] = useState("");
    const [file, setFile] = useState(null);
    const [selectedId, setSelectedId] = useState("");
    const [societies, setSocieties] = useState([]);
    const [selectedSociety, setSelectedSociety] = useState("");
    const [history, setHistory] = useState([]);
    const [showHistoryFor, setShowHistoryFor] = useState(null);
    const [wing, setWing] = useState("");
    const [toast, setToast] = useState(null);
    const [search, setSearch] = useState("");
    const [showCashModal, setShowCashModal] = useState(false);
    const [cashAmount, setCashAmount] = useState("");
    const [cashFlat, setCashFlat] = useState("");
    const [cashSearch, setCashSearch] = useState("");
    const [methodFilter, setMethodFilter] = useState("all");

    const selectedPayment = payments.find((p) => p._id === selectedId);
    const wings = [...new Set(payments.map((p) => p.flatId?.wing).filter(Boolean))];

    // Logic preserved exactly
    const handleGenerate = async () => {
        try {
            await API.post("/payments/create");
            alert("Monthly payments generated");
            await fetchPayments();
        } catch (err) {
            alert("Error generating payments");
        }
    };

    const fetchSocieties = async () => {
        const res = await API.get("/societies");
        setSocieties(res.data);
    };

    const fetchPayments = async () => {
        const query = new URLSearchParams();
        if (month) query.append("month", month);
        if (selectedSociety) query.append("societyId", selectedSociety);
        if (wing) query.append("wing", wing);
        const res = await API.get(`/payments?${query.toString()}`);
        setPayments(res.data);
    };

    useEffect(() => {
        fetchPayments();
        fetchSocieties();
        setShowHistoryFor(null);
        setHistory([]);
    }, [month, selectedSociety, wing]);

    const handleViewHistory = async (flatId) => {
        if (showHistoryFor === flatId) {
            setShowHistoryFor(null);
            setHistory([]);
            return;
        }
        const res = await API.get(`/payments/history/${flatId}`);
        setHistory(res.data);
        setShowHistoryFor(flatId);
    };

    const filteredPayments = payments.filter((p) => {
        if (!p._id && p.month === null) {
            const hasReal = payments.some(
                (real) => real.flatId?._id === p.flatId?._id && real._id !== null
            );
            if (hasReal) return false;
        }

        // ✅ SEARCH FILTER (NEW)
        if (search) {
            const searchText = search.toLowerCase();
            const owner = p.flatId?.ownerName?.toLowerCase() || "";
            const flat = `${p.flatId?.wing}-${p.flatId?.flatNo}`.toLowerCase();

            if (!owner.includes(searchText) && !flat.includes(searchText)) {
                return false;
            }
        }

        // status filter
        if (filter !== "all" && p.status !== filter) {
            return false;
        }

        // 🔥 NEW: method filter
        if (methodFilter !== "all") {

            // ✅ CASH
            if (methodFilter === "cash" && p.paymentMethod !== "cash") {
                return false;
            }

            // ✅ ONLINE (STRICT FIX)
            if (methodFilter === "online") {
                // must NOT be cash AND must have screenshot
                if (p.paymentMethod === "cash" || !p.screenshot) {
                    return false;
                }
            }
        }

        return true;
    });

    // New Updated Badge Class
    const badgeClass = (status, method) => {
        const base = "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap ";

        if (method === "cash") {
            return base + "bg-emerald-100 text-emerald-700";
        }

        if (status === "approved") return base + "bg-emerald-100 text-emerald-700";
        if (status === "rejected") return base + "bg-red-100 text-red-700";
        return base + "bg-amber-100 text-amber-700";
    };

    // New Cash Filter Logic ( By Flats )
    const uniqueFlats = [
        ...new Map(payments.map(p => [p.flatId?._id, p.flatId])).values()
    ];

    // 🔥 SORT PROPERLY (wing + flatNo)
    const sortedFlats = uniqueFlats.sort((a, b) => {
        if (!a || !b) return 0;

        // sort by wing first
        if (a.wing !== b.wing) {
            return a.wing.localeCompare(b.wing);
        }

        // then by flat number (numeric)
        return Number(a.flatNo) - Number(b.flatNo);
    });

    // 🔍 SEARCH FILTER
    const filteredFlats = sortedFlats.filter(f => {
        const text = cashSearch.toLowerCase();

        const owner = f?.ownerName?.toLowerCase() || "";
        const flat = `${f?.wing}-${f?.flatNo}`.toLowerCase();

        return owner.includes(text) || flat.includes(text);
    });

    // const paymentSourceBadge = (p) => {
    //     if (p.paymentMethod === "cash" || (!p.screenshot && p.paidAmount > 0)) {
    //         return (
    //             <span className="px-2 py-1 text-[10px] font-black rounded-lg bg-blue-100 text-blue-700 uppercase">
    //                 💵 Cash
    //             </span>
    //         );
    //     }

    //     if (p.screenshot) {
    //         return (
    //             <span className="px-2 py-1 text-[10px] font-black rounded-lg bg-indigo-100 text-indigo-700 uppercase">
    //                 📲 Online
    //             </span>
    //         );
    //     }

    //     return (
    //         <span className="px-2 py-1 text-[10px] font-black rounded-lg bg-slate-100 text-slate-400 uppercase">
    //             None
    //         </span>
    //     );
    // };

    const paymentSourceBadge = (p) => {

        // ❌ NO PAYMENT → ALWAYS NONE
        if (!p.paidAmount || p.paidAmount === 0) {
            return (
                <span className="px-2 py-1 text-[10px] font-black rounded-lg bg-slate-100 text-slate-400 uppercase">
                    None
                </span>
            );
        }

        // ✅ CASH
        if (p.paymentMethod === "cash") {
            return (
                <span className="px-2 py-1 text-[10px] font-black rounded-lg bg-blue-100 text-blue-700 uppercase">
                    💵 Cash
                </span>
            );
        }

        // ✅ ONLINE
        if (p.screenshot) {
            return (
                <span className="px-2 py-1 text-[10px] font-black rounded-lg bg-indigo-100 text-indigo-700 uppercase">
                    📲 Online
                </span>
            );
        }

        // fallback
        return (
            <span className="px-2 py-1 text-[10px] font-black rounded-lg bg-slate-100 text-slate-400 uppercase">
                None
            </span>
        );
    };

    return (
        <div className="max-w-7xl mx-auto text-left">
            {/* Header & Main Action */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Revenue Management</h2>
                    <p className="text-slate-500 text-sm">Monitor maintenance collections and verify transactions.</p>
                </div>
                <button
                    onClick={handleGenerate}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center gap-2"
                >
                    <span>⚡</span> Generate Monthly Bills
                </button>

                {/* New Button added */}
                <button
                    onClick={() => setShowCashModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-100 transition-all active:scale-95 flex items-center gap-2"
                >
                    💵 Add Cash Payment
                </button>
            </div>

            {/* Filter Toolbar - Grid Adjusted */}
            <div className="bg-white border border-slate-200 rounded-[2rem] p-8 mb-8 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Period</label>
                        <input
                            type="month"
                            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                            onChange={(e) => setMonth(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Society</label>
                        <select
                            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 transition-all cursor-pointer"
                            value={selectedSociety}
                            onChange={(e) => {
                                setSelectedSociety(e.target.value);
                                setWing("");
                            }}
                        >
                            <option value="">All Societies</option>
                            {societies.map((s) => (
                                <option key={s._id} value={s._id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Wing</label>
                        <select
                            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 transition-all cursor-pointer"
                            value={wing}
                            onChange={(e) => setWing(e.target.value)}
                        >
                            <option value="">All Wings</option>
                            {wings.map((w) => (
                                <option key={w} value={w}>Wing {w}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Search Records</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                            <input
                                type="text"
                                placeholder="Name or Flat (A-101)..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                            />
                        </div>
                    </div>
                </div>
                <br />

                <div className="flex bg-slate-100 p-1 rounded-xl gap-1 ml-auto">
                    {["all", "pending", "approved", "rejected"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* New Filter  */}
                <div className="flex bg-slate-100 p-1 rounded-xl gap-1 ml-auto mt-3">
                    {["all", "cash", "online"].map((m) => (
                        <button
                            key={m}
                            onClick={() => setMethodFilter(m)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${methodFilter === m
                                ? "bg-white text-indigo-600 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            {m === "all" ? "All" : m === "cash" ? "Cash" : "Online"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm mb-8">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Resident</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Flat</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Month</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Paid</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Balance</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Select</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Proof</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                                    Source
                                </th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredPayments.map((p) => (
                                <tr key={p._id || p.flatId?._id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-700">{p.flatId?.ownerName}</td>
                                    <td className="px-6 py-4 text-center font-bold text-slate-500">
                                        <span className="bg-slate-100 px-2 py-1 rounded text-xs">{p.flatId?.wing}-{p.flatId?.flatNo}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center text-sm font-medium text-slate-600">{p.month}</td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-900">₹{p.amount}</td>
                                    <td className="px-6 py-4 text-right font-bold text-emerald-600">₹{p.totalPaid || 0}</td>
                                    <td className="px-6 py-4 text-right font-bold text-red-500">₹{p.balance}</td>
                                    <td className="px-6 py-4 text-center">
                                        {/* <span className={badgeClass(p.status)}>{p.status}</span> */}
                                        <span className={badgeClass(p.status, p.paymentMethod)}>
                                            {p.paymentMethod === "cash" ? "Approved" : p.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <input
                                            type="radio"
                                            name="payment"
                                            className="w-4 h-4 text-indigo-600 accent-indigo-600 cursor-pointer"
                                            value={p._id}
                                            onChange={() => setSelectedId(p._id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {(p.paymentMethod === "cash" || (!p.screenshot && p.totalPaid > 0)) ? (
                                            <span className="text-[10px] font-bold text-blue-600 uppercase">
                                                💵 Cash Payment
                                            </span>
                                        ) : p.screenshot ? (
                                            <a href={`${IMAGE_BASE_URL}/${p.screenshot}`} target="_blank" rel="noreferrer">
                                                <img
                                                    src={`${IMAGE_BASE_URL}/${p.screenshot}`}
                                                    className="w-12 h-12 object-cover rounded-lg mx-auto border border-slate-200 hover:scale-110 transition-transform"
                                                />
                                            </a>
                                        ) : (
                                            <span className="text-[10px] font-bold text-slate-300 uppercase">None</span>
                                        )}
                                    </td>
                                    <td className="px-2 py-4 text-center">
                                        {paymentSourceBadge(p)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => handleViewHistory(p.flatId._id)}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${showHistoryFor === p.flatId._id
                                                ? "bg-slate-900 text-white"
                                                : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                                                }`}
                                        >
                                            {showHistoryFor === p.flatId._id ? "Close" : "History"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Upload Logic Section */}
            <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm mb-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                        <div className="relative group">
                            <input
                                type="file"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                onChange={(e) => setFile(e.target.files[0])}
                            />
                            <div className="bg-slate-50 border border-dashed border-slate-300 px-6 py-3 rounded-2xl text-sm font-bold text-slate-500 group-hover:border-indigo-400 group-hover:text-indigo-600 transition-all">
                                {file ? file.name : "📎 Select Payment Proof"}
                            </div>
                        </div>

                        <button
                            disabled={!file || !selectedId || (selectedPayment && selectedPayment.balance === 0)}
                            onClick={async () => {
                                const formData = new FormData();
                                formData.append("paymentId", selectedId);
                                formData.append("screenshot", file);
                                const res = await API.post("/payments/upload", formData);
                                setToast({
                                    status: res.data.status,
                                    reason: res.data.reason,
                                    months: res.data.appliedMonths,
                                });
                                setFile(null);
                                setSelectedId("");
                                fetchPayments();
                            }}
                            className={`px-8 py-3 rounded-2xl font-bold text-sm transition-all ${!file || !selectedId || (selectedPayment && selectedPayment.balance === 0)
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-emerald-600 text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700 active:scale-95"
                                }`}
                        >
                            Confirm & Upload
                        </button>
                    </div>

                    {selectedPayment?.balance === 0 && (
                        <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl text-emerald-600 text-xs font-bold animate-bounce">
                            <span>✅</span> All Dues Settled for this Flat
                        </div>
                    )}
                </div>
            </div>

            {/* History Drawer */}
            <AnimatePresence>
                {showHistoryFor && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="bg-slate-900 rounded-[2.5rem] p-8 text-white mb-12 shadow-2xl"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black tracking-tight">Statement of Account</h3>
                            <button onClick={() => setShowHistoryFor(null)} className="text-slate-400 hover:text-white">✕</button>
                        </div>
                        <div className="overflow-hidden rounded-2xl border border-slate-800">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-800/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                        <th className="px-6 py-4">Billing Month</th>
                                        <th className="px-6 py-4">Maintenance Amt</th>
                                        <th className="px-6 py-4">Total Paid</th>
                                        <th className="px-6 py-4">Outstanding</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Source</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {[...history]
                                        .sort((a, b) => b.month.localeCompare(a.month))
                                        .map((h) => (
                                            <tr key={h._id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 font-bold">{h.month}</td>
                                                <td className="px-6 py-4 text-slate-400">₹{h.amount}</td>
                                                <td className="px-6 py-4 text-emerald-400 font-bold">₹{h.paidAmount || 0}</td>
                                                <td className="px-6 py-4 text-red-400 font-bold">₹{h.remainingAmount ?? h.amount}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${h.status === "approved" ? "text-emerald-400" : "text-amber-400"}`}>
                                                        {h.status === "approved" ? "Settled" : "Unpaid"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {paymentSourceBadge(h)}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        className="fixed bottom-10 right-10 bg-slate-900 border border-slate-800 text-white p-6 rounded-3xl shadow-2xl z-[100] max-w-xs"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xl shadow-lg shadow-emerald-500/20">✓</div>
                            <button onClick={() => setToast(null)} className="text-slate-500 hover:text-white">✕</button>
                        </div>
                        <p className="text-sm font-bold text-slate-100 mb-1">Upload Result: {toast.status}</p>
                        <p className="text-xs text-slate-400 leading-relaxed mb-4">{toast.reason}</p>
                        {toast.months && toast.months.length > 0 && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Applied Periods</p>
                                <p className="text-xs font-bold text-emerald-200">{toast.months.join(", ")}</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showCashModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl"
                        >
                            <h3 className="text-xl font-black text-slate-900 mb-6">
                                💵 Add Cash Payment
                            </h3>

                            <input
                                type="text"
                                placeholder="🔍 Search flat or owner..."
                                value={cashSearch}
                                onChange={(e) => setCashSearch(e.target.value)}
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm font-bold mb-3"
                            />

                            {/* Select Flat */}
                            <div className="mb-4">
                                <label className="text-xs font-bold text-slate-500 mb-1 block">
                                    Select Flat
                                </label>
                                <select
                                    value={cashFlat}
                                    onChange={(e) => setCashFlat(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm font-bold"
                                >
                                    <option value="">Select Flat</option>
                                    {filteredFlats.map((f) => (
                                        <option key={f._id} value={f._id}>
                                            {f.wing}-{f.flatNo} ({f.ownerName})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Amount */}
                            <div className="mb-6">
                                <label className="text-xs font-bold text-slate-500 mb-1 block">
                                    Amount
                                </label>
                                <input
                                    type="number"
                                    value={cashAmount}
                                    onChange={(e) => setCashAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm font-bold"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowCashModal(false)}
                                    className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-700"
                                >
                                    Cancel
                                </button>

                                <button
                                    disabled={!cashFlat || !cashAmount}
                                    onClick={async () => {
                                        await API.post("/payments/cash", {
                                            flatId: cashFlat,
                                            amount: cashAmount,
                                        });

                                        setShowCashModal(false);
                                        setCashAmount("");
                                        setCashFlat("");
                                        fetchPayments();
                                    }}
                                    className={`px-6 py-2 rounded-xl text-sm font-bold text-white ${!cashFlat || !cashAmount
                                        ? "bg-slate-300 cursor-not-allowed"
                                        : "bg-emerald-600 hover:bg-emerald-700"
                                        }`}
                                >
                                    Submit
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}



// import { useEffect, useState } from "react";
// import API from "../../services/api";

// export default function AdminPayments() {
//     const [payments, setPayments] = useState([]);
//     const [filter, setFilter] = useState("all");
//     const [month, setMonth] = useState("");
//     const [file, setFile] = useState(null);
//     const [selectedId, setSelectedId] = useState("");
//     const [societies, setSocieties] = useState([]);
//     const [selectedSociety, setSelectedSociety] = useState("");
//     const [history, setHistory] = useState([]);
//     const [showHistoryFor, setShowHistoryFor] = useState(null);
//     const [wing, setWing] = useState("");
//     const [toast, setToast] = useState(null);

//     const selectedPayment = payments.find(p => p._id === selectedId);

//     const wings = [...new Set(payments.map(p => p.flatId?.wing).filter(Boolean))];

//     const handleGenerate = async () => {
//         try {
//             await API.post("/payments/create");
//             alert("Monthly payments generated");
//             await fetchPayments();
//         } catch (err) {
//             alert("Error generating payments");
//         }
//     };

//     const fetchSocieties = async () => {
//         const res = await API.get("/societies");
//         setSocieties(res.data);
//     };

//     const fetchPayments = async () => {

//         const query = new URLSearchParams();

//         if (month) query.append("month", month);
//         if (selectedSociety) query.append("societyId", selectedSociety);
//         if (wing) query.append("wing", wing); // 🔥 NEW

//         const res = await API.get(`/payments?${query.toString()}`);
//         setPayments(res.data);
//     };

//     useEffect(() => {
//         fetchPayments();
//         fetchSocieties(); // 🔥 ADD THIS

//         setShowHistoryFor(null); // 🔥 ADD THIS
//         setHistory([]);          // 🔥 ADD THIS


//     }, [month, selectedSociety, wing]);


//     const handleViewHistory = async (flatId) => {
//         // 🔥 If same flat clicked → CLOSE
//         if (showHistoryFor === flatId) {
//             setShowHistoryFor(null);
//             setHistory([]);
//             return;
//         }

//         // 🔥 Otherwise fetch & show
//         const res = await API.get(`/payments/history/${flatId}`);
//         setHistory(res.data);
//         setShowHistoryFor(flatId);
//     };

//     const filteredPayments = payments.filter((p) => {

//         // ❌ REMOVE fake rows after real data exists
//         if (!p._id && p.month === null) {
//             // check if same flat has real data
//             const hasReal = payments.some(
//                 real => real.flatId?._id === p.flatId?._id && real._id !== null
//             );

//             if (hasReal) return false;
//         }

//         if (filter === "all") return true;
//         return p.status === filter;
//     });

//     return (
//         <div>
//             <h2 className="text-xl font-bold mb-4">Payment Management</h2>

//             <input
//                 type="month"
//                 className="border p-2 mb-4"
//                 onChange={(e) => setMonth(e.target.value)}
//             />

//             <select
//                 className="border p-2 mb-4 mr-3"
//                 value={selectedSociety}
//                 onChange={(e) => {
//                     setSelectedSociety(e.target.value);
//                     setWing("");
//                 }}
//             >
//                 <option value="">Select Society</option>
//                 {societies.map((s) => (
//                     <option key={s._id} value={s._id}>
//                         {s.name}
//                     </option>
//                 ))}
//             </select>

//             <select
//                 className="border p-2 mb-4 mr-3"
//                 value={wing}
//                 onChange={(e) => setWing(e.target.value)}
//             >
//                 <option value="">All Wings</option>
//                 {wings.map((w) => (
//                     <option key={w} value={w}>
//                         Wing {w}
//                     </option>
//                 ))}
//             </select>

//             {/* Filters */}
//             <div className="flex gap-3 mb-4">
//                 {["all", "pending", "approved", "rejected"].map((f) => (
//                     <button
//                         key={f}
//                         onClick={() => setFilter(f)}
//                         className={`px-4 py-2 rounded ${filter === f
//                             ? "bg-blue-600 text-white"
//                             : "bg-gray-200"
//                             }`}
//                     >
//                         {f.toUpperCase()}
//                     </button>
//                 ))}
//             </div>

//             <button
//                 onClick={handleGenerate}
//                 className="bg-purple-600 text-white px-4 py-2 rounded mb-4"
//             >
//                 Generate Monthly Payments
//             </button>


//             {/* Table */}
//             <table className="w-full border">
//                 <thead className="bg-gray-200">
//                     <tr>
//                         <th className="p-2">User</th>
//                         <th className="p-2">Flat</th>
//                         <th className="p-2">Month</th>
//                         <th className="p-2">Amount</th>
//                         <th className="p-2">Paid</th>
//                         <th className="p-2">Outstanding Balance</th>
//                         <th className="p-2">Status</th>
//                         <th className="p-2">Select</th>
//                         <th className="p-2">Proof</th>
//                         <th className="p-2">Prev Months</th>
//                     </tr>
//                 </thead>

//                 <tbody>
//                     {filteredPayments.map((p) => (
//                         // <tr key={p._id} className="text-center border-t">
//                         <tr key={p._id || p.flatId?._id} className="text-center border-t">

//                             <td>{p.flatId?.ownerName}</td>
//                             <td>
//                                 {p.flatId?.wing}-{p.flatId?.flatNo}
//                             </td>
//                             <td>{p.month}</td>
//                             <td>₹{p.amount}</td>
//                             <td className="text-green-600 font-semibold">
//                                 {/* ₹{p.paidAmount || 0} */}
//                                 ₹{p.totalPaid || 0}
//                             </td>
//                             <td className="text-red-600 font-semibold">
//                                 ₹{p.balance}
//                                 {/* ₹{p.remainingAmount ?? p.amount} */}
//                             </td>

//                             {/* Status */}
//                             <td
//                                 className={
//                                     p.status === "approved"
//                                         ? "text-green-600 font-semibold"
//                                         : p.status === "rejected"
//                                             ? "text-red-600 font-semibold"
//                                             : "text-yellow-600 font-semibold"
//                                 }
//                             >
//                                 {p.status}
//                             </td>

//                             <td>
//                                 <input
//                                     type="radio"
//                                     name="payment"
//                                     value={p._id}
//                                     onChange={() => setSelectedId(p._id)}
//                                 />
//                             </td>

//                             {/* Screenshot */}
//                             <td>
//                                 {p.screenshot ? (
//                                     <a
//                                         href={`http://localhost:3000/${p.screenshot}`}
//                                         target="_blank"
//                                         rel="noreferrer"
//                                     >
//                                         <img
//                                             src={`http://localhost:3000/${p.screenshot}`}
//                                             className="w-20 rounded cursor-pointer hover:scale-105 ml-6"
//                                         />
//                                     </a>
//                                 ) : (
//                                     "No proof"
//                                 )}
//                             </td>

//                             <td>
//                                 <button
//                                     onClick={() => handleViewHistory(p.flatId._id)}
//                                     className="bg-indigo-600 text-white px-2 py-1 rounded"
//                                 >
//                                     {showHistoryFor === p.flatId._id ? "Hide" : "History"}
//                                 </button>
//                             </td>

//                         </tr>
//                     ))}
//                 </tbody>
//             </table>

//             <br />

//             <div className="flex gap-3 mt-4">
//                 <input
//                     type="file"
//                     onChange={(e) => setFile(e.target.files[0])}
//                 />

//                 <button
//                     // disabled={!file || !selectedId}
//                     disabled={
//                         !file ||
//                         !selectedId ||
//                         (selectedPayment && selectedPayment.balance === 0)
//                     }
//                     onClick={async () => {
//                         if (!file || !selectedId) {
//                             return alert("Select payment & file");
//                         }

//                         const formData = new FormData();
//                         formData.append("paymentId", selectedId);
//                         formData.append("screenshot", file);

//                         const res = await API.post("/payments/upload", formData);

//                         // alert(
//                         //     `Status: ${res.data.status}\nReason: ${res.data.reason}`
//                         // );

//                         setToast({
//                             status: res.data.status,
//                             reason: res.data.reason,
//                             months: res.data.appliedMonths,
//                         });

//                         setFile(null);
//                         setSelectedId("");
//                         fetchPayments();
//                     }}
//                     className={`px-4 py-2 rounded text-white ${!file || !selectedId
//                         ? "bg-gray-400 cursor-not-allowed"
//                         : "bg-green-600 hover:bg-green-700"
//                         }`}
//                 >
//                     Upload Screenshot
//                 </button>

//                 {/* 🔥 MESSAGE */}
//                 {selectedPayment?.balance === 0 && (
//                     <p className="text-green-600 text-sm">
//                         No pending dues
//                     </p>
//                 )}

//             </div>

//             {showHistoryFor && (
//                 <div className="mt-6">
//                     <h3 className="text-lg font-bold mb-3">Payment History</h3>

//                     <table className="w-full border">
//                         <thead className="bg-gray-200">
//                             <tr>
//                                 <th className="p-2">Month</th>
//                                 <th className="p-2">Amount</th>
//                                 <th className="p-2">Paid</th>
//                                 <th className="p-2">Remaining</th>
//                                 <th className="p-2">Status</th>
//                             </tr>
//                         </thead>

//                         <tbody>
//                             {[...history]
//                                 .sort((a, b) => b.month.localeCompare(a.month)).map((h) => (
//                                     <tr key={h._id} className="text-center border-t">
//                                         <td>{h.month}</td>
//                                         <td>₹{h.amount}</td>
//                                         <td className="text-green-600">
//                                             ₹{h.paidAmount || 0}
//                                         </td>
//                                         <td className="text-red-600">
//                                             {/* ₹{h.remainingAmount || h.amount} */}
//                                             ₹{h.remainingAmount ?? h.amount}
//                                         </td>
//                                         <td
//                                             className={
//                                                 h.status === "approved"
//                                                     ? "text-green-600 font-semibold"
//                                                     : "text-red-600 font-semibold"
//                                             }
//                                         >
//                                             {h.status === "approved" ? "Paid" : "Pending"}
//                                         </td>
//                                     </tr>
//                                 ))}
//                         </tbody>
//                     </table>
//                 </div>
//             )}

//             {toast && (
//                 <div className="fixed top-5 right-5 bg-black text-white px-4 py-3 rounded shadow-lg z-50">

//                     <p><b>Status:</b> {toast.status}</p>
//                     <p><b>Reason:</b> {toast.reason}</p>

//                     {/* 🔥 Applied Months */}
//                     {toast.months && toast.months.length > 0 && (
//                         <p className="text-green-300 mt-1">
//                             <b>Applied to:</b> {toast.months.join(", ")}
//                         </p>
//                     )}

//                     <button
//                         onClick={() => setToast(null)}
//                         className="mt-2 text-sm text-yellow-300"
//                     >
//                         Close
//                     </button>

//                 </div>
//             )}

//         </div>

//     );
// }