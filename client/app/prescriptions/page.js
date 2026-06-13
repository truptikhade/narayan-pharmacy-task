"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Optimized navigation
import { getPrescriptions } from "@/lib/api";

export default function PrescriptionsList() {
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Interactive States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("All");

  useEffect(() => {
    getPrescriptions()
      .then(setPrescriptions)
      .catch(() => setError("Could not load prescriptions."))
      .finally(() => setLoading(false));
  }, []);

  // Filter Logic
  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter((p) => {
      const matchesSearch = p.patient_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterSeverity === "All" || p.severity === filterSeverity;
      return matchesSearch && matchesFilter;
    });
  }, [prescriptions, searchTerm, filterSeverity]);

  const severityColors = {
    None: "bg-green-100 text-green-800",
    Mild: "bg-yellow-100 text-yellow-800",
    Moderate: "bg-orange-100 text-orange-800",
    Severe: "bg-red-100 text-red-800",
  };

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col items-center mb-8 p-6 bg-cyan-700 rounded-lg shadow-lg text-white">
        <h1 className="text-4xl font-bold tracking-tight">PRESCRIPTIONS</h1>
      </div>

      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div className="flex gap-4 flex-1">
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search patients..."
            className="border p-2 rounded w-full max-w-md text-black"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          {/* Severity Filter */}
          <select 
            className="border p-2 rounded text-black"
            onChange={(e) => setFilterSeverity(e.target.value)}
          >
            <option value="All">All Severities</option>
            <option value="None">None</option>
            <option value="Mild">Mild</option>
            <option value="Moderate">Moderate</option>
            <option value="Severe">Severe</option>
          </select>
        </div>

        <Link href="/prescriptions/new" className="px-4 py-2 rounded font-bold bg-amber-500 text-cyan-900 hover:bg-amber-400 transition-colors">
          + New Prescription
        </Link>
      </div>

      {loading && <div className="animate-pulse text-center p-10">Loading prescriptions...</div>}
      {error && <p className="text-red-600 bg-red-50 p-4 rounded">{error}</p>}

      {!loading && filteredPrescriptions.length === 0 && (
        <p className="text-gray-500 text-center py-10">No prescriptions found matching your criteria.</p>
      )}

      {filteredPrescriptions.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-cyan-200 shadow-sm">
          <table className="w-full border-collapse bg-white">
            <thead>
              <tr className="text-left bg-cyan-100 text-cyan-900 uppercase text-xs font-bold">
                <th className="p-4 text-center">Patient Name</th>
                <th className="p-4 text-center">Date Issued</th>
                <th className="p-4 text-center">Drug Count</th>
                <th className="p-4 text-center">Severity Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrescriptions.map((p) => (
                <tr
                  key={p.id}
                  className="border-b last:border-0 hover:bg-cyan-50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/prescriptions/${p.id}`)}
                >
                  <td className="p-4 text-center font-medium text-gray-800">{p.patient_name}</td>
                  <td className="p-4 text-center text-gray-600">{p.date}</td>
                  <td className="p-4 text-center text-gray-600">{p.drug_count}</td>
                  <td className="p-4 text-center">
                    <span className={`text-xs px-3 py-1 rounded-full font-bold shadow-sm ${severityColors[p.severity] || "bg-gray-100"}`}>
                      {p.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}