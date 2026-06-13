// lib/api.js
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function createPrescription(data) {
  const res = await fetch(`${API_URL}/prescriptions/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to save prescription");
  }

  return res.json();
}

export async function getPrescriptions() {
  const res = await fetch(`${API_URL}/prescriptions/`);
  if (!res.ok) throw new Error("Failed to load prescriptions");
  return res.json();
}

export async function getPrescription(id) {
  const res = await fetch(`${API_URL}/prescriptions/${id}/`);
  if (!res.ok) throw new Error("Failed to load prescription");
  return res.json();
}