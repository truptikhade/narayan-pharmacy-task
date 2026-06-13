"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getPrescription } from "@/lib/api";

export default function PrescriptionDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getPrescription(id)
      .then(setPrescription)
      .catch(() => setError("Could not load prescription details."))
      .finally(() => setLoading(false));
  }, [id]);

  // Color mappings for badges
  const severityBadgeColors = {
    None: "bg-green-100 text-green-800 border-green-200",
    Mild: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Moderate: "bg-orange-100 text-orange-800 border-orange-200",
    Severe: "bg-red-100 text-red-800 border-red-200",
  };

  // Content block accent panel highlights
  const severityPanelColors = {
    None: "bg-gray-50 border-gray-200",
    Mild: "bg-yellow-50/40 border-yellow-100",
    Moderate: "bg-orange-50/40 border-orange-100",
    Severe: "bg-red-50/40 border-red-100",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-medium animate-pulse">Loading prescription profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-medium">
          {error}
        </div>
      </div>
    );
  }

  if (!prescription) return null;

  const { interaction_result, severity } = prescription;

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        
        {/* Navigation Action Header */}
        <div className="mb-6">
          <Link 
            href="/prescriptions" 
            className="group inline-flex items-center text-sm font-medium text-cyan-600 hover:text-cyan-700 transition-colors"
          >
            <span className="transform group-hover:-translate-x-1 transition-transform mr-1.5">←</span>
            Back to prescription log
          </Link>
        </div>

        {/* Profile Summary Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 block mb-1">
                Patient Profile
              </span>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                {prescription.patient_name}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Prescribed by <span className="font-medium text-gray-700">{prescription.doctor_name}</span> on {prescription.date}
              </p>
            </div>
            
            <div className="flex sm:flex-col items-start sm:items-end justify-between border-t sm:border-0 pt-4 sm:pt-0">
              <span className="text-xs text-gray-400 block sm:mb-1">Safety Status</span>
              <span className={`text-xs uppercase tracking-wider px-3 py-1 rounded-full font-bold border ${severityBadgeColors[severity] || "bg-gray-100"}`}>
                {severity} Interaction
              </span>
            </div>
          </div>
        </div>

        {/* Dashboard Content Split Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          
          {/* Column One: Medications List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:col-span-2 flex flex-col">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
              Prescribed Medications
            </h2>
            <div className="divide-y divide-gray-100 flex-1">
              {prescription.drugs.map((d) => (
                <div 
                  key={d.id} 
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between hover:bg-gray-50/50 px-2 -mx-2 rounded-lg transition-colors"
                >
                  <span className="font-semibold text-gray-800 text-sm">{d.name}</span>
                  <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded-md border border-gray-200/60">
                    {d.dosage}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Column Two: Dynamic Interaction Analytics Panel */}
          <div className={`rounded-xl shadow-sm border p-6 md:col-span-3 transition-all ${severityPanelColors[severity] || "bg-white border-gray-200"}`}>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">
              Automated Safety &amp; Cross-Interaction Report
            </h2>

            {interaction_result ? (
              <div className="space-y-4">
                
                {/* Interaction Bullet Lists */}
                {interaction_result.interactions?.length > 0 ? (
                  <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Detected Contraindications
                    </h3>
                    <ul className="list-none space-y-2.5">
                      {interaction_result.interactions.map((item, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${severity === "Severe" ? "bg-red-500" : "bg-amber-500"}`} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-green-100 p-4 text-center">
                    <p className="text-sm text-green-800 font-medium">
                      No active pharmaceutical interactions or conflicting components identified.
                    </p>
                  </div>
                )}

                {/* Clinical Recommendation Area */}
                {interaction_result.recommendation && (
                  <div className="bg-white/80 backdrop-blur-xs rounded-lg border border-gray-200/80 p-4 shadow-xs">
                    <h3 className="text-xs font-bold text-cyan-900 uppercase tracking-wider mb-1">
                      Clinical Directives &amp; Recommendations
                    </h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {interaction_result.recommendation}
                    </p>
                  </div>
                )}
                
              </div>
            ) : (
              <div className="bg-white/50 border border-dashed border-gray-300 rounded-lg p-8 text-center">
                <p className="text-sm text-gray-500">
                  No structural cross-interaction analysis files are attached to this record instance.
                </p>
              </div>
            )}
          </div>

        </div>
        
      </div>
    </main>
  );
}