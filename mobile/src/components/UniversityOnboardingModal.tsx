import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { CHENNAI_COLLEGES, College, authService } from '@part/shared';
import {
  GraduationCap,
  User,
  Building2,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Camera,
  Check,
  AlertCircle,
  X,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onComplete: () => void;
  onClose?: () => void;
}

export const UniversityOnboardingModal: React.FC<Props> = ({
  isOpen,
  onComplete,
  onClose,
}) => {
  const { currentProfile, setCurrentProfile } = useAppStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [userType, setUserType] = useState<'student' | 'individual' | 'organization'>('student');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollege, setSelectedCollege] = useState<College | null>(() => {
    return CHENNAI_COLLEGES.find((c) => c.id === 'vels-university') || CHENNAI_COLLEGES[0];
  });
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [yearOfStudy, setYearOfStudy] = useState('3rd Year');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    'Notes & Assignments',
    'Errands & Deliveries',
  ]);
  const [bio, setBio] = useState('Eager to help fellow students around campus.');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredColleges = CHENNAI_COLLEGES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.short_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.locality.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableSkills = [
    'Notes & Assignments',
    'Errands & Deliveries',
    'Tech & Coding Support',
    'Design & Presentations',
    'Language & Tutoring',
    'Event Assistance',
    'Buy & Sell Textbooks',
  ];

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleFinishOnboarding = async () => {
    if (!currentProfile) {
      onComplete();
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const res = await authService.updateStudentOnboarding(currentProfile.id, {
        userType,
        collegeId: selectedCollege?.id,
        collegeName: selectedCollege?.name,
        department: userType === 'student' ? department : undefined,
        yearOfStudy: userType === 'student' ? yearOfStudy : undefined,
        skills: selectedSkills,
        bio,
      });

      if (res.profile) {
        setCurrentProfile(res.profile);
      }
      onComplete();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to complete profile onboarding.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-white rounded-[28px] max-w-lg w-full border border-neutral-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#146B3A] via-emerald-500 to-[#FFCC00]" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-3 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[10px] font-heading font-black text-[#146B3A] uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3 text-[#146B3A]" />
              <span>Step {step} of 4: University Onboarding</span>
            </div>
            <h3 className="font-heading font-black text-xl text-neutral-900 tracking-tight">
              {step === 1 && 'Select Your Account Type'}
              {step === 2 && 'Find Your Campus Community'}
              {step === 3 && 'Complete Your Campus Profile'}
              {step === 4 && 'Student Verification Status'}
            </h3>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ---------------- STEP 1: USER TYPE ---------------- */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-xs text-neutral-600 font-medium">
                Choose how you plan to use PART to connect with peers and neighborhood tasks.
              </p>

              <div
                onClick={() => setUserType('student')}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3.5 ${
                  userType === 'student'
                    ? 'border-[#146B3A] bg-emerald-50/60 shadow-xs'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    userType === 'student' ? 'bg-[#146B3A] text-white' : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-black text-sm text-neutral-900">
                      College Student
                    </span>
                    {userType === 'student' && <CheckCircle2 className="w-4 h-4 text-[#146B3A]" />}
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                    Access campus-exclusive tasks, peer study notes, library runs & hostel gig matching.
                  </p>
                </div>
              </div>

              <div
                onClick={() => setUserType('individual')}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3.5 ${
                  userType === 'individual'
                    ? 'border-[#146B3A] bg-emerald-50/60 shadow-xs'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    userType === 'individual' ? 'bg-[#146B3A] text-white' : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-black text-sm text-neutral-900">
                      Individual Neighbor
                    </span>
                    {userType === 'individual' && <CheckCircle2 className="w-4 h-4 text-[#146B3A]" />}
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                    Post personal errands or offer local services in nearby Chennai residential zones.
                  </p>
                </div>
              </div>

              <div
                onClick={() => setUserType('organization')}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3.5 ${
                  userType === 'organization'
                    ? 'border-[#146B3A] bg-emerald-50/60 shadow-xs'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    userType === 'organization' ? 'bg-[#146B3A] text-white' : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-black text-sm text-neutral-900">
                      Campus Club / Organization
                    </span>
                    {userType === 'organization' && <CheckCircle2 className="w-4 h-4 text-[#146B3A]" />}
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                    Post festival gigs, volunteer drives, or hire students for campus department projects.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- STEP 2: SELECT COMMUNITY ---------------- */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-xs text-neutral-600 font-medium">
                Select your university campus to unlock nearby peer tasks and campus deals.
              </p>

              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search university or college (e.g. VELS)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:bg-white focus:outline-none focus:border-[#146B3A]"
                />
              </div>

              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {filteredColleges.map((col) => {
                  const isSelected = selectedCollege?.id === col.id;
                  return (
                    <div
                      key={col.id}
                      onClick={() => setSelectedCollege(col)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-[#146B3A] bg-emerald-50 text-neutral-900 font-bold'
                          : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{col.emoji || '🏛️'}</span>
                        <div>
                          <div className="text-xs font-heading font-bold">{col.name}</div>
                          <div className="text-[10px] text-neutral-500">
                            {col.locality}, {col.city}
                          </div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#146B3A]" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ---------------- STEP 3: COMPLETE PROFILE ---------------- */}
          {step === 3 && (
            <div className="space-y-3.5">
              <div className="flex items-center gap-3 p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100">
                <span className="text-2xl">{selectedCollege?.emoji || '🎓'}</span>
                <div>
                  <div className="text-xs font-heading font-bold text-neutral-900">
                    {selectedCollege?.name || 'Selected University'}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold">
                    Campus Network • {userType.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-heading font-bold text-neutral-700">
                  Department / Branch
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science & Engineering"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:bg-white focus:outline-none focus:border-[#146B3A]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-heading font-bold text-neutral-700">
                  Year of Study
                </label>
                <select
                  value={yearOfStudy}
                  onChange={(e) => setYearOfStudy(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:bg-white focus:outline-none focus:border-[#146B3A]"
                >
                  <option value="1st Year">1st Year (Fresher)</option>
                  <option value="2nd Year">2nd Year (Sophomore)</option>
                  <option value="3rd Year">3rd Year (Junior)</option>
                  <option value="4th Year">4th Year (Senior)</option>
                  <option value="Postgraduate">Postgraduate / Research</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-heading font-bold text-neutral-700">
                  What tasks can you help with?
                </label>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {availableSkills.map((sk) => {
                    const active = selectedSkills.includes(sk);
                    return (
                      <button
                        key={sk}
                        type="button"
                        onClick={() => toggleSkill(sk)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-heading font-bold transition cursor-pointer ${
                          active
                            ? 'bg-[#146B3A] text-white shadow-xs'
                            : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                        }`}
                      >
                        {active && '✓ '}
                        {sk}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ---------------- STEP 4: STUDENT VERIFICATION STATUS ---------------- */}
          {step === 4 && (
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-sm">
                <Clock className="w-8 h-8 text-amber-700 animate-pulse" />
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-900 font-heading font-black text-xs uppercase tracking-wider">
                  <span>Verification Status: Pending</span>
                </div>
                <h4 className="font-heading font-black text-lg text-neutral-900 mt-2">
                  Welcome to {selectedCollege?.short_name || 'Campus'} PART!
                </h4>
                <p className="text-xs text-neutral-600 max-w-sm mx-auto leading-relaxed pt-1">
                  Your campus profile has been recorded in Cloud Firestore. Student verification is
                  enforced via trusted campus moderation. You cannot manually approve your own status,
                  protecting community safety.
                </p>
              </div>

              <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/80 text-left space-y-2">
                <div className="flex items-center gap-2 text-xs font-heading font-bold text-neutral-800">
                  <ShieldCheck className="w-4 h-4 text-[#146B3A]" />
                  <span>What you can do right now:</span>
                </div>
                <ul className="text-[11px] text-neutral-600 space-y-1 list-disc pl-5 leading-normal">
                  <li>Browse and post neighborhood tasks in your locality.</li>
                  <li>Chat with verified helpers across Chennai.</li>
                  <li>Campus-only gigs unlock automatically once student ID approval completes.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-5 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
          {step > 1 && step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2 text-xs font-heading font-bold text-neutral-600 hover:text-neutral-900 cursor-pointer"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 && (
            <button
              type="button"
              onClick={() => setStep((s) => (s + 1) as any)}
              className="px-5 py-2.5 rounded-xl bg-[#146B3A] hover:bg-[#0F532D] text-white font-heading font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={() => setStep(4)}
              className="px-5 py-2.5 rounded-xl bg-[#146B3A] hover:bg-[#0F532D] text-white font-heading font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <span>Save & Verify</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {step === 4 && (
            <button
              type="button"
              onClick={handleFinishOnboarding}
              disabled={isSaving}
              className="w-full py-3 rounded-xl bg-[#146B3A] hover:bg-[#0F532D] text-white font-heading font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-60"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Enter PART Marketplace →</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
