import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  TASK_CATEGORIES,
  CHENNAI_LOCALITIES,
  createTaskSchema,
  taskService,
  CategoryDef,
} from '@part/shared';
import {
  Package,
  ShoppingCart,
  Home,
  GraduationCap,
  Cpu,
  Calendar,
  Briefcase,
  Sparkles,
  MapPin,
  Clock,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { LocationSelectorModal } from '../components/LocationSelectorModal';

export const PostTaskScreen: React.FC = () => {
  const { currentProfile, setTab, openTaskDetails, language, userLocation } = useAppStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Form Fields
  const [categoryId, setCategoryId] = useState(TASK_CATEGORIES[0].id);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locality, setLocality] = useState('Anna Nagar');
  const [approximateAddress, setApproximateAddress] = useState('');
  const [exactAddress, setExactAddress] = useState('');
  const [taskLat, setTaskLat] = useState<number>(userLocation.latitude || 12.9815);
  const [taskLng, setTaskLng] = useState<number>(userLocation.longitude || 80.218);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const [preferredDate, setPreferredDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [timeWindow, setTimeWindow] = useState('Morning (10:00 AM - 1:00 PM)');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [budgetInr, setBudgetInr] = useState(250);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);

  const selectedCategory =
    TASK_CATEGORIES.find((c) => c.id === categoryId) || TASK_CATEGORIES[0];

  const getCategoryIcon = (iconName: string, accentColor: string) => {
    const props = { className: 'w-6 h-6', style: { color: accentColor } };
    switch (iconName) {
      case 'Package':
        return <Package {...props} />;
      case 'ShoppingCart':
        return <ShoppingCart {...props} />;
      case 'Home':
        return <Home {...props} />;
      case 'GraduationCap':
        return <GraduationCap {...props} />;
      case 'Cpu':
        return <Cpu {...props} />;
      case 'Calendar':
        return <Calendar {...props} />;
      case 'Briefcase':
        return <Briefcase {...props} />;
      default:
        return <Sparkles {...props} />;
    }
  };

  const handleNext = () => {
    setValidationErrors({});
    if (step === 2) {
      if (title.trim().length < 5) {
        setValidationErrors({ title: 'Title must be at least 5 characters.' });
        return;
      }
      if (description.trim().length < 10) {
        setValidationErrors({ description: 'Description must be at least 10 characters.' });
        return;
      }
    }
    if (step === 3) {
      if (!approximateAddress.trim()) {
        setValidationErrors({
          approximateAddress: 'Please provide a neighborhood landmark for workers.',
        });
        return;
      }
    }
    setStep((prev) => Math.min(5, prev + 1) as any);
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1) as any);
  };

  const handleSubmit = async () => {
    if (isSubmitting || !currentProfile) return;
    setIsSubmitting(true);
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
      required_workers_count: 1,
      required_skills: [],
      special_instructions: null,
      city: 'Chennai',
      locality: selectedLoc.name,
      address_approximate: approximateAddress,
      address_exact: exactAddress || null,
      latitude: taskLat || selectedLoc.latitude,
      longitude: taskLng || selectedLoc.longitude,
    };

    const parsed = createTaskSchema.safeParse(inputData);
    if (!parsed.success) {
      const errMap: Record<string, string> = {};
      parsed.error.errors.forEach((e) => {
        errMap[e.path.join('.')] = e.message;
      });
      setValidationErrors(errMap);
      setIsSubmitting(false);
      return;
    }

    const { task, error } = await taskService.createTask(parsed.data, currentProfile.id);
    setIsSubmitting(false);

    if (error) {
      setValidationErrors({ form: error });
    } else if (task) {
      setCreatedTaskId(task.id);
    }
  };

  if (createdTaskId) {
    return (
      <div className="pb-28 px-4 pt-12 max-w-md mx-auto text-center space-y-5 animate-fade-in select-none">
        <div className="w-20 h-20 bg-part-green-mint text-part-green rounded-full flex items-center justify-center mx-auto shadow-green">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>

        <div className="space-y-1">
          <h2 className="font-heading font-black text-2xl text-neutral-900">
            Task Successfully Published!
          </h2>
          <p className="text-xs text-neutral-500 max-w-xs mx-auto">
            Nearby verified workers in {locality} have been notified. You can review applicants in real time.
          </p>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-neutral-200/80 shadow-quick text-left space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-part-green bg-part-green-mint px-2.5 py-0.5 rounded-full">
              {selectedCategory.name_en}
            </span>
            <span className="font-heading font-black text-lg text-neutral-900">
              ₹{budgetInr}
            </span>
          </div>
          <h4 className="font-heading font-bold text-sm text-neutral-900">{title}</h4>
          <p className="text-xs text-neutral-600 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-part-green" />
            <span>{locality}, Chennai ({approximateAddress})</span>
          </p>
        </div>

        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={() => {
              openTaskDetails(createdTaskId);
              setTab('activity');
            }}
            className="w-full py-3.5 bg-part-green hover:bg-part-green-dark text-white font-heading font-black text-xs rounded-2xl shadow-green hover:scale-[1.01] active:scale-[0.99] transition cursor-pointer"
          >
            View Live Task Details
          </button>
          <button
            type="button"
            onClick={() => {
              setCreatedTaskId(null);
              setStep(1);
              setTitle('');
              setDescription('');
              setApproximateAddress('');
              setExactAddress('');
            }}
            className="w-full py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-heading font-bold text-xs rounded-2xl transition cursor-pointer"
          >
            Post Another Task
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-28 min-h-screen bg-[#F7F8FA] select-none">
      {/* Top Header & Progress Bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-neutral-200/90 shadow-xs px-4 pt-3.5 pb-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-part-green block">
                Step {step} of 5
              </span>
              <h2 className="font-heading font-black text-base text-neutral-900 leading-tight">
                {step === 1 && 'What do you need help with?'}
                {step === 2 && 'Describe your task'}
                {step === 3 && 'Where and when?'}
                {step === 4 && 'Set your reward budget'}
                {step === 5 && 'Review and Post'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setTab('home')}
            className="text-xs font-bold text-neutral-400 hover:text-neutral-700 cursor-pointer"
          >
            Cancel
          </button>
        </div>

        {/* 5-Step Segmented Progress Bar */}
        <div className="flex gap-1.5 h-1.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`flex-1 rounded-full transition-all duration-300 ${
                s <= step ? 'bg-part-green' : 'bg-neutral-200'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 max-w-md mx-auto space-y-4">
        {/* Global Error Banner */}
        {validationErrors.form && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{validationErrors.form}</span>
          </div>
        )}

        {/* STEP 1: What do you need help with? */}
        {step === 1 && (
          <div className="space-y-3 animate-fade-in">
            <p className="text-xs text-neutral-500 font-medium">
              Choose the service category that matches your neighborhood errand.
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {TASK_CATEGORIES.map((cat: CategoryDef) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    style={{
                      backgroundColor: isSelected ? '#146B3A' : cat.pastelBg,
                      borderColor: isSelected ? '#146B3A' : `${cat.accentColor}30`,
                    }}
                    className="p-3.5 rounded-3xl border text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-quick hover:shadow-card h-28"
                  >
                    <div
                      style={{
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : '#FFFFFF',
                      }}
                      className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs"
                    >
                      {getCategoryIcon(cat.icon, isSelected ? '#FFFFFF' : cat.accentColor)}
                    </div>
                    <span
                      style={{ color: isSelected ? '#FFFFFF' : '#171717' }}
                      className="font-heading font-bold text-xs leading-tight"
                    >
                      {language === 'ta' ? cat.name_ta : cat.name_en}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: Describe your task */}
        {step === 2 && (
          <div className="space-y-3.5 animate-fade-in">
            <div className="space-y-1">
              <label className="block text-xs font-heading font-bold text-neutral-800">
                Task Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Urgent Medicine Pickup from Apollo Pharmacy"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs sm:text-sm p-3.5 rounded-2xl bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-part-green shadow-xs"
              />
              {validationErrors.title && (
                <span className="text-[11px] text-rose-600 block">{validationErrors.title}</span>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-heading font-bold text-neutral-800">
                Task Description & Instructions *
              </label>
              <textarea
                rows={4}
                placeholder="Describe exactly what needs to be done, item details, weight, or specific notes for the helper..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs p-3.5 rounded-2xl bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-part-green shadow-xs leading-relaxed"
              />
              {validationErrors.description && (
                <span className="text-[11px] text-rose-600 block">{validationErrors.description}</span>
              )}
            </div>

            <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-part-green shrink-0" />
              <span>Do not include personal passwords or sensitive keys in descriptions.</span>
            </div>
          </div>
        )}

        {/* STEP 3: Where and when? */}
        {step === 3 && (
          <div className="space-y-3.5 animate-fade-in">
            {/* Quick GPS / Map Location Selector Button */}
            <button
              type="button"
              onClick={() => setShowLocationModal(true)}
              className="w-full p-3 bg-emerald-50 border border-part-green/30 rounded-2xl flex items-center justify-between hover:bg-emerald-100/70 transition cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-part-green text-white flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <span className="font-heading font-black text-xs text-part-green block">
                    Pick with GPS or Saved Address
                  </span>
                  <span className="text-[10px] text-neutral-500 block">
                    {locality}, Chennai • Map pin selection
                  </span>
                </div>
              </div>
              <span className="text-xs font-heading font-black text-part-green px-2 py-0.5 rounded-lg bg-white shadow-2xs">
                Select
              </span>
            </button>

            <div className="space-y-1">
              <label className="block text-xs font-heading font-bold text-neutral-800">
                Chennai Neighborhood *
              </label>
              <select
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                className="w-full text-xs p-3.5 rounded-2xl bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-part-green shadow-xs font-medium"
              >
                {CHENNAI_LOCALITIES.map((loc) => (
                  <option key={loc.name} value={loc.name}>
                    {loc.name}, Chennai
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-heading font-bold text-neutral-800">
                Public Landmark (Visible on Map) *
              </label>
              <input
                type="text"
                placeholder="e.g. Near Roundtana / Metro Station / Phoenix MarketCity"
                value={approximateAddress}
                onChange={(e) => setApproximateAddress(e.target.value)}
                className="w-full text-xs p-3.5 rounded-2xl bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-part-green shadow-xs"
              />
              {validationErrors.approximateAddress && (
                <span className="text-[11px] text-rose-600 block">
                  {validationErrors.approximateAddress}
                </span>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-heading font-bold text-neutral-800">
                Confidential Door / Flat Number (Optional, masked until worker assignment)
              </label>
              <input
                type="text"
                placeholder="e.g. Flat 3B, Sunshine Apartments, 4th Cross"
                value={exactAddress}
                onChange={(e) => setExactAddress(e.target.value)}
                className="w-full text-xs p-3.5 rounded-2xl bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-part-green shadow-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="block text-xs font-heading font-bold text-neutral-800">
                  Date
                </label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full text-xs p-3 rounded-2xl bg-white border border-neutral-300 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-heading font-bold text-neutral-800">
                  Est. Duration
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full text-xs p-3 rounded-2xl bg-white border border-neutral-300 focus:outline-none font-medium"
                >
                  <option value={15}>15 mins (Quick)</option>
                  <option value={30}>30 mins</option>
                  <option value={45}>45 mins</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Set your budget */}
        {step === 4 && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-xs text-neutral-500 font-medium">
              Fair pricing ensures quick acceptance by nearby verified helpers.
            </p>

            <div className="bg-white p-5 rounded-3xl border border-neutral-200/80 shadow-quick text-center space-y-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-neutral-400 block">
                Total Task Reward
              </span>

              <div className="flex items-center justify-center gap-1">
                <span className="text-2xl font-black text-neutral-400">₹</span>
                <input
                  type="number"
                  min={50}
                  max={25000}
                  value={budgetInr}
                  onChange={(e) => setBudgetInr(Number(e.target.value))}
                  className="w-32 text-3xl font-heading font-black text-neutral-900 text-center border-b-2 border-part-green focus:outline-none"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex justify-center gap-2 pt-1">
                {[150, 250, 350, 500].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setBudgetInr(preset)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition cursor-pointer ${
                      budgetInr === preset
                        ? 'bg-part-green text-white shadow-xs'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    ₹{preset}
                  </button>
                ))}
              </div>

              {/* Payout Breakdown */}
              <div className="border-t border-neutral-100 pt-3 text-xs space-y-1.5 text-neutral-600">
                <div className="flex justify-between">
                  <span>Helper Payout (90%)</span>
                  <span className="font-bold text-part-green">₹{(budgetInr * 0.9).toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-neutral-400 text-[11px]">
                  <span>Platform & Safety Fee (10%)</span>
                  <span>₹{(budgetInr * 0.1).toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Review and Post */}
        {step === 5 && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white p-5 rounded-3xl border border-neutral-200/80 shadow-quick space-y-3.5">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <span
                  style={{
                    backgroundColor: selectedCategory.pastelBg,
                    color: selectedCategory.accentColor,
                  }}
                  className="px-3 py-0.5 rounded-full text-xs font-heading font-black uppercase tracking-wider"
                >
                  {selectedCategory.name_en}
                </span>
                <span className="font-heading font-black text-xl text-part-green">
                  ₹{budgetInr}
                </span>
              </div>

              <div>
                <h3 className="font-heading font-black text-base text-neutral-900 leading-tight">
                  {title}
                </h3>
                <p className="text-xs text-neutral-600 mt-1 line-clamp-3 leading-relaxed">
                  {description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs border-t border-neutral-100 pt-3 text-neutral-600">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-part-green shrink-0" />
                  <span className="truncate">{locality} ({approximateAddress})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span>{durationMinutes} mins</span>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-xs text-emerald-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-part-green shrink-0" />
              <span>You only pay when you approve the completed task.</span>
            </div>
          </div>
        )}

        {/* Sticky Action Footer */}
        <div className="pt-3">
          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="w-full py-3.5 bg-part-green hover:bg-part-green-dark text-white font-heading font-black text-xs rounded-2xl shadow-green hover:scale-[1.01] active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-4 bg-brand-yellow hover:bg-brand-yellow-hover text-neutral-950 font-heading font-black text-sm rounded-2xl shadow-yellow hover:scale-[1.01] active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-neutral-950" />
              <span>{isSubmitting ? 'Publishing...' : `Post Task (₹${budgetInr})`}</span>
            </button>
          )}
        </div>
      </div>

      {/* Full Blinkit-style Location Selector Modal */}
      <LocationSelectorModal
        isOpen={showLocationModal}
        onClose={() => {
          setShowLocationModal(false);
          if (userLocation) {
            setLocality(userLocation.locality.split(',')[0].trim());
            setApproximateAddress(userLocation.locality);
            setTaskLat(userLocation.latitude);
            setTaskLng(userLocation.longitude);
          }
        }}
      />
    </div>
  );
};
