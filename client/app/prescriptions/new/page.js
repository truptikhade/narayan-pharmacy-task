"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPrescription } from "@/lib/api";

export default function NewPrescription() {
  const router = useRouter();

  const [patientName, setPatientName] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [date, setDate] = useState("");
  const [drugs, setDrugs] = useState([{ name: "", dosage: "" }]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // Helper logic for instant dosage checking
  const dosagePattern = /^\d+(\.\d+)?\s*(mg|ml|g|mcg|iu|units?)$/i;
  const isDosageValid = (dosage) => !dosage || dosagePattern.test(dosage.trim());

  function addDrugRow() {
    setDrugs([...drugs, { name: "", dosage: "" }]);
  }

  function removeDrugRow(index) {
    setDrugs(drugs.filter((_, i) => i !== index));
  }

  function updateDrug(index, field, value) {
    const updated = [...drugs];
    updated[index][field] = value;
    setDrugs(updated);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);

    const validDrugs = drugs.filter((d) => d.name.trim() && d.dosage.trim());

    if (validDrugs.length === 0) {
      setError("Please add at least one drug with name and dosage.");
      return;
    }

    const invalidDosage = validDrugs.find((d) => !dosagePattern.test(d.dosage.trim()));
    if (invalidDosage) {
      setError(`Invalid dosage "${invalidDosage.dosage}" for ${invalidDosage.name}. Use a format like "500mg" or "10ml".`);
      return;
    }

    setLoading(true);
    try {
      const data = await createPrescription({
        patient_name: patientName,
        doctor_name: doctorName,
        date,
        drugs: validDrugs,
      });

      if (data.ai_error) {
        setError(`Prescription saved, but interaction check failed: ${data.ai_error}`);
        setResult(data.prescription);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError("Something went wrong while saving the prescription. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      {/* Contained form card wrapper */}
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md border border-gray-100 p-6 sm:p-8">
        
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">New Prescription</h1>
          <button 
            type="button" 
            onClick={() => router.push("/prescriptions")}
            className="text-sm text-gray-500 hover:text-cyan-600 transition-colors"
          >
            ← Back to List
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Patient Name</label>
            <input
              type="text"
              required
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-black transition-all"
              placeholder="Enter patient name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Doctor Name</label>
            <input
              type="text"
              required
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-black transition-all"
              placeholder="Enter Doctor name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Date Issued</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-black transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Medications</label>
            <div className="space-y-3">
              {drugs.map((drug, i) => {
                const validDosage = isDosageValid(drug.dosage);
                return (
                  <div key={i} className="flex gap-2 items-center animate-fadeIn">
                    <input
                      type="text"
                      placeholder="Drug name"
                      value={drug.name}
                      onChange={(e) => updateDrug(i, "name", e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-black"
                    />
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Dosage (e.g. 500mg)"
                        value={drug.dosage}
                        onChange={(e) => updateDrug(i, "dosage", e.target.value)}
                        className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 text-black transition-all ${
                          drug.dosage
                            ? validDosage
                              ? "border-green-400 focus:ring-green-400"
                              : "border-red-400 focus:ring-red-400"
                            : "border-gray-300 focus:ring-cyan-500"
                        }`}
                      />
                      
                    </div>
                    {drugs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDrugRow(i)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove medication"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addDrugRow}
              className="mt-3 text-sm font-medium text-cyan-600 hover:text-cyan-700 hover:underline inline-flex items-center gap-1"
            >
              + Add another drug
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-600 text-white font-semibold rounded-lg py-3 hover:bg-cyan-700 disabled:opacity-65 transition-all flex justify-center items-center gap-2 shadow-sm"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Analyzing drug interactions...
              </>
            ) : (
              "Submit & Run Safety Check"
            )}
          </button>
        </form>

        {result && (
          <div className="mt-8 border border-gray-200 rounded-xl p-5 bg-gray-50 shadow-inner animate-slideUp">
            <h2 className="font-bold text-gray-800 mb-3 text-base flex items-center gap-2">
              Interaction Analysis Result
            </h2>
            <InteractionResult result={result.interaction_result} severity={result.severity} />
          </div>
        )}
      </div>
    </main>
  );
}

function InteractionResult({ result, severity }) {
  if (!result) {
    return <p className="text-sm text-gray-500">No interaction data available.</p>;
  }

  const severityColors = {
    None: "bg-green-100 text-green-800 border-green-200",
    Mild: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Moderate: "bg-orange-100 text-orange-800 border-orange-200",
    Severe: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <div className="space-y-3">
      <div>
        <span className={`inline-block text-xs uppercase tracking-wider px-2.5 py-1 rounded-full font-bold border ${severityColors[severity] || "bg-gray-100"}`}>
          Severity Level: {severity}
        </span>
      </div>

      {result.interactions?.length > 0 ? (
        <div className="bg-white p-3 rounded-lg border border-gray-100">
          <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
            {result.interactions.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-green-700 font-medium bg-green-50/50 p-2.5 rounded-lg border border-green-100">
         No multi-drug interactions detected.
        </p>
      )}

      {result.recommendation && (
        <div className="text-sm text-gray-700 bg-cyan-50/40 p-3 rounded-lg border border-cyan-100/60">
          <strong className="text-cyan-900 block mb-0.5">Clinical Recommendation:</strong> 
          {result.recommendation}
        </div>
      )}
    </div>
  );
}