import Link from 'next/link';
import { Mountain } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-highland-gradient flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-highland-purple/20 border border-highland-purple/30 flex items-center justify-center mx-auto mb-6">
          <Mountain className="w-8 h-8 text-highland-purple" />
        </div>
        <h1 className="font-display text-4xl font-bold text-slate-200 mb-3">Lost on the Trail?</h1>
        <p className="text-slate-400 text-lg mb-8">This page doesn&apos;t exist. Head back to base camp.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-highland-purple hover:bg-highland-purple-dark text-white px-6 py-3 rounded-xl font-semibold transition-colors"
        >
          Back to the Trail →
        </Link>
      </div>
    </div>
  );
}
