import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../services/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AdminSummary() {
  const [data, setData] = useState({});
  const [month, setMonth] = useState("");
  const [selectedWing, setSelectedWing] = useState("");
  const [flats, setFlats] = useState([]);
  const [societies, setSocieties] = useState([]);
  const [selectedSociety, setSelectedSociety] = useState("");
  const [history, setHistory] = useState([]);
  const [showHistoryFor, setShowHistoryFor] = useState(null);

  // 🔥 NEW STATE FOR RANGE MODAL
  const [showRangeModal, setShowRangeModal] = useState(false);
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");

  const fetchSummary = async () => {
    const query = new URLSearchParams();
    if (month) query.append("month", month);
    if (selectedSociety) query.append("societyId", selectedSociety);
    const res = await API.get(`/payments/summary?${query.toString()}`);
    setData(res.data.summary || {});
    setFlats(res.data.flats || []);
  };

  const fetchSocieties = async () => {
    const res = await API.get("/societies");
    setSocieties(res.data);
  };

  useEffect(() => {
    fetchSummary();
    fetchSocieties();
  }, [month, selectedSociety]);

  // ✅ HELPER: Generate list of months between From and To
  const getMonthsRange = (from, to) => {
    let months = [];
    let start = new Date(from + "-01");
    let end = new Date(to + "-01");
    while (start <= end) {
      months.push(start.toISOString().substring(0, 7));
      start.setMonth(start.getMonth() + 1);
    }
    return months;
  };

  // ✅ NEW: COMPATIBLE RANGE EXPORT (EXCEL GRID STYLE)
  const handleExportRangePDF = async () => {
    if (!selectedSociety || !rangeFrom || !rangeTo) return alert("Please select both months");

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const socName = societies.find(s => s._id === selectedSociety)?.name || "Society";
      const selectedMonths = getMonthsRange(rangeFrom, rangeTo);

      doc.setFillColor(255, 255, 0); 
      doc.rect(15, 10, 180, 10, "F");
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`${socName} - Collection Report (${rangeFrom} to ${rangeTo})`, 105, 17, { align: "center" });

      let currentY = 30;

      for (const targetMonth of selectedMonths) {
        const query = new URLSearchParams();
        query.append("month", targetMonth);
        query.append("societyId", selectedSociety);
        const res = await API.get(`/payments/summary?${query.toString()}`);
        
        const mData = res.data.summary || {};
        const mFlats = res.data.flats || [];

        // Month Banner
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        doc.setFillColor(240, 240, 240);
        doc.rect(15, currentY, 180, 7, "F");
        doc.setFontSize(9);
        doc.setTextColor(79, 70, 229);
        doc.text(`Billing Month: ${targetMonth}`, 18, currentY + 5);
        currentY += 10;

        const wingKeys = Object.keys(mData).sort();
        
        wingKeys.forEach((wingKey) => {
          if (currentY > 230) { doc.addPage(); currentY = 20; }

          const wingFlatsData = mFlats.filter(f => f.wing === wingKey);
          const grouped = {};
          wingFlatsData.forEach(f => { grouped[`${f.wing}-${f.flatNo}`] = f; });
          const finalFlatRows = Object.values(grouped);

          const rows = finalFlatRows.map(f => [
            `${f.wing}-${f.flatNo}`,
            f.ownerName,
            f.flatType || f.type || "-",
            f.occupantType === 'tenant' ? `${f.amount} (T)` : `${f.amount}`,
            f.status === "approved" ? "Paid" : "Unpaid"
          ]);

          const wingTotal = mData[wingKey]?.total || 0;

          rows.push([
            { content: 'Total', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold', fillColor: [255, 255, 0] } }, 
            { content: wingTotal.toString(), colSpan: 2, styles: { fontStyle: 'bold', fillColor: [255, 255, 0] } }
          ]);

          autoTable(doc, {
            startY: currentY,
            head: [[{ content: `Wing- ${wingKey}`, styles: { fillColor: [255, 255, 0], textColor: [0, 0, 0] } }, 'Owner', 'Flat type', 'Exp Amt', 'Status']],
            body: rows,
            theme: 'grid',
            styles: { fontSize: 7, cellPadding: 1.5, textColor: [0, 0, 0] },
            headStyles: { fontStyle: 'bold' },
            margin: { left: 15, right: 15 },
          });

          currentY = doc.lastAutoTable.finalY + 10;
        });
      }

      doc.save(`${socName}_Revenue_${rangeFrom}_to_${rangeTo}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Error generating report");
    }
  };

  const wingFlats = (() => {
    if (!selectedWing) return [];
    const filtered = flats.filter((f) => f.wing === selectedWing);
    const grouped = {};
    filtered.forEach((f) => {
      const key = `${f.wing}-${f.flatNo}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(f);
    });
    return Object.values(grouped).map((flatPayments) => flatPayments[flatPayments.length - 1]);
  })();

  const handleViewHistory = async (flatId) => {
    if (showHistoryFor === flatId) { setShowHistoryFor(null); setHistory([]); return; }
    const res = await API.get(`/payments/history/${flatId}`);
    setHistory(res.data);
    setShowHistoryFor(flatId);
  };

  const selectClass = "px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all";

  const paymentSourceBadge = (p) => {
    if (!p.paidAmount || p.paidAmount === 0) return <span className="px-2 py-1 text-[10px] font-black rounded-lg bg-slate-100 text-slate-400 uppercase">None</span>;
    if (p.paymentMethod === "cash") return <span className="px-2 py-1 text-[10px] font-black rounded-lg bg-blue-100 text-blue-700 uppercase">💵 Cash</span>;
    if (p.screenshot) return <span className="px-2 py-1 text-[10px] font-black rounded-lg bg-indigo-100 text-indigo-700 uppercase">📲 Online</span>;
    return <span className="px-2 py-1 text-[10px] font-black rounded-lg bg-slate-100 text-slate-400 uppercase">None</span>;
  };

  return (
    <div className="max-w-6xl text-left">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Collection Summary</h2>
          <p className="text-slate-500 text-sm mt-1">Detailed financial breakdown by society and wing.</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowRangeModal(true)}
            disabled={!selectedSociety}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            <span>📋</span> Export Revenue Report
          </button>
        </div>
      </header>

      <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-wrap gap-6 mb-8 items-end">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Period</label>
          <input type="month" className={selectClass} onChange={(e) => setMonth(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Society</label>
          <select className={selectClass} value={selectedSociety} onChange={(e) => setSelectedSociety(e.target.value)}>
            <option value="">Select Society</option>
            {societies.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Wing Navigation</label>
          <select className={selectClass} value={selectedWing} onChange={(e) => setSelectedWing(e.target.value)}>
            <option value="">Choose Wing</option>
            {Object.keys(data).map((wing) => <option key={wing} value={wing}>Wing {wing}</option>)}
          </select>
        </div>
      </div>

      {selectedWing && data[selectedWing] && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Total Receivable</p>
            <p className="text-3xl font-black text-slate-900">₹{data[selectedWing].total.toLocaleString()}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2">Total Collected</p>
            <p className="text-3xl font-black text-emerald-700">₹{data[selectedWing].collected.toLocaleString()}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-red-50 p-6 rounded-3xl border border-red-100">
            <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em] mb-2">Remaining Dues</p>
            <p className="text-3xl font-black text-red-700">₹{data[selectedWing].remaining.toLocaleString()}</p>
          </motion.div>
        </div>
      )}

      {selectedWing && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Owner</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Billing</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {wingFlats.map((f) => (
                  <tr key={`${f.wing}-${f.flatNo}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-4 font-black text-slate-900">{f.wing}-{f.flatNo}</td>
                    <td className="px-8 py-4 text-slate-600 font-bold">{f.ownerName}</td>
                    <td className="px-8 py-4 text-xs font-bold text-slate-400 uppercase">{f.occupantType}</td>
                    <td className="px-8 py-4 font-black text-slate-700">₹{f.amount}</td>
                    <td className="px-8 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${f.status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                        {f.status === "approved" ? "Settled" : "Pending"}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <button
                        onClick={() => handleViewHistory(f.flatId)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${showHistoryFor === f.flatId ? "bg-slate-900 text-white" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"}`}
                      >
                        {showHistoryFor === f.flatId ? "Close" : "Statement"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <AnimatePresence>
            {showHistoryFor && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white mt-4 shadow-2xl">
                  <h4 className="text-lg font-black mb-6 tracking-tight flex items-center gap-2">
                    <span className="text-indigo-400">●</span> Historical Payment Statement
                  </h4>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <th className="px-6 py-4 text-left">Billing Month</th>
                        <th className="px-6 py-4 text-left">Billed</th>
                        <th className="px-6 py-4 text-left">Paid</th>
                        <th className="px-6 py-4 text-left">Remaining</th>
                        <th className="px-6 py-4 text-right">Verification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {[...history].sort((a, b) => b.month.localeCompare(a.month)).map((h) => (
                        <tr key={h._id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-bold">{h.month}</td>
                          <td className="px-6 py-4">₹{h.amount}</td>
                          <td className="px-6 py-4 text-emerald-400">₹{h.paidAmount || 0}</td>
                          <td className="px-6 py-4 text-red-400">₹{h.remainingAmount ?? h.amount}</td>
                          <td className="px-6 py-4 text-right">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${h.status === "approved" ? "text-emerald-400" : "text-amber-400"}`}>
                              {h.status === "approved" ? "Cleared" : "Unverified"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 🔥 NEW: FROM-TO MONTH SELECTION MODAL */}
      {showRangeModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-[400px] shadow-2xl">
            <h3 className="text-lg font-black mb-6 flex items-center gap-2">
               <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">📋</span>
               Select Report Range
            </h3>
            <div className="space-y-4">
               <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">From Month</label>
                  <input type="month" value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} className="w-full border px-4 py-3 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-emerald-500" />
               </div>
               <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">To Month</label>
                  <input type="month" value={rangeTo} onChange={(e) => setRangeTo(e.target.value)} className="w-full border px-4 py-3 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-emerald-500" />
               </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setShowRangeModal(false)} className="px-6 py-3 rounded-xl bg-slate-100 font-bold text-sm text-slate-600">Cancel</button>
              <button onClick={() => { handleExportRangePDF(); setShowRangeModal(false); }} className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all">Generate Report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
