import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../services/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Balance() {
  const [societies, setSocieties] = useState([]);
  const [selectedSociety, setSelectedSociety] = useState("");
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedWing, setSelectedWing] = useState("");

  // 🔥 NEW STATE: Track which resident's maintenance is expanded
  const [expandedResident, setExpandedResident] = useState(null);

  const tabs = [
    { id: "all", label: "All Entries" },
    { id: "maintenance", label: "Maintenance" },
    { id: "donation", label: "Donations" },
    { id: "flatsell", label: "Flat Sell" },
    { id: "expense", label: "Expenses" },
  ];

  useEffect(() => { fetchSocieties(); }, []);
  useEffect(() => { fetchBalance(selectedSociety); }, [selectedSociety]);

  const fetchSocieties = async () => {
    const res = await API.get("/societies");
    setSocieties(res.data);
  };

  const fetchBalance = async (id) => {
    if (!id) return;
    const res = await API.get(`/balance/${id}`);
    setData(res.data);
  };

  // ✅ LOGIC: Grouping maintenance by resident for the clean UI view
  const groupedMaintenance = (() => {
    if (!data?.maintenanceDetails) return [];
    const grouped = {};
    data.maintenanceDetails
      .filter(m => !selectedWing || m.wing === selectedWing)
      .forEach(m => {
        const key = `${m.wing}-${m.flatNo}`;
        if (!grouped[key]) {
          grouped[key] = {
            ownerName: m.ownerName,
            wing: m.wing,
            flatNo: m.flatNo,
            totalPaid: 0,
            history: []
          };
        }
        grouped[key].totalPaid += m.amount;
        grouped[key].history.push(m);
      });
    return Object.values(grouped);
  })();

  // ✅ LOGIC PRESERVED EXACTLY
  const handleExportPDF = () => {
    if (!data) return;

    try {
      const doc = new jsPDF();
      const societyName = societies.find(s => s._id === selectedSociety)?.name || "Society";

      // Header Section
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 45, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text("FINANCIAL AUDIT REPORT", 15, 20);
      doc.setFontSize(10);
      doc.text(`SOCIETY: ${societyName.toUpperCase()}`, 15, 30);
      doc.text(`DATE: ${new Date().toLocaleString()}`, 15, 36);

      // Summary Box
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, 50, 180, 25, 3, 3, "FD");
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);
      doc.text("OPENING", 20, 58);
      doc.text("INCOME", 65, 58);
      doc.text("EXPENSES", 110, 58);
      doc.text("NET BALANCE", 155, 58);
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.text(`Rs. ${data.openingBalance?.toLocaleString()}`, 20, 67);
      doc.text(`Rs. ${data.totalIncome?.toLocaleString()}`, 65, 67);
      doc.text(`Rs. ${data.totalExpense?.toLocaleString()}`, 110, 67);
      doc.text(`Rs. ${data.currentBalance?.toLocaleString()}`, 155, 67);

      let finalY = 85;

      // --- SECTION 1: MAINTENANCE (GROUPED BY RESIDENT) ---
      if (data.maintenanceDetails?.length > 0) {
        doc.setTextColor(79, 70, 229); // Indigo
        doc.setFontSize(12);
        doc.text("1. Maintenance Collections (Grouped)", 15, finalY);

        // Grouping logic for PDF
        const pdfGrouped = {};
        data.maintenanceDetails.forEach(m => {
          const key = `${m.wing}-${m.flatNo}`;
          if (!pdfGrouped[key]) {
            pdfGrouped[key] = { name: m.ownerName, total: 0, count: 0 };
          }
          pdfGrouped[key].total += m.amount;
          pdfGrouped[key].count += 1;
        });

        autoTable(doc, {
          startY: finalY + 2,
          head: [['Flat', 'Resident Name', 'Period', 'Total Paid']],
          body: Object.entries(pdfGrouped).map(([unit, info]) => [
            unit,
            info.name,
            `${info.count} Month(s)`,
            `+ Rs. ${info.total.toLocaleString()}`
          ]),
          headStyles: { fillColor: [79, 70, 229] },
          margin: { left: 15, right: 15 },
          styles: { fontSize: 9 }
        });
        finalY = doc.lastAutoTable.finalY + 12;
      }

      // --- SECTION 2: DONATIONS ---
      const donations = data.gifts.filter(g => g.type === "donation");
      if (donations.length > 0) {
        doc.setTextColor(16, 185, 129); // Emerald
        doc.setFontSize(12);
        doc.text("2. Donations Received", 15, finalY);
        autoTable(doc, {
          startY: finalY + 2,
          head: [['Donor Name', 'Category', 'Amount']],
          body: donations.map(d => [d.donorName, 'Donation', `+ Rs. ${d.amount.toLocaleString()}`]),
          headStyles: { fillColor: [16, 185, 129] },
          margin: { left: 15, right: 15 }
        });
        finalY = doc.lastAutoTable.finalY + 12;
      }

      // --- SECTION 3: FLAT SALES ---
      const sales = data.gifts.filter(g => g.type === "flatsell" || g.type === "flatSell");
      if (sales.length > 0) {
        doc.setTextColor(59, 130, 246); // Blue
        doc.setFontSize(12);
        doc.text("3. Flat Sale Income", 15, finalY);
        autoTable(doc, {
          startY: finalY + 2,
          head: [['Resident / Flat', 'Category', 'Amount']],
          body: sales.map(s => [`${s.wing}-${s.flatNo} (${s.ownerName})`, 'Flat Sale', `+ Rs. ${s.amount.toLocaleString()}`]),
          headStyles: { fillColor: [59, 130, 246] },
          margin: { left: 15, right: 15 }
        });
        finalY = doc.lastAutoTable.finalY + 12;
      }

      // --- SECTION 4: EXPENSES ---
      if (data.expenses?.length > 0) {
        doc.setTextColor(220, 38, 38); // Red
        doc.setFontSize(12);
        doc.text("4. Expenditure Details", 15, finalY);
        autoTable(doc, {
          startY: finalY + 2,
          head: [['Task Description', 'Paid To', 'Amount']],
          body: data.expenses.map(e => [e.taskName, e.paidTo, `- Rs. ${e.amount.toLocaleString()}`]),
          headStyles: { fillColor: [220, 38, 38] },
          margin: { left: 15, right: 15 }
        });
      }

      doc.save(`${societyName}_Clean_Audit_Report.pdf`);
    } catch (err) {
      console.error(err);
      alert("Error generating report.");
    }
  };

  const selectClass = "px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all cursor-pointer";
  const thClass = "px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400";
  const tdClass = "px-6 py-4 text-sm font-medium text-slate-600";

  return (
    <div className="max-w-7xl mx-auto text-left px-6">
      <header className="mb-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Balance Dashboard</h2>
          <p className="text-slate-500 text-sm mt-1">Real-time oversight of society funds and capital flow.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
          <select className={selectClass} value={selectedSociety} onChange={(e) => setSelectedSociety(e.target.value)}>
            <option value="">Choose Society...</option>
            {societies.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>

          <select className={selectClass} value={selectedWing} onChange={(e) => setSelectedWing(e.target.value)}>
            <option value="">All Wings</option>
            {[...new Set(data?.maintenanceDetails?.map(m => m.wing))].map(w => (
              <option key={w} value={w}>Wing {w}</option>
            ))}
          </select>

          <button onClick={handleExportPDF} disabled={!data} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-indigo-600 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2">
            <span>📄</span> Export Audit
          </button>
        </div>
      </header>

      {data && (
        <div className="space-y-8">
          <AnimatePresence>
            {activeTab === "all" && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Opening Balance", value: data.openingBalance, color: "text-indigo-600", icon: "🏛️" },
                  { label: "Total Revenue", value: data.totalIncome, color: "text-emerald-600", icon: "📈" },
                  { label: "Total Outflow", value: data.totalExpense, color: "text-red-500", icon: "📉" },
                  { label: "Current Cash", value: data.currentBalance, color: "text-slate-900", icon: "💰" },
                ].map((item, i) => (
                  <div key={i} className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <span className="absolute top-4 right-4 text-xl opacity-20 group-hover:opacity-40 transition-opacity">{item.icon}</span>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{item.label}</p>
                    <h3 className={`text-2xl font-black ${item.color}`}>₹{item.value?.toLocaleString()}</h3>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit gap-1">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => { setActiveTab(tab.id); setExpandedResident(null); }} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className={thClass}>Entry Type</th>
                      <th className={thClass}>Entity / Description</th>
                      <th className={`${thClass} text-right`}>{activeTab === "maintenance" ? "Total Collection" : "Value"}</th>
                      {activeTab === "maintenance" && <th className={`${thClass} text-center`}>Action</th>}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-50">
                    {activeTab === "all" && (
                      <tr className="bg-indigo-50/30">
                        <td className={tdClass}><span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-black uppercase">Initial</span></td>
                        <td className="px-6 py-4 font-bold text-slate-900">Opening Balance</td>
                        <td className="px-6 py-4 text-indigo-600 font-black text-right">₹{data.openingBalance?.toLocaleString()}</td>
                      </tr>
                    )}

                    {/* --- GROUPED MAINTENANCE VIEW --- */}
                    {activeTab === "maintenance" && groupedMaintenance.map((res, i) => (
                      <React.Fragment key={i}>
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className={tdClass}><span className="px-2.5 py-1 bg-teal-100 text-teal-700 rounded-lg text-[10px] font-black uppercase">Maintenance</span></td>
                          <td className={tdClass}>
                            <span className="font-bold text-slate-900">{res.wing}-{res.flatNo}</span>
                            <span className="ml-2 text-slate-500 font-medium">{res.ownerName}</span>
                          </td>
                          <td className="px-6 py-4 text-emerald-600 font-black text-right">₹{res.totalPaid.toLocaleString()}</td>
                          <td className="px-6 py-4 text-center">
                            <button onClick={() => setExpandedResident(expandedResident === i ? null : i)} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-100 transition-all">
                              {expandedResident === i ? "Close" : "Check Statement"}
                            </button>
                          </td>
                        </tr>
                        {expandedResident === i && (
                          <tr>
                            <td colSpan="4" className="p-0 border-none">
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="overflow-hidden bg-slate-900 text-white mx-6 mb-6 rounded-[1.5rem]">
                                <div className="p-6">
                                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> Statement Details
                                  </h4>
                                  <table className="w-full text-xs">
                                    <thead className="text-slate-500 border-b border-white/10">
                                      <tr>
                                        <th className="py-3 text-left">Month</th>
                                        <th className="py-3 text-right">Amount</th>
                                        <th className="py-3 text-right">Verification</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                      {res.history.sort((a, b) => b.month.localeCompare(a.month)).map((h, idx) => (
                                        <tr key={idx}>
                                          <td className="py-3 font-bold">{h.month}</td>
                                          <td className="py-3 text-right font-bold text-emerald-400">₹{h.amount}</td>
                                          <td className="py-3 text-right text-[10px] font-black uppercase text-slate-400">{h.status === "approved" ? "Verified" : "Pending"}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}

                    {data.gifts.filter(g => activeTab === "all" || activeTab === (g.type === "donation" ? "donation" : "flatsell")).map((g) => (
                      <tr key={g._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className={tdClass}><span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${g.type === "donation" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>{g.type === "donation" ? "Donation" : "Flat Sale"}</span></td>
                        <td className={tdClass}><span className="font-bold text-slate-800">{g.type === "donation" ? g.donorName : `${g.wing}-${g.flatNo} (${g.ownerName})`}</span></td>
                        <td className="px-6 py-4 text-emerald-600 font-black text-right">+₹{g.amount?.toLocaleString()}</td>
                      </tr>
                    ))}

                    {data.expenses.filter(() => activeTab === "all" || activeTab === "expense").map((e) => (
                      <tr key={e._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className={tdClass}><span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-lg text-[10px] font-black uppercase">Expense</span></td>
                        <td className={tdClass}><span className="font-bold text-slate-800">{e.taskName}</span> <span className="ml-2 text-[10px] text-slate-400 uppercase italic">to {e.paidTo}</span></td>
                        <td className="px-6 py-4 text-red-500 font-black text-right">-₹{e.amount?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {activeTab === "all" && (
                <div className="bg-slate-900 px-8 py-6 flex justify-between items-center text-white">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Net Treasury Standing</span>
                  <span className="text-2xl font-black">₹{data.currentBalance?.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



// import { useEffect, useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import API from "../../services/api";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";

// export default function Balance() {
//   const [societies, setSocieties] = useState([]);
//   const [selectedSociety, setSelectedSociety] = useState("");
//   const [data, setData] = useState(null);
//   const [activeTab, setActiveTab] = useState("all");
//   const [selectedWing, setSelectedWing] = useState("");

//   const tabs = [
//     { id: "all", label: "All Entries" },
//     { id: "maintenance", label: "Maintenance" },
//     { id: "donation", label: "Donations" },
//     { id: "flatsell", label: "Flat Sell" },
//     { id: "expense", label: "Expenses" },
//   ];

//   useEffect(() => { fetchSocieties(); }, []);
//   useEffect(() => { fetchBalance(selectedSociety); }, [selectedSociety]);

//   const fetchSocieties = async () => {
//     const res = await API.get("/societies");
//     setSocieties(res.data);
//   };

//   const fetchBalance = async (id) => {
//     if (!id) return;
//     const res = await API.get(`/balance/${id}`);
//     setData(res.data);
//   };

//   // ✅ 🔥 ENTERPRISE PDF EXPORT - SEPARATED CATEGORIES
//   const handleExportPDF = () => {
//     if (!data) return;

//     try {
//       const doc = new jsPDF();
//       const societyName = societies.find(s => s._id === selectedSociety)?.name || "Society";

//       // Header Section
//       doc.setFillColor(15, 23, 42);
//       doc.rect(0, 0, 210, 45, "F");
//       doc.setTextColor(255, 255, 255);
//       doc.setFontSize(22);
//       doc.text("FINANCIAL AUDIT REPORT", 15, 20);
//       doc.setFontSize(10);
//       doc.text(`SOCIETY: ${societyName.toUpperCase()}`, 15, 30);
//       doc.text(`DATE: ${new Date().toLocaleString()}`, 15, 36);

//       // Summary Box
//       doc.setDrawColor(226, 232, 240);
//       doc.setFillColor(248, 250, 252);
//       doc.roundedRect(15, 50, 180, 25, 3, 3, "FD");
//       doc.setTextColor(100, 116, 139);
//       doc.setFontSize(8);
//       doc.text("OPENING", 20, 58);
//       doc.text("INCOME", 65, 58);
//       doc.text("EXPENSES", 110, 58);
//       doc.text("NET BALANCE", 155, 58);
//       doc.setTextColor(15, 23, 42);
//       doc.setFontSize(11);
//       doc.text(`Rs. ${data.openingBalance}`, 20, 67);
//       doc.text(`Rs. ${data.totalIncome}`, 65, 67);
//       doc.text(`Rs. ${data.totalExpense}`, 110, 67);
//       doc.text(`Rs. ${data.currentBalance}`, 155, 67);

//       let finalY = 85;

//       // --- SECTION 1: MAINTENANCE ---
//       if (data.maintenanceCollections?.length > 0) {
//         doc.setTextColor(79, 70, 229); // Indigo
//         doc.setFontSize(12);
//         doc.text("1. Maintenance Collections", 15, finalY);
//         autoTable(doc, {
//           startY: finalY + 2,
//           head: [['Month', 'Category', 'Amount']],
//           body: data.maintenanceCollections.map(m => [m.month, 'Maintenance', `+ Rs. ${m.amount}`]),
//           headStyles: { fillColor: [79, 70, 229] },
//           margin: { left: 15, right: 15 }
//         });
//         finalY = doc.lastAutoTable.finalY + 12;
//       }

//       // --- SECTION 2: DONATIONS ---
//       const donations = data.gifts.filter(g => g.type === "donation");
//       if (donations.length > 0) {
//         doc.setTextColor(16, 185, 129); // Emerald
//         doc.setFontSize(12);
//         doc.text("2. Donations Received", 15, finalY);
//         autoTable(doc, {
//           startY: finalY + 2,
//           head: [['Donor Name', 'Category', 'Amount']],
//           body: donations.map(d => [d.donorName, 'Donation', `+ Rs. ${d.amount}`]),
//           headStyles: { fillColor: [16, 185, 129] },
//           margin: { left: 15, right: 15 }
//         });
//         finalY = doc.lastAutoTable.finalY + 12;
//       }

//       // --- SECTION 3: FLAT SALES ---
//       const sales = data.gifts.filter(g => g.type === "flatsell" || g.type === "flatSell");
//       if (sales.length > 0) {
//         doc.setTextColor(59, 130, 246); // Blue
//         doc.setFontSize(12);
//         doc.text("3. Flat Sale Income", 15, finalY);
//         autoTable(doc, {
//           startY: finalY + 2,
//           head: [['Resident / Flat', 'Category', 'Amount']],
//           body: sales.map(s => [`${s.wing}-${s.flatNo} (${s.ownerName})`, 'Flat Sale', `+ Rs. ${s.amount}`]),
//           headStyles: { fillColor: [59, 130, 246] },
//           margin: { left: 15, right: 15 }
//         });
//         finalY = doc.lastAutoTable.finalY + 12;
//       }

//       // --- SECTION 4: EXPENSES ---
//       if (data.expenses?.length > 0) {
//         doc.setTextColor(220, 38, 38); // Red
//         doc.setFontSize(12);
//         doc.text("4. Expenditure Details", 15, finalY);
//         autoTable(doc, {
//           startY: finalY + 2,
//           head: [['Task Description', 'Paid To', 'Amount']],
//           body: data.expenses.map(e => [e.taskName, e.paidTo, `- Rs. ${e.amount}`]),
//           headStyles: { fillColor: [220, 38, 38] },
//           margin: { left: 15, right: 15 }
//         });
//       }

//       doc.save(`${societyName}_Audit_Report.pdf`);
//     } catch (err) {
//       console.error(err);
//       alert("Error generating report. Check console.");
//     }
//   };

//   const thClass = "px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400";
//   const tdClass = "px-6 py-4 text-sm font-medium text-slate-600";

//   return (
//     <div className="max-w-7xl mx-auto text-left relative">
//       {/* Header */}
//       <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
//         <div>
//           <h2 className="text-3xl font-black text-slate-900 tracking-tight">Overall Balance</h2>
//           <p className="text-slate-500 text-sm mt-1">Real-time oversight of society funds and cash flow.</p>
//         </div>

//         <div className="flex items-center gap-3">
//           <select
//             className="px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 shadow-sm focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
//             value={selectedSociety}
//             onChange={(e) => setSelectedSociety(e.target.value)}
//           >
//             <option value="">Choose Society...</option>
//             {societies.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
//           </select>

//           <select
//             className="px-4 py-3 border rounded-xl"
//             value={selectedWing}
//             onChange={(e) => setSelectedWing(e.target.value)}
//           >
//             <option value="">All Wings</option>
//             {[...new Set(data?.maintenanceDetails?.map(m => m.wing))].map(w => (
//               <option key={w} value={w}>Wing {w}</option>
//             ))}
//           </select>

//           <button
//             onClick={handleExportPDF}
//             disabled={!data}
//             className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-indigo-600 transition-all shadow-md active:scale-95 disabled:opacity-50"
//           >
//             📄 Export PDF
//           </button>
//         </div>
//       </header>

//       {data && (
//         <>
//           {/* Summary Stats Grid */}
//           <AnimatePresence>
//             {activeTab === "all" && (
//               <motion.div
//                 initial={{ opacity: 0, height: 0 }}
//                 animate={{ opacity: 1, height: "auto" }}
//                 exit={{ opacity: 0, height: 0 }}
//                 className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 overflow-hidden"
//               >
//                 {[
//                   { label: "Opening Balance", value: data.openingBalance, color: "text-indigo-600", icon: "🏛️" },
//                   { label: "Total Revenue", value: data.totalIncome, color: "text-emerald-600", icon: "📈" },
//                   { label: "Total Outflow", value: data.totalExpense, color: "text-red-500", icon: "📉" },
//                   { label: "Current Cash", value: data.currentBalance, color: "text-slate-900", icon: "💰" },
//                 ].map((item, i) => (
//                   <div key={i} className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm relative overflow-hidden">
//                     <span className="absolute top-4 right-4 text-xl opacity-20">{item.icon}</span>
//                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{item.label}</p>
//                     <h3 className={`text-2xl font-black ${item.color}`}>₹{item.value?.toLocaleString()}</h3>
//                   </div>
//                 ))}
//               </motion.div>
//             )}
//           </AnimatePresence>

//           {/* Tabs Navigation */}
//           <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit mb-6 gap-1">
//             {tabs.map((tab) => (
//               <button
//                 key={tab.id}
//                 onClick={() => setActiveTab(tab.id)}
//                 className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
//                   }`}
//               >
//                 {tab.label}
//               </button>
//             ))}
//           </div>

//           {/* Detailed Ledger Table */}
//           <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
//             <div className="overflow-x-auto">
//               <table className="w-full text-left">
//                 <thead>
//                   <tr className="bg-slate-50 border-b border-slate-100">
//                     <th className={thClass}>Entry Type</th>
//                     <th className={thClass}>Entity / Description</th>
//                     <th className={`${thClass} text-right`}>Value</th>
//                   </tr>
//                 </thead>

//                 <tbody className="divide-y divide-slate-50">
//                   {activeTab === "all" && (
//                     <tr className="bg-indigo-50/30">
//                       <td className={tdClass}><span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-black uppercase">Initial</span></td>
//                       <td className="px-6 py-4 font-bold text-slate-900">Opening Balance</td>
//                       <td className="px-6 py-4 text-indigo-600 font-black text-right">₹{data.openingBalance?.toLocaleString()}</td>
//                     </tr>
//                   )}

//                   {data.gifts
//                     .filter(g => activeTab === "all" || activeTab === (g.type === "donation" ? "donation" : "flatsell"))
//                     .map((g) => (
//                       <tr key={g._id} className="hover:bg-slate-50/80 transition-colors">
//                         <td className={tdClass}>
//                           <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${g.type === "donation" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
//                             }`}>{g.type === "donation" ? "Donation" : "Flat Sale"}</span>
//                         </td>
//                         <td className={tdClass}>
//                           <span className="font-bold text-slate-800">{g.type === "donation" ? g.donorName : `${g.wing}-${g.flatNo} (${g.ownerName})`}</span>
//                         </td>
//                         <td className="px-6 py-4 text-emerald-600 font-black text-right">+₹{g.amount?.toLocaleString()}</td>
//                       </tr>
//                     ))}

//                   {/* {(activeTab === "all" || activeTab === "maintenance") && data.maintenanceCollections?.map((m, idx) => (
//                     <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
//                       <td className={tdClass}><span className="px-2.5 py-1 bg-teal-100 text-teal-700 rounded-lg text-[10px] font-black uppercase">Maintenance</span></td>
//                       <td className={tdClass}>Monthly Collection - {m.month}</td>
//                       <td className="px-6 py-4 text-emerald-600 font-black text-right">+₹{m.amount?.toLocaleString()}</td>
//                     </tr>
//                   ))} */}

//                   {/* 🔥 NEW STRUCTURED MAINTENANCE VIEW */}
//                   {activeTab === "maintenance" && (
//                     <div className="overflow-x-auto">

//                       <table className="w-full text-left">
//                         <thead>
//                           <tr className="bg-slate-100 border-b">
//                             <th className={thClass}>Wing</th>
//                             <th className={thClass}>Flat</th>
//                             <th className={thClass}>Owner</th>
//                             <th className={thClass}>Month</th>
//                             <th className={thClass}>Amount</th>
//                             <th className={thClass}>Status</th>
//                           </tr>
//                         </thead>

//                         <tbody className="divide-y">

//                           {data.maintenanceDetails
//                             ?.filter(m => !selectedWing || m.wing === selectedWing)
//                             .sort((a, b) => b.month.localeCompare(a.month))
//                             .map((m, i) => (
//                               <tr key={i} className="hover:bg-slate-50">

//                                 <td className={tdClass}>Wing {m.wing}</td>

//                                 <td className="px-6 py-4 font-black text-slate-900">
//                                   {m.wing}-{m.flatNo}
//                                 </td>

//                                 <td className={tdClass}>{m.ownerName}</td>

//                                 <td className={tdClass}>{m.month}</td>

//                                 <td className="px-6 py-4 font-bold text-emerald-600">
//                                   ₹{m.amount}
//                                 </td>

//                                 <td className="px-6 py-4">
//                                   <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${m.status === "approved"
//                                       ? "bg-emerald-100 text-emerald-700"
//                                       : "bg-red-100 text-red-600"
//                                     }`}>
//                                     {m.status === "approved" ? "Paid" : "Pending"}
//                                   </span>
//                                 </td>

//                               </tr>
//                             ))}

//                         </tbody>
//                       </table>

//                     </div>
//                   )}

//                   {data.expenses
//                     .filter(() => activeTab === "all" || activeTab === "expense")
//                     .map((e) => (
//                       <tr key={e._id} className="hover:bg-slate-50/80 transition-colors">
//                         <td className={tdClass}><span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-lg text-[10px] font-black uppercase">Expense</span></td>
//                         <td className={tdClass}>
//                           <span className="font-bold text-slate-800">{e.taskName}</span>
//                           <span className="ml-2 text-[10px] text-slate-400 uppercase italic">to {e.paidTo}</span>
//                         </td>
//                         <td className="px-6 py-4 text-red-500 font-black text-right">-₹{e.amount?.toLocaleString()}</td>
//                       </tr>
//                     ))}
//                 </tbody>
//               </table>
//             </div>

//             {activeTab === "all" && (
//               <div className="bg-slate-900 px-8 py-5 flex justify-between items-center text-white">
//                 <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Net Treasury Standing</span>
//                 <span className="text-xl font-black">₹{data.currentBalance?.toLocaleString()}</span>
//               </div>
//             )}
//           </div>
//         </>
//       )}
//     </div>
//   );
// }
