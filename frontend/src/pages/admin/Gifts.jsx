import { useState, useEffect } from "react";
import API from "../../services/api";

export default function Gifts() {
    const [type, setType] = useState("donation");
    const [societies, setSocieties] = useState([]);
    const [selectedSociety, setSelectedSociety] = useState("");
    const [gifts, setGifts] = useState([]);

    const [flats, setFlats] = useState([]);
    const [flatSearch, setFlatSearch] = useState("");

    const [form, setForm] = useState({
        donorName: "",
        wing: "",
        flatNo: "",
        ownerName: "",
        amount: "",
    });

    const fetchSocieties = async () => {
        const res = await API.get("/societies");
        setSocieties(res.data);
    };

    const fetchGifts = async () => {
        if (!selectedSociety) return;
        const res = await API.get(`/gifts?societyId=${selectedSociety}`);
        setGifts(res.data);
    };

    const fetchFlats = async (societyId) => {
        if (!societyId) return;
        const res = await API.get(`/flats?societyId=${societyId}`);
        setFlats(res.data);
    };

    useEffect(() => {
        fetchSocieties();
    }, []);

    useEffect(() => {
        fetchGifts();
        fetchFlats(selectedSociety);
    }, [selectedSociety]);

    const handleSubmit = async () => {
        if (!selectedSociety || !form.amount) return;

        await API.post("/gifts/add", {
            ...form,
            type,
            societyId: selectedSociety,
        });

        setForm({
            donorName: "",
            wing: "",
            flatNo: "",
            ownerName: "",
            amount: "",
        });

        setFlatSearch("");
        fetchGifts();
    };

    const handleDelete = async (id) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this entry?");
        if (!confirmDelete) return;

        try {
            await API.delete(`/gifts/${id}`);
            fetchGifts();
        } catch (err) {
            alert("Failed to delete");
        }
    };

    const filteredFlats = flats.filter((f) => {
        const text = flatSearch.toLowerCase();
        const owner = f.ownerName?.toLowerCase() || "";
        const flat = `${f.wing}-${f.flatNo}`.toLowerCase();
        return owner.includes(text) || flat.includes(text);
    });

    const inputClass =
        "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-indigo-500";

    return (
        <div className="max-w-6xl text-left">
            <h2 className="text-3xl font-black text-slate-900 mb-6">
                Gifts Section
            </h2>

            {/* Society */}
            <select
                className="mb-6 px-4 py-3 border rounded-xl bg-white font-bold"
                value={selectedSociety}
                onChange={(e) => setSelectedSociety(e.target.value)}
            >
                <option value="">Select Society</option>
                {societies.map((s) => (
                    <option key={s._id} value={s._id}>
                        {s.name}
                    </option>
                ))}
            </select>

            {/* Toggle */}
            <div className="flex gap-3 mb-6">
                {["donation", "flatSell"].map((t) => (
                    <button
                        key={t}
                        onClick={() => setType(t)}
                        className={`px-5 py-2 rounded-xl font-bold text-sm ${type === t
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-600"
                            }`}
                    >
                        {t === "donation" ? "Donation" : "Flat Sell"}
                    </button>
                ))}
            </div>

            {/* ================= FORM ================= */}
            <div className="bg-white border p-6 rounded-2xl shadow-sm mb-8">

                {/* ===== DONATION ===== */}
                {type === "donation" && (
                    <div className="space-y-5">
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase mb-1">
                                External Donation
                            </p>
                            <p className="text-xs text-slate-400">
                                e.g. MLA, Corporator, Event Contribution
                            </p>
                        </div>

                        <input
                            placeholder="👤 Donor / Source Name"
                            className={inputClass}
                            value={form.donorName}
                            onChange={(e) =>
                                setForm({ ...form, donorName: e.target.value })
                            }
                        />

                        <input
                            type="number"
                            placeholder="Amount (₹)"
                            className={inputClass}
                            value={form.amount}
                            onChange={(e) =>
                                setForm({ ...form, amount: e.target.value })
                            }
                        />
                    </div>
                )}

                {/* ===== FLAT SELL ===== */}
                {type === "flatSell" && (
                    <div className="space-y-5">
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase mb-1">
                                Flat Sell Contribution
                            </p>
                            <p className="text-xs text-slate-400">
                                Select flat involved in transaction
                            </p>
                        </div>

                        {/* Search */}
                        <input
                            placeholder="🔍 Search flat or owner..."
                            value={flatSearch}
                            onChange={(e) => setFlatSearch(e.target.value)}
                            className={inputClass}
                        />

                        {/* Selected */}
                        {form.flatNo && (
                            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-indigo-700">
                                        {form.wing}-{form.flatNo}
                                    </p>
                                    <p className="text-xs text-indigo-400">
                                        {form.ownerName}
                                    </p>
                                </div>

                                <button
                                    onClick={() =>
                                        setForm({
                                            ...form,
                                            wing: "",
                                            flatNo: "",
                                            ownerName: "",
                                        })
                                    }
                                    className="text-xs text-red-500 font-bold"
                                >
                                    Clear
                                </button>
                            </div>
                        )}

                        {/* List */}
                        {!form.flatNo && (
                            <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-xl bg-white">
                                {filteredFlats.map((f) => (
                                    <div
                                        key={f._id}
                                        onClick={() =>
                                            setForm({
                                                ...form,
                                                wing: f.wing,
                                                flatNo: f.flatNo,
                                                ownerName: f.ownerName,
                                            })
                                        }
                                        className="px-4 py-3 cursor-pointer hover:bg-indigo-50 transition-all"
                                    >
                                        <p className="font-bold text-slate-800">
                                            {f.wing}-{f.flatNo}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {f.ownerName}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Amount */}
                        <input
                            type="number"
                            placeholder="Amount (₹)"
                            className={inputClass}
                            value={form.amount}
                            onChange={(e) =>
                                setForm({ ...form, amount: e.target.value })
                            }
                        />
                    </div>
                )}

                <button
                    onClick={handleSubmit}
                    className="mt-6 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700"
                >
                    Add Entry
                </button>
            </div>

            {/* ================= TABLE ================= */}
            <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">

                {type === "donation" ? (
                    <table className="w-full text-left">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-xs font-black text-slate-400">Donor</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-400 text-right">Amount</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-400 text-center">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {gifts
                                .filter((g) => g.type === "donation")
                                .map((g) => (
                                    <tr key={g._id} className="border-t">
                                        <td className="px-6 py-4 font-bold">
                                            {g.donorName}
                                        </td>

                                        <td className="px-6 py-4 text-right font-bold text-emerald-600">
                                            ₹{g.amount}
                                        </td>

                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleDelete(g._id)}
                                                className="text-red-500 hover:text-red-700 font-bold text-sm"
                                            >
                                                🗑 Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-xs font-black text-slate-400">
                                    Wing
                                </th>
                                <th className="px-6 py-4 text-xs font-black text-slate-400">
                                    Flat No
                                </th>
                                <th className="px-6 py-4 text-xs font-black text-slate-400">
                                    Owner
                                </th>
                                <th className="px-6 py-4 text-xs font-black text-slate-400 text-right">
                                    Amount
                                </th>
                                <th className="px-6 py-4 text-xs font-black text-slate-400 text-center">
                                    Amount
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {gifts
                                .filter((g) => g.type === "flatSell")
                                .map((g) => (
                                    <tr key={g._id} className="border-t">
                                        <td className="px-6 py-4 font-bold">
                                            {g.wing}
                                        </td>

                                        <td className="px-6 py-4">
                                            {g.flatNo}
                                        </td>

                                        <td className="px-6 py-4">
                                            {g.ownerName}
                                        </td>

                                        <td className="px-6 py-4 text-right font-bold text-emerald-600">
                                            ₹{g.amount}
                                        </td>

                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleDelete(g._id)}
                                                className="text-red-500 hover:text-red-700 font-bold text-sm"
                                            >
                                                🗑 Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}