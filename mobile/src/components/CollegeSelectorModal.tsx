import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  campusService,
  College,
  CHENNAI_COLLEGES,
} from '@part/shared';
import {
  Search,
  GraduationCap,
  CheckCircle2,
  X,
  Plus,
  ShieldCheck,
  Building,
  Sparkles,
  AlertCircle,
  Mail,
  MapPin,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCollegeSelected?: (college: College) => void;
}

export const CollegeSelectorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onCollegeSelected,
}) => {
  const { currentProfile, setSelectedCollege, refreshProfile, language } = useAppStore();

  const [colleges, setColleges] = useState<College[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string>(
    currentProfile?.college_id || 'vels-university'
  );

  // Suggest College Form state
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [customCollegeName, setCustomCollegeName] = useState('');
  const [customCity, setCustomCity] = useState('Chennai');
  const [customLocality, setCustomLocality] = useState('');

  // Email verification state
  const [studentEmail, setStudentEmail] = useState(
    currentProfile?.student_email || ''
  );
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const list = await campusService.getColleges(searchQuery);
      setColleges(list);
    };
    if (isOpen) {
      load();
    }
  }, [isOpen, searchQuery]);

  if (!isOpen) return null;

  const currentSelectedCollege =
    colleges.find((c) => c.id === selectedId) ||
    CHENNAI_COLLEGES.find((c) => c.id === selectedId) ||
    colleges[0];

  const handleSelectCollege = async (college: College) => {
    setSelectedId(college.id);
  };

  const handleConfirm = async () => {
    if (!currentSelectedCollege) return;
    setIsSaving(true);
    setVerifyError(null);
    setVerifyMessage(null);

    try {
      if (currentProfile?.id) {
        await campusService.setUserCollege(
          currentProfile.id,
          currentSelectedCollege.id,
          currentSelectedCollege.short_name,
          studentEmail.trim() || undefined
        );
        refreshProfile();
      }

      setSelectedCollege(currentSelectedCollege.id, currentSelectedCollege.short_name);
      if (onCollegeSelected) onCollegeSelected(currentSelectedCollege);
      onClose();
    } catch (err: any) {
      setVerifyError(err?.message || 'Failed to update college');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSuggestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCollegeName.trim()) return;

    setIsSaving(true);
    const added = await campusService.suggestCollege({
      name: customCollegeName.trim(),
      city: customCity.trim() || 'Chennai',
      locality: customLocality.trim() || 'Chennai',
    });

    setColleges((prev) => [added, ...prev]);
    setSelectedId(added.id);
    setIsSuggesting(false);
    setCustomCollegeName('');
    setIsSaving(false);
  };

  const handleVerifyStudentEmail = async () => {
    if (!studentEmail.trim() || !currentProfile?.id || !currentSelectedCollege) return;
    setVerifyError(null);
    setVerifyMessage(null);

    const res = await campusService.verifyCollegeEmail(
      currentProfile.id,
      studentEmail.trim(),
      currentSelectedCollege.id
    );

    if (res.success) {
      setVerifyMessage(
        `Verified! You are now a verified student member of ${currentSelectedCollege.short_name}.`
      );
      refreshProfile();
    } else {
      setVerifyError(res.error || 'Verification failed');
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
      <div className="bg-white w-full max-w-lg md:max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-part-green-mint text-part-green flex items-center justify-center shadow-xs">
              <GraduationCap className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-heading font-black text-base text-neutral-900 tracking-tight">
                {language === 'ta' ? 'கல்லூரி தேர்வு' : 'Select Your College'}
              </h3>
              <p className="text-[11px] text-neutral-500">
                Connect with students from your campus to share tasks & collaborate
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

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search colleges (e.g. VELS, Anna University, SRM)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-part-green focus:bg-white transition"
            />
          </div>

          {/* Quick Notice: No Admin Approval Required */}
          <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-2.5 flex items-start gap-2 text-xs text-part-green-dark">
            <CheckCircle2 className="w-4 h-4 text-part-green shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-heading font-bold text-neutral-900 block">
                Instant Peer Access
              </span>
              <p className="text-[11px] text-neutral-600">
                No university administration approval required. You can immediately post and accept tasks with fellow students.
              </p>
            </div>
          </div>

          {/* College List */}
          <div className="space-y-2">
            <span className="text-[10px] font-heading font-black text-neutral-400 uppercase tracking-wider block">
              Universities & Colleges in Chennai
            </span>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {colleges.map((college) => {
                const isSelected = selectedId === college.id;
                return (
                  <div
                    key={college.id}
                    onClick={() => handleSelectCollege(college)}
                    className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition select-none ${
                      isSelected
                        ? 'border-part-green bg-part-green-mint/20 shadow-xs'
                        : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        style={{
                          backgroundColor: college.badge_bg || '#DCFCE7',
                          color: college.accent_color || '#15803D',
                        }}
                        className="w-8 h-8 rounded-xl flex items-center justify-center font-heading font-bold text-xs shrink-0"
                      >
                        {college.emoji || '🎓'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-heading font-bold text-xs text-neutral-900 truncate">
                            {college.short_name}
                          </h4>
                          {college.id === 'vels-university' && (
                            <span className="text-[9px] font-black uppercase text-part-green bg-part-green-mint px-1.5 py-0.2 rounded-md">
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="text-[10.5px] text-neutral-500 truncate">
                          {college.name} • {college.locality || college.city}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 ml-2">
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-part-green bg-part-green text-white'
                            : 'border-neutral-300 bg-white'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}

              {colleges.length === 0 && (
                <div className="text-center py-6 text-xs text-neutral-500 space-y-1 bg-neutral-50 rounded-2xl border border-neutral-200">
                  <Building className="w-6 h-6 text-neutral-400 mx-auto" />
                  <p className="font-heading font-bold text-neutral-700">No college found matching "{searchQuery}"</p>
                  <p className="text-[11px] text-neutral-400">Suggest your college below to add it instantly.</p>
                </div>
              )}
            </div>
          </div>

          {/* Suggest College Accordion */}
          {!isSuggesting ? (
            <button
              type="button"
              onClick={() => setIsSuggesting(true)}
              className="w-full py-2.5 border border-dashed border-neutral-300 hover:border-part-green text-neutral-600 hover:text-part-green rounded-2xl font-heading font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Can't find your college? Suggest it</span>
            </button>
          ) : (
            <form onSubmit={handleSuggestSubmit} className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200 space-y-2.5 animate-slide-up">
              <div className="flex items-center justify-between">
                <span className="font-heading font-bold text-xs text-neutral-900">
                  Suggest & Add New College
                </span>
                <button
                  type="button"
                  onClick={() => setIsSuggesting(false)}
                  className="text-neutral-400 hover:text-neutral-600 text-xs"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">
                  College / University Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Crescent Institute of Science and Technology"
                  value={customCollegeName}
                  onChange={(e) => setCustomCollegeName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-part-green"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-part-green"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">
                    Locality / Area
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Vandalur"
                    value={customLocality}
                    onChange={(e) => setCustomLocality(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-part-green"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2 bg-part-green text-white font-heading font-bold text-xs rounded-xl shadow-xs hover:bg-part-green-dark transition cursor-pointer"
              >
                Add & Select College
              </button>
            </form>
          )}

          {/* Optional: Student Email Domain Verification */}
          <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-200/80 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-neutral-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-part-green" />
                <span>Verified Student Badge (Optional)</span>
              </span>
              <span className="text-[10px] font-bold text-neutral-400">
                {currentProfile?.college_status === 'verified' ? 'Verified Member' : 'Self-Selected'}
              </span>
            </div>

            <p className="text-[10.5px] text-neutral-500">
              Enter your official college email (e.g. <code>@velsuniv.ac.in</code>) to unlock verified-only campus tasks.
            </p>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Mail className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="student@velsuniv.ac.in"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-part-green"
                />
              </div>
              <button
                type="button"
                onClick={handleVerifyStudentEmail}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-heading font-bold text-[11px] rounded-xl transition cursor-pointer shrink-0"
              >
                Verify Domain
              </button>
            </div>

            {verifyMessage && (
              <div className="text-[11px] text-part-green font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{verifyMessage}</span>
              </div>
            )}
            {verifyError && (
              <div className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{verifyError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-neutral-100 flex items-center justify-between gap-3 bg-white">
          <div className="min-w-0">
            <span className="text-[10px] text-neutral-400 uppercase font-black tracking-wider block">
              Selected College
            </span>
            <span className="font-heading font-bold text-xs text-neutral-900 truncate block">
              {currentSelectedCollege?.short_name || 'Select a college'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSaving}
            className="py-2.5 px-6 bg-part-green hover:bg-part-green-dark text-white font-heading font-black text-xs rounded-xl shadow-green hover:scale-[1.01] active:scale-[0.99] transition cursor-pointer"
          >
            {isSaving ? 'Saving...' : 'Set as My College'}
          </button>
        </div>
      </div>
    </div>
  );
};
