import React, { useState, useEffect, ChangeEvent } from 'react';
import {
  X,
  ArrowRight,
  Loader2,
  AlertCircle,
  Info,
  Trash2,
  Edit3,
} from 'lucide-react';
import useUiStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';
import { useUpdateCulturalSite } from '../../hooks/data/useCulturalSitesQueries';
import { useSubmitProposal } from '../../hooks/data/useProposalQueries';
import { CULTURAL_CATEGORY } from '../../config/culturalSiteConfig';
import { Place } from '../../types/place';

// --- Types ---
interface UpdateFormData {
  _id: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  openingHours: string;
  address: string;
  website: string;
  proposalMessage: string;
  location: {
    type: 'Point';
    coordinates: number[];
  } | null;
  licenseInfo: string;
  sourceId: string;
  originalTags: Record<string, any>;
  initialData: Place | null;
}

interface FormErrors {
  name?: string;
  category?: string;
  address?: string;
  location?: string;
  proposalMessage?: string;
  noChanges?: string;
}

const UpdateForm: React.FC = () => {
  // --- Zustand Store ---
  const { updateFormData, closeUpdateForm, closeSidePanel } = useUiStore();
  const { user } = useAuthStore();
  const role = user?.role;

  // --- Mutations ---
  const submitProposalMutation = useSubmitProposal();
  const updateCulturalSiteMutation = useUpdateCulturalSite();

  // --- State ---
  const [formData, setFormData] = useState<UpdateFormData>({
    _id: '',
    name: '',
    description: '',
    category: '',
    imageUrl: '',
    openingHours: '',
    address: '',
    website: '',
    proposalMessage: '',
    location: null,
    licenseInfo: '',
    sourceId: '',
    originalTags: {},
    initialData: null,
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [proposalType, setProposalType] = useState<'update' | 'delete'>(
    'update',
  );
  const [backendError, setBackendError] = useState<string | null>(null);

  // --- Effects (Data Initialization Logic) ---
  useEffect(() => {
    if (updateFormData) {
      const data = updateFormData as Place;
      setFormData({
        _id: data._id || '',
        name: data.name || '',
        description: data.description || '',
        category: data.category || '',
        imageUrl: data.imageUrl || '',
        openingHours: data.openingHours || '',
        address:
          typeof data.address === 'object'
            ? data.address.fullAddress
            : String(data.address || ''),
        website: data.website || '',
        proposalMessage: '',
        location: data.location ? { ...data.location, type: 'Point' } : null,
        licenseInfo: data.licenseInfo || '',
        sourceId: data.sourceId || '',
        originalTags: data.originalTags || {},
        initialData: data,
      });
      setFormErrors({});
      setSubmissionError(null);
      setBackendError(null);
      setProposalType('update');
    }
  }, [updateFormData]);

  // --- Handlers ---
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prevErrors) => ({ ...prevErrors, [name]: undefined }));
    }
    setSubmissionError(null);
    setBackendError(null);
  };

  const validateForm = (): FormErrors => {
    const errors: FormErrors = {};
    if (!formData.name.trim() && proposalType === 'update')
      errors.name = 'Cultural site name is required.';
    if (!formData.category.trim() && proposalType === 'update')
      errors.category = 'Category is required.';
    if (!formData.address.trim() && proposalType === 'update')
      errors.address = 'Address is required.';

    if (
      (!formData.location ||
        !formData.location.coordinates ||
        formData.location.coordinates.length !== 2) &&
      proposalType === 'update'
    ) {
      errors.location = 'Invalid location information.';
    }

    if (role !== 'admin' && !formData.proposalMessage.trim()) {
      errors.proposalMessage = 'Proposal message is required.';
    }

    if (role !== 'admin' && proposalType === 'update' && formData.initialData) {
      const hasChanges = (
        Object.keys(formData) as Array<keyof UpdateFormData>
      ).some((key) => {
        if (
          ['_id', 'proposalMessage', 'initialData', 'proposalType'].includes(
            key,
          )
        )
          return false;
        if (key === 'location') {
          const currentCoords = formData.location?.coordinates;
          const initialCoords = formData.initialData?.location?.coordinates;
          return (
            currentCoords?.[0] !== initialCoords?.[0] ||
            currentCoords?.[1] !== initialCoords?.[1]
          );
        }
        if (key === 'address') {
          const initialAddress =
            typeof formData.initialData?.address === 'object'
              ? formData.initialData.address.fullAddress
              : formData.initialData?.address;
          return formData.address !== initialAddress;
        }
        return formData[key] !== (formData.initialData as any)[key];
      });

      if (!hasChanges && !formData.proposalMessage.trim()) {
        errors.noChanges =
          'No changes detected. Please modify a field or provide a proposal message.';
      }
    }
    return errors;
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmissionError(null);
    setBackendError(null);

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const currentSiteData = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      location: formData.location,
      address: {
        fullAddress: formData.address,
        district: '',
        street: '',
        houseNumber: '',
        postcode: '',
        city: 'Berlin',
      },
      website: formData.website,
      imageUrl: formData.imageUrl,
      openingHours: formData.openingHours,
      licenseInfo: formData.licenseInfo,
      sourceId: formData.sourceId,
      originalTags: formData.originalTags,
    };

    try {
      if (role === 'admin') {
        await updateCulturalSiteMutation.mutateAsync({
          culturalSiteId: formData._id,
          updateData: currentSiteData as Partial<Place>,
        });
      } else {
        let proposalBody: any;
        if (proposalType === 'update') {
          const proposedChanges: any = {};
          for (const key in currentSiteData) {
            const k = key as keyof typeof currentSiteData;
            if (k === 'location') {
              const currentCoords = currentSiteData.location?.coordinates;
              const initialCoords = formData.initialData?.location?.coordinates;
              if (
                currentCoords?.[0] !== initialCoords?.[0] ||
                currentCoords?.[1] !== initialCoords?.[1]
              ) {
                proposedChanges.location = currentSiteData.location;
              }
            } else if (k === 'address') {
              const initialAddrStr =
                typeof formData.initialData?.address === 'object'
                  ? formData.initialData.address.fullAddress
                  : formData.initialData?.address;
              if (formData.address !== initialAddrStr)
                proposedChanges.address = currentSiteData.address;
            } else if (
              currentSiteData[k] !== (formData.initialData as any)[k]
            ) {
              proposedChanges[k] = currentSiteData[k];
            }
          }
          proposalBody = {
            proposalType: 'update',
            proposalMessage: formData.proposalMessage,
            culturalSite: formData._id,
            ...proposedChanges,
          };
        } else {
          proposalBody = {
            proposalType: 'delete',
            proposalMessage: formData.proposalMessage,
            culturalSite: formData._id,
          };
        }
        await submitProposalMutation.mutateAsync(proposalBody);
      }
      closeUpdateForm();
      closeSidePanel();
    } catch (error: any) {
      if (error.response?.data?.message?.includes('E11000')) {
        setBackendError(
          'A pending proposal for this site already exists. Please wait for processing.',
        );
      } else {
        setSubmissionError(
          error.response?.data?.message ||
            error.message ||
            'Submission failed.',
        );
      }
    }
  };

  // --- UI Helpers ---
  const isSubmitting =
    role === 'admin'
      ? updateCulturalSiteMutation.isPending
      : submitProposalMutation.isPending;
  const inputBase = (hasError?: string | boolean) => `
    mt-1.5 block w-full bg-white border ${hasError ? 'border-red-500 shadow-[0_0_0_1px_rgba(239,68,68,1)]' : 'border-gray-200'} 
    px-4 py-3 text-[13px] transition-all duration-200
    placeholder:text-gray-300 focus:border-black focus:ring-0 outline-none
    disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
  `;
  const labelBase =
    'block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1';

  if (isSubmitting) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-white border-l border-black">
        <Loader2 className="w-10 h-10 animate-spin text-black mb-4" />
        <p className="text-[11px] font-black uppercase tracking-widest text-gray-500">
          Updating Archive...
        </p>
      </div>
    );
  }

  if (!updateFormData) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-gray-50 border-l border-black">
        <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 italic font-mono">
          Fetching Record Metadata...
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden border-l border-black">
      {/* Header */}
      <div className="px-6 py-8 border-b border-black flex items-start justify-between bg-white sticky top-0 z-20">
        <div>
          <h2 className="text-2xl font-black tracking-tight leading-none text-black">
            {role === 'admin' ? 'MODIFICATION' : 'PROPOSAL'}
          </h2>
          <div>
            <label className={labelBase}>Record Reference ID</label>
            <div className="mt-1.5 flex items-center gap-2 px-4 py-3 bg-zinc-50 border border-gray-200 group transition-colors hover:border-zinc-400">
              <span className="font-mono text-[12px] text-zinc-600 tracking-tight leading-none uppercase">
                {formData._id}
              </span>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity italic">
                  Read-Only ID
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            closeUpdateForm();
            closeSidePanel();
          }}
          className="p-2 hover:bg-black hover:text-white transition-all duration-300"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar">
        <form
          onSubmit={handleSubmit}
          className="space-y-10 max-w-2xl mx-auto pb-20"
        >
          {/* Error Display */}
          {(Object.keys(formErrors).length > 0 ||
            submissionError ||
            backendError) && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 flex items-start gap-3 animate-in fade-in slide-in-from-left-2">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
              <div className="text-[11px] font-bold text-red-700 uppercase tracking-wider leading-relaxed">
                {backendError ||
                  submissionError ||
                  formErrors.noChanges ||
                  'Validation Error: Please check required fields.'}
              </div>
            </div>
          )}

          {/* Proposal Type Selector (Non-Admin Only) */}
          {role !== 'admin' && (
            <div className="flex gap-2 p-1 bg-gray-100 rounded-sm">
              <button
                type="button"
                onClick={() => setProposalType('update')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                  proposalType === 'update'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Edit3 size={14} /> Update Request
              </button>
              <button
                type="button"
                onClick={() => setProposalType('delete')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                  proposalType === 'delete'
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Trash2 size={14} /> Deletion Request
              </button>
            </div>
          )}

          <fieldset
            disabled={proposalType === 'delete'}
            className="space-y-8 disabled:opacity-50 transition-opacity"
          >
            {/* Section 01: Metadata */}
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-[12px] font-black font-mono">01</span>
                <div className="h-[1px] grow bg-gray-100" />
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-300 italic">
                  Basic Data
                </span>
              </div>

              <div>
                <label htmlFor="name" className={labelBase}>
                  Site Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={inputBase(formErrors.name)}
                />
                {formErrors.name && (
                  <p className="text-[9px] font-bold text-red-500 mt-1 uppercase">
                    {formErrors.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="category" className={labelBase}>
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={inputBase(formErrors.category)}
                  >
                    <option value="">Select Category</option>
                    {CULTURAL_CATEGORY.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="openingHours" className={labelBase}>
                    Hours
                  </label>
                  <input
                    type="text"
                    id="openingHours"
                    name="openingHours"
                    value={formData.openingHours}
                    onChange={handleChange}
                    className={inputBase()}
                    placeholder="Mo-Fr 09:00-17:00"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className={labelBase}>
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className={`${inputBase()} resize-none`}
                />
              </div>
            </section>

            {/* Section 02: Spatial & Source */}
            <section className="space-y-6 pt-4">
              <div className="flex items-center gap-4">
                <span className="text-[12px] font-black font-mono">02</span>
                <div className="h-[1px] grow bg-gray-100" />
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-300 italic">
                  Location & Source
                </span>
              </div>

              <div>
                <label htmlFor="address" className={labelBase}>
                  Address *
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className={inputBase(formErrors.address)}
                />
                {formErrors.address && (
                  <p className="text-[9px] font-bold text-red-500 mt-1 uppercase">
                    {formErrors.address}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelBase}>Lat (Read-Only)</label>
                  <input
                    type="text"
                    value={formData.location?.coordinates[1] || ''}
                    className={`${inputBase()} bg-gray-50 border-dashed`}
                    readOnly
                  />
                </div>
                <div>
                  <label className={labelBase}>Long (Read-Only)</label>
                  <input
                    type="text"
                    value={formData.location?.coordinates[0] || ''}
                    className={`${inputBase()} bg-gray-50 border-dashed`}
                    readOnly
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="imageUrl" className={labelBase}>
                    Image URL
                  </label>
                  <input
                    type="url"
                    id="imageUrl"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    className={inputBase()}
                  />
                </div>
                <div>
                  <label htmlFor="website" className={labelBase}>
                    Website
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className={inputBase()}
                  />
                </div>
              </div>
            </section>
          </fieldset>

          {/* Section 03: Proposal Message (Required for non-admins) */}
          {role !== 'admin' && (
            <section className="pt-8 border-t-2 border-black">
              <div className="bg-black text-white px-3 py-1.5 inline-block text-[10px] font-black uppercase tracking-widest mb-4">
                Justification Statement
              </div>
              <label htmlFor="proposalMessage" className={labelBase}>
                Reason for {proposalType} *
              </label>
              <textarea
                id="proposalMessage"
                name="proposalMessage"
                value={formData.proposalMessage}
                onChange={handleChange}
                rows={4}
                className={`${inputBase(formErrors.proposalMessage)} bg-gray-50`}
                placeholder={
                  proposalType === 'update'
                    ? 'Explain what needs changing and why...'
                    : 'Explain why this site should be removed...'
                }
              />
              {formErrors.proposalMessage && (
                <p className="text-[9px] font-bold text-red-500 mt-1 uppercase">
                  {formErrors.proposalMessage}
                </p>
              )}
            </section>
          )}

          {/* Action Footer */}
          <div className="pt-10 border-t border-gray-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`group w-full py-5 px-8 flex items-center justify-between transition-all duration-300 disabled:bg-gray-200 disabled:cursor-not-allowed ${
                proposalType === 'delete'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-black hover:bg-zinc-800'
              } text-white`}
            >
              <span className="text-[12px] font-black uppercase tracking-[0.3em]">
                {role === 'admin'
                  ? 'Commit Update'
                  : `Submit ${proposalType} Proposal`}
              </span>
              {!isSubmitting && (
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-2 transition-transform"
                />
              )}
              {isSubmitting && <Loader2 size={18} className="animate-spin" />}
            </button>

            <div className="mt-6 p-4 bg-gray-50 flex items-start gap-3">
              <Info size={14} className="text-gray-400 mt-0.5" />
              <p className="text-[9px] text-gray-400 uppercase tracking-widest leading-relaxed">
                Changes will be logged in the permanent record. <br />
                {role === 'admin'
                  ? 'Admin action: Immediate data override enabled.'
                  : 'Peer review process will begin after submission.'}
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateForm;
