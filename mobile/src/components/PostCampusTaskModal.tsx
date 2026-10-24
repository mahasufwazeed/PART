import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  campusService,
  CAMPUS_TASK_CATEGORIES,
  CampusCategoryDef,
  CHENNAI_COLLEGES,
} from '@part/shared';
import {
  X,
  GraduationCap,
  Sparkles,
  MapPin,
  Calendar,
  IndianRupee,
  Clock,
  Upload,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  FileText,
  Presentation,
  Printer,
  Code,
  Package,
  Users,
  Eye,
  Building,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated?: (taskId: string) => void;
}

export const PostCampusTaskModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onTaskCreated,
}) => {
  const {
    currentProfile,
    selectedCollegeId,
    selectedCollegeName,
    openTaskDetails,
    setTab,
  } = useAppStore();

  const collegeDef =
    CHENNAI_COLLEGES.find((c) => c.id === selectedCollegeId) ||
    CHENNAI_COLLEGES[0];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(CAMPUS_TASK_CATEGORIES[0].id);
  const [budgetInr, setBudgetInr] = useState<number>(150);
  const [deadline, setDeadline] = useState('Today, 5:00 PM');
  const [campusLocation, setCampusLocation] = useState(
    collegeDef.popular_spots[0] || 'Central Library'
  );
  const [customSpot, setCustomSpot] = useState('');
  const [visibility, setVisibility] = useState<'COLLEGE_ONLY' | 'EVERYONE_NEARBY'>('COLLEGE_ONLY');
  const [fileAttachmentName, setFileAttachmentName] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Presentation':
        return <Presentation className="w-4 h-4 text-amber-600" />;
      case 'Printer':
        return <Printer className="w-4 h-4 text-emerald-600" />;
      case 'Code':
        return <Code className="w-4 h-4 text-blue-600" />;
      case 'Calendar':
        return <Calendar className="w-4 h-4 text-purple-600" />;
      case 'Package':
        return <Package className="w-4 h-4 text-orange-600" />;
      default:
        return <Users className="w-4 h-4 text-teal-600" />;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileAttachmentName(file.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProfile) return;

    if (title.trim().length < 5) {
      setErrorMessage('Title must be at least 5 characters long.');
      return;
    }
    if (description.trim().length < 10) {
      setErrorMessage('Description must be at least 10 characters.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const effectiveLocation = customSpot.trim()
      ? `${customSpot.trim()} (${selectedCollegeName})`
      : `${campusLocation} (${selectedCollegeName})`;

    const { task, error } = await campusService.createCampusTask(
      {
        title: title.trim(),
        description: description.trim(),
        category_id: categoryId,
        budget_inr: Number(budgetInr) || 100,
        deadline: deadline.trim(),
        college_id: selectedCollegeId,
        college_name: selectedCollegeName,
        campus_location: effectiveLocation,
        visibility,
        requires_verified_student: false,
        file_attachment_url: fileAttachmentName
          ? `https://storage.part.in/campus/${encodeURIComponent(fileAttachmentName)}`
          : undefined,
      },
      currentProfile.id
    );

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error);
      return;
    }

    if (task) {
      onClose();
      if (onTaskCreated) onTaskCreated(task.id);
      openTaskDetails(task.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
      <div className="bg-white w-full max-w-lg md:max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-up max-h-[92vh] sm:max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-yellow text-neutral-950 flex items-center justify-center shadow-xs">
              <GraduationCap className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-heading font-black text-base text-neutral-900 tracking-tight">
                Post Campus Task
              </h3>
              <p className="text-[11px] text-neutral-500">
                Pre-selected for <span className="font-bold text-part-green">{selectedCollegeName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-5 space-y-4 flex-1 text-xs">
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Academic Integrity Reminder */}
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3 flex items-start gap-2.5 text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <span className="font-heading font-bold text-xs block">
                Academic Integrity & Assistance Guidelines
              </span>
              <p className="text-[10.5px] text-amber-800">
                Peer tutoring, doubt clearing, PPT/poster design, printing, and campus errands are supported.
                <strong> Completing assessed coursework or exams dishonestly for another student is strictly prohibited.</strong>
              </p>
            </div>
          </div>

          {/* 1. Category Selector */}
          <div>
            <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1.5">
              Service Category *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CAMPUS_TASK_CATEGORIES.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`p-2.5 rounded-2xl border text-left flex items-start gap-2 transition cursor-pointer ${
                      isSelected
                        ? 'border-part-green bg-part-green-mint/30 shadow-xs'
                        : 'border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="p-1 rounded-lg bg-white shadow-xs shrink-0 mt-0.5">
                      {getCategoryIcon(cat.icon)}
                    </div>
                    <div className="min-w-0">
                      <span className="font-heading font-bold text-[11px] text-neutral-900 block truncate">
                        {cat.name}
                      </span>
                      <span className="text-[10px] text-neutral-400 block">
                        Typical: {cat.suggested_rates}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Task Title */}
          <div>
            <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Need help preparing a PPT / Need notes printed"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-part-green focus:bg-white transition"
            />
          </div>

          {/* 3. Description */}
          <div>
            <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">
              Task Description & Instructions *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Describe details, format needed, number of pages/slides, or materials to pick up..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-part-green focus:bg-white transition resize-none"
            />
          </div>

          {/* 4. Budget & Deadline */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">
                Reward Budget (₹) *
              </label>
              <div className="relative">
                <IndianRupee className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min={20}
                  step={10}
                  required
                  value={budgetInr}
                  onChange={(e) => setBudgetInr(Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-part-green focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">
                Needed By / Deadline *
              </label>
              <input
                type="text"
                placeholder="e.g. Today, 5:00 PM"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-part-green focus:bg-white transition"
              />
            </div>
          </div>

          {/* Quick budget chip selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[10px] font-bold text-neutral-400">Quick:</span>
            {[50, 100, 150, 200, 300, 500].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setBudgetInr(amt)}
                className={`px-2.5 py-0.5 rounded-xl text-[11px] font-heading font-bold transition cursor-pointer ${
                  budgetInr === amt
                    ? 'bg-part-green text-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                ₹{amt}
              </button>
            ))}
          </div>

          {/* 5. Campus Spot & Location */}
          <div>
            <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">
              Campus Location / Spot
            </label>
            <div className="space-y-2">
              <select
                value={campusLocation}
                onChange={(e) => setCampusLocation(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-part-green focus:bg-white transition"
              >
                {collegeDef.popular_spots.map((spot) => (
                  <option key={spot} value={spot}>
                    {spot} ({selectedCollegeName})
                  </option>
                ))}
                <option value="Custom Spot">Specific classroom or other spot...</option>
              </select>

              {campusLocation === 'Custom Spot' && (
                <input
                  type="text"
                  placeholder="Specify spot (e.g. Tech Park 4th floor, Aero Bay)..."
                  value={customSpot}
                  onChange={(e) => setCustomSpot(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-2xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-part-green transition"
                />
              )}
            </div>
          </div>

          {/* 6. Visibility Options */}
          <div>
            <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">
              Task Visibility
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVisibility('COLLEGE_ONLY')}
                className={`p-2.5 rounded-2xl border text-left transition cursor-pointer ${
                  visibility === 'COLLEGE_ONLY'
                    ? 'border-part-green bg-part-green-mint/30 shadow-xs'
                    : 'border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center gap-1.5 font-heading font-bold text-xs text-neutral-900">
                  <GraduationCap className="w-3.5 h-3.5 text-part-green" />
                  <span>My College Only</span>
                </div>
                <p className="text-[10.5px] text-neutral-500 mt-0.5">
                  Visible exclusively to {selectedCollegeName} students.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('EVERYONE_NEARBY')}
                className={`p-2.5 rounded-2xl border text-left transition cursor-pointer ${
                  visibility === 'EVERYONE_NEARBY'
                    ? 'border-brand-yellow-hover bg-brand-yellow/20 shadow-xs'
                    : 'border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center gap-1.5 font-heading font-bold text-xs text-neutral-900">
                  <Eye className="w-3.5 h-3.5 text-amber-700" />
                  <span>Everyone Nearby</span>
                </div>
                <p className="text-[10.5px] text-neutral-500 mt-0.5">
                  Visible to college students and nearby neighborhood helpers.
                </p>
              </button>
            </div>
          </div>

          {/* 7. Optional File Attachment */}
          <div>
            <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">
              Attachment / Reference (Optional)
            </label>
            <label className="p-3 border border-dashed border-neutral-300 hover:border-part-green rounded-2xl flex items-center justify-between cursor-pointer bg-neutral-50/50 hover:bg-white transition">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-neutral-400" />
                <span className="text-neutral-600 font-medium">
                  {fileAttachmentName || 'Upload PPT draft, syllabus sheet, or poster photo'}
                </span>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.ppt,.pptx"
                onChange={handleFileUpload}
              />
              <span className="text-[10px] font-bold text-part-green underline">Browse</span>
            </label>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-part-green hover:bg-part-green-dark text-white font-heading font-black text-xs rounded-2xl shadow-green hover:scale-[1.01] active:scale-[0.99] transition cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <GraduationCap className="w-4 h-4" />
                <span>Publish Campus Task (₹{budgetInr})</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
