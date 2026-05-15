import React, { useState, useEffect, ChangeEvent } from 'react';
import { X, ArrowRight, Loader2, AlertCircle, Info } from 'lucide-react';
import useUiStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';
import { useCreateCulturalSite } from '../../hooks/data/useCulturalSitesQueries';
import { useSubmitProposal } from '../../hooks/data/useProposalQueries';
import { CULTURAL_CATEGORY } from '../../config/culturalSiteConfig';
import { Point } from 'leaflet';

// --- Types & Interfaces ---
interface LocationData {
  type: Point;
  coordinates: [number, number]; // [longitude, latitude]
}

interface FormData {
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  openingHours: string;
  address: string;
  website: string;
  proposalMessage: string;
  location: LocationData | null;
  licenseInfo: string;
  sourceId: string;
  originalTags: Record<string, any>;
}

interface FormErrors {
  name?: string;
  category?: string;
  address?: string;
  proposalMessage?: string;
  location?: string;
}

const CreateForm: React.FC = () => {
  // --- Zustand ---
  const { createFormData, closeCreateForm, closeSidePanel } = useUiStore();
  const { user } = useAuthStore();
  const role = user?.role;

  // --- Mutations ---
  const submitProposalMutation = useSubmitProposal();
  const createCulturalSiteMutation = useCreateCulturalSite();

  // --- State ---
  const [formData, setFormData] = useState<FormData>({
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
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // --- Effects (기존 로직 보존) ---
  useEffect(() => {
    if (createFormData) {
      const initialAddress =
        typeof createFormData.address === 'object'
          ? createFormData.address.fullAddress
          : createFormData.address || '';

      setFormData({
        name: createFormData.name || '',
        description: createFormData.description || '',
        category: createFormData.category || '',
        imageUrl: createFormData.imageUrl || '',
        openingHours: createFormData.openingHours || '',
        address: initialAddress,
        website: createFormData.website || '',
        proposalMessage: '',
        location: createFormData.location || null,
        licenseInfo: createFormData.licenseInfo || '',
        sourceId: createFormData.sourceId || '',
        originalTags: createFormData.originalTags || {},
      });
      setFormErrors({});
      setSubmissionError(null);
    }
  }, [createFormData]);

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
  };

  const validateForm = (): FormErrors => {
    const errors: FormErrors = {};
    if (!formData.name.trim()) errors.name = 'Cultural site name is required.';
    if (!formData.category.trim()) errors.category = 'Category is required.';
    if (!formData.address.trim()) errors.address = 'Address is required.';

    if (role !== 'admin' && !formData.proposalMessage.trim())
      errors.proposalMessage = 'Proposal message is required.';

    if (
      !formData.location ||
      !formData.location.coordinates ||
      formData.location.coordinates.length !== 2
    ) {
      errors.location = 'Invalid location information.';
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmissionError(null);

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const commonSiteData = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      location: {
        type: 'Point' as const,
        coordinates: formData.location!.coordinates,
      },
      address: {
        fullAddress: formData.address,
        district: '',
        street: '',
        houseNumber: '',
        postcode: '',
        city: '',
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
        await createCulturalSiteMutation.mutateAsync(commonSiteData);
      } else {
        const proposalBody = {
          proposalType: 'create' as const,
          proposalMessage: formData.proposalMessage,
          ...commonSiteData,
        };
        await submitProposalMutation.mutateAsync(proposalBody);
      }
      closeCreateForm();
      closeSidePanel();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Unknown error occurred.';
      setSubmissionError(errorMessage);
    }
  };

  // --- Derived State ---
  const isSubmitting =
    role === 'admin'
      ? createCulturalSiteMutation.isPending
      : submitProposalMutation.isPending;
  const categories = CULTURAL_CATEGORY;

  // --- UI Styling Helper ---
  const inputBase = (hasError?: string) => `
    mt-1.5 block w-full bg-white border ${hasError ? 'border-red-500 shadow-[0_0_0_1px_rgba(239,68,68,1)]' : 'border-gray-200'} 
    px-4 py-3 text-[13px] transition-all duration-200
    placeholder:text-gray-300 focus:border-black focus:ring-0 outline-none
  `;
  const labelBase =
    'block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1';

  if (isSubmitting) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-white border-l border-black">
        <Loader2 className="w-10 h-10 animate-spin text-black mb-4" />
        <p className="text-[11px] font-black uppercase tracking-widest text-gray-500">
          Syncing with Archive...
        </p>
      </div>
    );
  }

  if (!createFormData) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-gray-50 border-l border-black">
        <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 italic">
          Fetching metadata...
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
            {role === 'admin' ? 'REGISTRY' : 'CONTRIBUTION'}
          </h2>
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-gray-400 mt-2">
            {role === 'admin'
              ? 'Administrative Entry Mode'
              : 'Digital Archive Proposal'}
          </p>
        </div>
        <button
          onClick={() => {
            closeCreateForm();
            closeSidePanel();
          }}
          className="p-2 hover:bg-black hover:text-white transition-all duration-300"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Form Body */}
      <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar">
        <form onSubmit={handleSubmit} className="space-y-10 max-w-2xl mx-auto">
          {/* Error Feedback */}
          {(Object.keys(formErrors).length > 0 || submissionError) && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
              <AlertCircle className="text-red-500 shrink-0" size={18} />
              <div className="text-[11px] font-bold text-red-700 uppercase tracking-wider">
                {submissionError ||
                  'Validation failed. Please review highlighted fields.'}
              </div>
            </div>
          )}

          {/* 01. Essential Metadata */}
          <section className="space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <span className="text-[12px] font-black font-mono">01</span>
              <div className="h-[1px] grow bg-gray-100" />
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
                placeholder="Official Name"
              />
              {formErrors.name && (
                <p className="text-[9px] font-bold text-red-500 mt-1 uppercase">
                  {formErrors.name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="category" className={labelBase}>
                Classification *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={inputBase(formErrors.category)}
              >
                <option value="">Choose Category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              {formErrors.category && (
                <p className="text-[9px] font-bold text-red-500 mt-1 uppercase">
                  {formErrors.category}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="description" className={labelBase}>
                Brief History / Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className={`${inputBase()} resize-none`}
                placeholder="Key historical facts..."
              />
            </div>
          </section>

          {/* 02. Spatial Records */}
          <section className="space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <span className="text-[12px] font-black font-mono">02</span>
              <div className="h-[1px] grow bg-gray-100" />
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
                <label className={labelBase}>Latitude</label>
                <input
                  type="text"
                  value={formData.location?.coordinates[1] || ''}
                  className={`${inputBase()} bg-gray-50 text-gray-400 border-dashed cursor-not-allowed`}
                  readOnly
                />
              </div>
              <div>
                <label className={labelBase}>Longitude</label>
                <input
                  type="text"
                  value={formData.location?.coordinates[0] || ''}
                  className={`${inputBase()} bg-gray-50 text-gray-400 border-dashed cursor-not-allowed`}
                  readOnly
                />
              </div>
            </div>
            {formErrors.location && (
              <p className="text-[9px] font-bold text-red-500 mt-1 uppercase">
                {formErrors.location}
              </p>
            )}
          </section>

          {/* 03. Technical Context */}
          <section className="space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <span className="text-[12px] font-black font-mono">03</span>
              <div className="h-[1px] grow bg-gray-100" />
            </div>

            <div>
              <label htmlFor="openingHours" className={labelBase}>
                Opening Hours
              </label>
              <input
                type="text"
                id="openingHours"
                name="openingHours"
                value={formData.openingHours}
                onChange={handleChange}
                className={inputBase()}
                placeholder="e.g., Mo-Fr 10:00-18:00"
              />
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
                  placeholder="https://..."
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
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <label className={labelBase}>Source ID (OSM)</label>
              <input
                type="text"
                value={formData.sourceId}
                className={`${inputBase()} bg-gray-50 text-gray-400 border-dashed cursor-not-allowed`}
                readOnly
              />
            </div>
          </section>

          {/* 04. Proposal Statement (If not admin) */}
          {role !== 'admin' && (
            <section className="pt-6 border-t-2 border-black">
              <div className="bg-black text-white px-3 py-1.5 inline-block text-[10px] font-black uppercase tracking-widest mb-4">
                Statement of Significance
              </div>
              <div>
                <label htmlFor="proposalMessage" className={labelBase}>
                  Reason for Proposal *
                </label>
                <textarea
                  id="proposalMessage"
                  name="proposalMessage"
                  value={formData.proposalMessage}
                  onChange={handleChange}
                  rows={4}
                  className={`${inputBase(formErrors.proposalMessage)} bg-gray-50`}
                  placeholder="Explain why this site is a valuable addition to Berlin Heritage..."
                />
                {formErrors.proposalMessage && (
                  <p className="text-[9px] font-bold text-red-500 mt-1 uppercase">
                    {formErrors.proposalMessage}
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Action Footer */}
          <div className="pt-8 pb-12 border-t border-gray-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className="group w-full bg-black text-white py-5 px-8 flex items-center justify-between hover:bg-zinc-800 transition-all duration-300 disabled:bg-gray-200 disabled:cursor-not-allowed"
            >
              <span className="text-[12px] font-black uppercase tracking-[0.3em]">
                {isSubmitting
                  ? 'Processing...'
                  : role === 'admin'
                    ? 'Add To Archive'
                    : 'Submit Proposal'}
              </span>
              {!isSubmitting && (
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-2 transition-transform"
                />
              )}
            </button>
            <div className="mt-6 p-4 bg-gray-50 flex items-start gap-3">
              <Info size={14} className="text-gray-400 mt-0.5" />
              <p className="text-[9px] text-gray-400 uppercase tracking-widest leading-relaxed">
                All submissions are reviewed by the registry board. <br />
                Accuracy is essential for maintaining the digital collection
                standards.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateForm;
