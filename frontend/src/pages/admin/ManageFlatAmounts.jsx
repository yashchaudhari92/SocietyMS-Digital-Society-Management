import { useEffect, useState } from "react";
import API from "../../services/api";

export default function ManageFlatAmounts() {
  const [flats, setFlats] = useState([]);
  const [selectedFlat, setSelectedFlat] = useState(null);
  const [form, setForm] = useState({
    flatType: "",
    occupantType: "",
    amount: "",
  });

  const fetchFlats = async () => {
    const res = await API.get("/flats");
    setFlats(res.data);
  };

  useEffect(() => {
    fetchFlats();
  }, []);

  const openModal = (flat) => {
    setSelectedFlat(flat);
    setForm({
      flatType: flat.flatType,
      occupantType: flat.occupantType,
      amount: flat.maintenanceAmount,
    });
  };

  const handleSave = async () => {
    try {
      await API.put(`/flats/update-amount/${selectedFlat._id}`, {
        maintenanceAmount: form.amount,
      });

      alert("Updated successfully");
      setSelectedFlat(null);
      fetchFlats();
    } catch (err) {
      alert("Update failed");
    }
  };

  return (
    <div className="max-w-6xl text-left">
      <h2 className="text-2xl font-black mb-6">Manage Flat Amounts</h2>

      {/* TABLE */}
      <div className="bg-white border rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4">Flat</th>
              <th className="px-6 py-4">Owner</th>
              <th className="px-6 py-4">Current</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>

          <tbody>
            {flats.map((f) => (
              <tr key={f._id} className="border-t">
                <td className="px-6 py-4">
                  {f.wing}-{f.flatNo}
                </td>

                <td className="px-6 py-4">
                  {f.ownerName}
                </td>

                <td className="px-6 py-4 font-bold">
                  ₹{f.maintenanceAmount}
                </td>

                <td className="px-6 py-4">
                  <button
                    onClick={() => openModal(f)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {selectedFlat && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-96 shadow-xl">
            <h3 className="text-lg font-bold mb-4">
              Update Flat Amount
            </h3>

            {/* Flat Type */}
            <label className="text-sm font-bold">Flat Type</label>
            <select
              className="w-full border p-2 rounded mb-3"
              value={form.flatType}
              onChange={(e) =>
                setForm({ ...form, flatType: e.target.value })
              }
            >
              <option>1BHK</option>
              <option>2BHK</option>
              <option>3BHK</option>
            </select>

            {/* Occupant */}
            <label className="text-sm font-bold">
              Occupant Type
            </label>
            <select
              className="w-full border p-2 rounded mb-3"
              value={form.occupantType}
              onChange={(e) =>
                setForm({ ...form, occupantType: e.target.value })
              }
            >
              <option value="owner">Owner</option>
              <option value="tenant">Tenant</option>
            </select>

            {/* Amount */}
            <label className="text-sm font-bold">
              New Amount
            </label>
            <input
              type="number"
              className="w-full border p-2 rounded mb-4"
              value={form.amount}
              onChange={(e) =>
                setForm({ ...form, amount: e.target.value })
              }
            />

            {/* Buttons */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedFlat(null)}
                className="px-4 py-2 bg-gray-200 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}