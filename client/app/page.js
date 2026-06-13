import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center gap-6 min-h-[60vh]">
      <h1 className="text-3xl font-bold">Pharmacy Assistant</h1>
      <p className="text-gray-400">Prescription entry & drug interaction checker</p>

      <div className="flex gap-4 mt-4">
        <Link
          href="/prescriptions/new"
          className="px-5 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700"
        >
          New Prescription
        </Link>
        <Link
          href="/prescriptions"
          className="px-5 py-2 border border-gray-700 rounded hover:bg-gray-400"
        >
          View Prescriptions
        </Link>
      </div>
    </main>
  );
}