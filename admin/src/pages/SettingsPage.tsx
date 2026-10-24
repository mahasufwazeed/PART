import React, { useState } from 'react';
import { Settings, Save, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [feePercent, setFeePercent] = useState(10);
  const [minBudget, setMinBudget] = useState(50);
  const [maxBudget, setMaxBudget] = useState(50000);
  const [supportPhone, setSupportPhone] = useState('+91 44 2827 0000');
  const [supportEmail, setSupportEmail] = useState('support@part-app.in');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm max-w-2xl space-y-5">
      <div className="pb-4 border-b border-slate-100">
        <h2 className="text-base font-extrabold text-slate-900">
          PART Platform Settings
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure marketplace fee models, safety guardrails, and customer support channels.
        </p>
      </div>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-accent" />
          <span>Settings saved and synced across active client applications.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">
            Platform Service Fee (%) *
          </label>
          <input
            type="number"
            min={0}
            max={30}
            value={feePercent}
            onChange={(e) => setFeePercent(Number(e.target.value))}
            className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <span className="text-[11px] text-slate-400 mt-1 block">
            Deducted transparently from task value upon successful completion (currently 10%).
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Minimum Task Budget (₹ INR) *
            </label>
            <input
              type="number"
              value={minBudget}
              onChange={(e) => setMinBudget(Number(e.target.value))}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Maximum Single Task Budget (₹ INR) *
            </label>
            <input
              type="number"
              value={maxBudget}
              onChange={(e) => setMaxBudget(Number(e.target.value))}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">
            Chennai Support Hotline (24/7) *
          </label>
          <input
            type="text"
            value={supportPhone}
            onChange={(e) => setSupportPhone(e.target.value)}
            className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">
            Support Email *
          </label>
          <input
            type="email"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
            className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <button
          type="submit"
          className="bg-primary text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow hover:bg-primaryDark transition flex items-center gap-1.5"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </form>
    </div>
  );
};
