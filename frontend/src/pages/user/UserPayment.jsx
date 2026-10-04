import { useEffect, useState } from "react";
import API from "../../services/api";

export default function UserPayments() {
    const [payments, setPayments] = useState([]);
    const [file, setFile] = useState(null);
    const [selectedId, setSelectedId] = useState("");
    const [month, setMonth] = useState("");

    const fetchPayments = async () => {
        const res = await API.get(`/payments/my?month=${month}`);
        setPayments(res.data);
    };

    useEffect(() => {
        fetchPayments();
    }, [month]);

    const handleUpload = async () => {
    if (!file || !selectedId) {
        return alert("Select payment & file");
    }

    const formData = new FormData();
    formData.append("paymentId", selectedId);
    formData.append("screenshot", file);

    const res = await API.post("/payments/upload", formData);

    // ✅ ADDED (without removing your existing alert)
    if (res?.data) {
        alert(
            `Status: ${res.data.status}\nReason: ${res.data.reason}`
        );

        console.log("Extracted Text:", res.data.extractedText);
    }

    alert("Uploaded"); // ❌ untouched

    setFile(null);
    setSelectedId("");
    fetchPayments();
};

    return (
        <div>

            <h2 className="text-xl font-bold mb-4">My Payments</h2>

            <input
                type="month"
                className="border p-2 mb-4"
                onChange={(e) => setMonth(e.target.value)}
            />

            {/* ✅ No payments */}
            {payments.length === 0 && (
                <p className="text-gray-500">No payments found</p>
            )}

            {/* Table */}
            {payments.length > 0 && (
                <table className="w-full border mb-4">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="p-2">Month</th>
                            <th className="p-2">Amount</th>
                            <th className="p-2">Status</th>
                            <th className="p-2">Select</th>
                            <th className="p-2">Preview</th>
                        </tr>
                    </thead>

                    <tbody>
                        {payments.map((p) => (
                            <tr key={p._id} className="text-center border-t">
                                <td>{p.month}</td>
                                <td>₹{p.amount}</td>

                                {/* ✅ Status Color */}
                                <td
                                    className={
                                        p.status === "approved"
                                            ? "text-green-600 font-semibold"
                                            : p.status === "rejected"
                                                ? "text-red-600 font-semibold"
                                                : "text-yellow-600 font-semibold"
                                    }
                                >
                                    {p.status}
                                </td>

                                {/* ✅ Disable selection if approved */}
                                <td>
                                    {p.status === "approved" ? (
                                        <span className="text-green-600 font-medium">Paid</span>
                                    ) : (
                                        <input
                                            type="radio"
                                            name="payment"
                                            value={p._id}
                                            onChange={() => setSelectedId(p._id)}
                                        />
                                    )}
                                </td>

                                {/* ✅ Screenshot Preview */}
                                <td>
                                    {p.screenshot && (
                                        <a
                                            href={`http://localhost:3000/${p.screenshot}`}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <img
                                                src={`http://localhost:3000/${p.screenshot}`}
                                                className="w-20 rounded cursor-pointer hover:scale-105"
                                            />
                                        </a>
                                        // <img
                                        //     src={`http://localhost:3000/${p.screenshot}`}
                                        //     alt="proof"
                                        //     className="w-24 h-16 object-cover mx-auto rounded"
                                        // />
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* ✅ Upload disabled if approved selected */}
            <div className="flex gap-3">
                <input
                    type="file"
                    disabled={
                        payments.find((p) => p._id === selectedId)?.status === "approved"
                    }
                    onChange={(e) => setFile(e.target.files[0])}
                />

                <button
                    onClick={handleUpload}
                    className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
                    disabled={
                        !selectedId ||
                        payments.find((p) => p._id === selectedId)?.status === "approved"
                    }
                >
                    Upload Screenshot
                </button>
            </div>

        </div>
    );
}

// import { useEffect, useState } from "react";
// import API from "../../services/api";

// export default function UserPayments() {
//   const [payments, setPayments] = useState([]);
//   const [file, setFile] = useState(null);
//   const [selectedId, setSelectedId] = useState("");

//   const fetchPayments = async () => {
//     const res = await API.get("/payments/my");
//     setPayments(res.data);
//   };

//   useEffect(() => {
//     fetchPayments();
//   }, []);

//   const handleUpload = async () => {
//     if (!file || !selectedId) {
//       return alert("Select payment & file");
//     }

//     const formData = new FormData();
//     formData.append("paymentId", selectedId);
//     formData.append("screenshot", file);

//     await API.post("/payments/upload", formData);

//     alert("Uploaded");
//     fetchPayments();
//   };

//   return (
//     <div>

//       <h2 className="text-xl font-bold mb-4">My Payments</h2>

//       {/* Table */}
//       <table className="w-full border mb-4">
//         <thead className="bg-gray-200">
//           <tr>
//             <th className="p-2">Month</th>
//             <th className="p-2">Amount</th>
//             <th className="p-2">Status</th>
//             <th className="p-2">Select</th>
//           </tr>
//         </thead>

//         <tbody>
//           {payments.map((p) => (
//             <tr key={p._id} className="text-center border-t">
//               <td>{p.month}</td>
//               <td>₹{p.amount}</td>
//               <td>{p.status}</td>

//               <td>
//                 <input
//                   type="radio"
//                   name="payment"
//                   value={p._id}
//                   onChange={() => setSelectedId(p._id)}
//                 />
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>

//       {/* Upload */}
//       <div className="flex gap-3">
//         <input
//           type="file"
//           onChange={(e) => setFile(e.target.files[0])}
//         />

//         <button
//           onClick={handleUpload}
//           className="bg-green-600 text-white px-4 py-2 rounded"
//         >
//           Upload Screenshot
//         </button>
//       </div>

//     </div>
//   );
// }