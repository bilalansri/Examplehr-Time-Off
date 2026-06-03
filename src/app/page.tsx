import Link from 'next/link';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">ExampleHR</p>
        <h1 className="text-4xl font-semibold text-slate-900">Time-off assessment</h1>
        <p className="text-lg text-slate-600">
          Explore employee balances and manager approvals backed by a mock HCM layer.
        </p>
      </div>
      <div className="flex flex-wrap gap-4">
        <Link
          href="/employee"
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white"
        >
          Employee view
        </Link>
        <Link
          href="/manager"
          className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-900"
        >
          Manager view
        </Link>
      </div>
    </main>
  );
}
