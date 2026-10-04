import { useState } from "react";
import UserPayments from "./UserPayment";

export default function UserDashboard() {
  const [tab, setTab] = useState("payments");

  return (
    <div className="p-6 max-w-6xl mx-auto">

      <h1 className="text-3xl font-bold mb-6">User Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setTab("payments")}
          className={`px-4 py-2 rounded ${
            tab === "payments"
              ? "bg-green-600 text-white"
              : "bg-gray-200"
          }`}
        >
          My Payments
        </button>
      </div>

      {/* Content */}
      <div className="bg-white p-6 rounded shadow">
        {tab === "payments" && <UserPayments />}
      </div>

    </div>
  );
}