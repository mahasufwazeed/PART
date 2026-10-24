import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { TASK_CATEGORIES, CHENNAI_LOCALITIES, createTaskSchema, taskService } from '@part/shared';
import {
  Package,
  Calendar,
  Clock,
  IndianRupee,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Users,
  Shield,
} from 'lucide-react';

export const PostTaskScreen: React.FC = () => {
  const { currentProfile, setTab, openTaskDetails, language } = useAppStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(TASK_CATEGORIES[0].id);
  const [budgetInr, setBudgetInr] = useState(250);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [preferredDate, setPreferredDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [timeWindow, setTimeWindow] = useState('Morning 10:00 AM - 1:00 PM');
  const [locality, setLocality] = useState('Anna Nagar');
  const [approximateAddress, setApproximateAddress] = useState('Near Roundtana');
  const [exactAddress, setExactAddress] = useState('');
  const [requiredWorkers, setRequiredWorkers] = useState(1);
  const [skills, setSkills] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    const selectedLoc =
      CHENNAI_LOCALITIES.find((l) => l.name === locality) || CHENNAI_LOCALITIES[0];

    const inputData = {
      title,
      description,
      category_id: categoryId,
      budget_inr: Number(budgetInr),
      estimated_duration_minutes: Number(durationMinutes),
      preferred_date: preferredDate,
      preferred_time_window: timeWindow,
      required_workers_count: Number(requiredWorkers),
      required_skills: skills
        ? skills.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      special_instructions: specialInstructions || null,
      city: 'Chennai',
      locality: selectedLoc.name,
      address_approximate: approximateAddress,
      address_exact: exactAddress || null,
      latitude: selectedLoc.latitude,
      longitude: selectedLoc.longitude,
      postal_code: selectedLoc.postalCode,
    };

    const validation = createTaskSchema.safeParse(inputData);
    if (!validation.success) {
      const errs: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        errs[err.path.join('.')] = err.message;
      });
      setValidationErrors(errs);
      return;
    }

    setIsSubmitting(true);
    try {
      const { task, error } = await taskService.createTask(
        currentProfile.id,
        validation.data
      );

      if (error) {
        setValidationErrors({ form: error });
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        openTaskDetails(task.id);
      }, 1200);
    } catch (err: any) {
      setValidationErrors({ form: err.message || 'Failed to post task' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-28 px-4 pt-4 max-w-md mx-auto">
      <div className="mb-4">
        <h2 className="text-lg font-black text-slate-900">
          {language === 'ta' ? 'புதிய பணியைப் பதிவு செய்க' : 'Post a New Task'}
        </h2>
        <p className="text-xs text-slate-500">
          {language === 'ta'
            ? 'சென்னையில் உங்கள் பணிக்கான சரியான நபரை கண்டறியவும்.'
            : 'Find verified nearby help across Chennai within minutes.'}
        </p>
      </div>

      {isSuccess ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center animate-fade-in">
          <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-emerald-900">
            {language === 'ta' ? 'பணி வெற்றிகரமாக பதிவானது!' : 'Task Published Successfully!'}
          </h3>
          <p className="text-xs text-emerald-700 mt-1">
            {language === 'ta'
              ? 'அருகில் உள்ள பணியாளர்கள் இப்போது உங்கள் பணியை காண முடியும்.'
              : 'Eligible workers in your locality can now discover and apply for this task.'}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {validationErrors.form && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationErrors.form}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              {language === 'ta' ? 'பணி தலைப்பு *' : 'Task Title *'}
            </label>
            <input
              type="text"
              placeholder="e.g. Need someone to pick up medicine from pharmacy"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary focus:outline-none"
            />
            {validationErrors.title && (
              <p className="text-[11px] text-rose-500 mt-1">{validationErrors.title}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              {language === 'ta' ? 'பிரிவு *' : 'Category *'}
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-primary focus:outline-none"
            >
              {TASK_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {language === 'ta' ? c.name_ta : c.name_en}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              {language === 'ta' ? 'முழு விவரம் *' : 'Detailed Description *'}
            </label>
            <textarea
              rows={3}
              placeholder="Explain the work clearly: item weight, exact scope, any prerequisites..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary focus:outline-none"
            />
            {validationErrors.description && (
              <p className="text-[11px] text-rose-500 mt-1">{validationErrors.description}</p>
            )}
          </div>

          {/* Budget & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                {language === 'ta' ? 'பட்ஜெட் (₹) *' : 'Budget (₹ INR) *'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-slate-400 text-xs font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  min={50}
                  max={50000}
                  value={budgetInr}
                  onChange={(e) => setBudgetInr(Number(e.target.value))}
                  className="w-full text-xs pl-7 pr-3 py-3 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Min ₹50</span>
              {validationErrors.budget_inr && (
                <p className="text-[11px] text-rose-500">{validationErrors.budget_inr}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                {language === 'ta' ? 'கால அளவு (நிமிடம்) *' : 'Duration (mins) *'}
              </label>
              <div className="relative">
                <Clock className="w-3.5 h-3.5 absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="number"
                  min={10}
                  max={1440}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full text-xs pl-8 pr-3 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">e.g. 45 mins</span>
            </div>
          </div>

          {/* Locality & Public Landmark */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <MapPin className="w-4 h-4 text-secondary" />
              <span>{language === 'ta' ? 'இடம் & முகவரி' : 'Task Location (Chennai)'}</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Chennai Locality *
              </label>
              <select
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none"
              >
                {CHENNAI_LOCALITIES.map((l) => (
                  <option key={l.name} value={l.name}>
                    {l.name} ({l.zone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Approximate Landmark (Visible to Public) *
              </label>
              <input
                type="text"
                placeholder="e.g. Near Anna Nagar Roundtana / Phoenix Mall"
                value={approximateAddress}
                onChange={(e) => setApproximateAddress(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none"
              />
              {validationErrors.address_approximate && (
                <p className="text-[11px] text-rose-500">{validationErrors.address_approximate}</p>
              )}
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800 mb-1">
                <Shield className="w-3.5 h-3.5 text-accent" />
                <span>Exact Door Address (Private)</span>
              </div>
              <input
                type="text"
                placeholder="Disclosed ONLY to your assigned worker"
                value={exactAddress}
                onChange={(e) => setExactAddress(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Never shared publicly on search results.
              </span>
            </div>
          </div>

          {/* Date & Time Window */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                {language === 'ta' ? 'தேதி *' : 'Preferred Date *'}
              </label>
              <input
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                {language === 'ta' ? 'நேரம்' : 'Time Window'}
              </label>
              <input
                type="text"
                placeholder="e.g. Morning 10-12"
                value={timeWindow}
                onChange={(e) => setTimeWindow(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-primary to-secondary text-white font-black text-sm py-3.5 rounded-xl shadow-lg hover:shadow-xl active:scale-[0.99] transition disabled:opacity-50"
          >
            {isSubmitting
              ? 'Publishing Task...'
              : language === 'ta'
              ? 'பணியை வெளியிடவும் (₹' + budgetInr + ')'
              : `Publish Task for ₹${budgetInr}`}
          </button>
        </form>
      )}
    </div>
  );
};
