import { useState, useMemo } from 'react';
import { useProposalModeration, useProposals } from '../../hooks/data/useProposalQueries';
import BackButton from '../BackButton';
import { Loader2, AlertTriangle, Check, X, Info, User, Calendar, ArrowRight } from 'lucide-react';

const Proposals = () => {
  const [sortOption, setSortOption] = useState<string>('-createdAt');
  const [adminComment, setadminComment] = useState<{ [key: string]: string }>({});

  const { data: proposals = [], isLoading, isError, error } = useProposals();
  const {
    mutate: moderateProposal,
    isPending: isModerationPending,
    isError: isModerationError,
    error: moderationError,
  } = useProposalModeration();

  const sortedProposals = useMemo(() => {
    if (!proposals.length) return [];
    const sortableProposals = [...proposals];
    sortableProposals.sort((a, b) => {
      let comparison = 0;
      const getT = (d: any) => (d ? new Date(d).getTime() : 0);

      switch (sortOption) {
        case '-createdAt': comparison = getT(b.createdAt) - getT(a.createdAt); break;
        case 'createdAt': comparison = getT(a.createdAt) - getT(b.createdAt); break;
        case '-reviewedAt': comparison = getT(b.reviewedAt) - getT(a.reviewedAt); break;
        case 'reviewedAt': comparison = getT(a.reviewedAt) - getT(b.reviewedAt); break;
        case 'status': comparison = a.status.localeCompare(b.status); break;
        case '-status': comparison = b.status.localeCompare(a.status); break;
        default: comparison = getT(b.createdAt) - getT(a.createdAt);
      }
      return comparison;
    });
    return sortableProposals;
  }, [proposals, sortOption]);

  const handleAdminNoteChange = (proposalId: string, note: string) => {
    setadminComment((prev) => ({ ...prev, [proposalId]: note }));
  };

  const handleModerate = (proposalId: string, actionType: 'accept' | 'reject') => {
    const note = adminComment[proposalId] || '';
    if (!note.trim()) {
      alert('Critical: Administrative reasoning (note) is required for this action.');
      return;
    }
    moderateProposal({ proposalId, actionType, adminComment: note });
  };

  const renderProposedValue = (key: string, value: any, proposalType: string) => {
    if (key === 'location' && typeof value === 'object' && value?.type === 'Point') {
      return <code className="bg-zinc-100 px-1.5 py-0.5 text-[10px] border border-zinc-300">{`COORD[${value.coordinates.join(', ')}]`}</code>;
    }

    if (proposalType === 'create') {
      return <span className="font-bold text-black italic">"{typeof value === 'object' ? JSON.stringify(value) : value}"</span>;
    } else {
      const oldV = typeof value.oldValue === 'object' ? 'DATA_OBJ' : String(value.oldValue);
      const newV = typeof value.newValue === 'object' ? 'DATA_OBJ' : String(value.newValue);
      return (
        <span className="flex items-center gap-2 flex-wrap">
          <span className="text-zinc-400 line-through">"{oldV}"</span>
          <ArrowRight size={12} className="text-zinc-400" />
          <span className="font-bold text-blue-600">"{newV}"</span>
        </span>
      );
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-black" />
      <p className="text-[10px] font-black uppercase tracking-[0.4em]">Decrypting Archive...</p>
    </div>
  );

  if (isError) return (
    <div className="max-w-2xl mx-auto mt-20 border-4 border-black p-10 bg-red-50 shadow-[12px_12px_0px_0px_rgba(220,38,38,1)]">
      <h2 className="text-2xl font-black uppercase mb-4 flex items-center gap-2 text-red-600">
        <AlertTriangle size={28} /> System_Fault_Detected
      </h2>
      <p className="font-mono text-sm mb-6">{error.message}</p>
      <BackButton />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12">
      <div className="mb-12">
        <BackButton />
      </div>

      <header className="mb-16 border-b-4 border-black pb-8 flex flex-col md:flex-row justify-between items-end gap-8">
        <div>
          <div className="inline-block bg-black text-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
            Authority Control Panel
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.8]">
            Moderation<br />Queue
          </h1>
        </div>

        <div className="w-full md:w-72">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Archive_Sort_Logic</label>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="w-full appearance-none bg-white border-2 border-black px-4 py-3 font-black text-xs uppercase tracking-widest focus:bg-zinc-100 transition-colors cursor-pointer"
          >
            <option value="-createdAt">Submission (Newest)</option>
            <option value="createdAt">Submission (Oldest)</option>
            <option value="-reviewedAt">Review Date (Newest)</option>
            <option value="reviewedAt">Review Date (Oldest)</option>
            <option value="status">Status (A-Z)</option>
            <option value="-status">Status (Z-A)</option>
          </select>
        </div>
      </header>

      {isModerationPending && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-yellow-400 border-2 border-black px-6 py-2 font-black text-[10px] uppercase tracking-widest shadow-xl animate-bounce">
          System Sync in Progress...
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {sortedProposals.map((proposal) => (
          <div key={proposal._id} className="border-2 border-black bg-white flex flex-col group hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all">
            {/* CARD HEADER */}
            <div className="p-5 border-b-2 border-black flex justify-between items-center bg-zinc-50 group-hover:bg-zinc-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full border border-black ${proposal.status === 'pending' ? 'bg-yellow-400' : proposal.status === 'accepted' ? 'bg-green-500' : 'bg-red-600'}`} />
                <span className="font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-widest">UID_{proposal._id.slice(-6)}</span>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border border-black ${
                proposal.status === 'pending' ? 'bg-zinc-200' : proposal.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {proposal.status}
              </span>
            </div>

            {/* CARD BODY */}
            <div className="p-6 grow flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-zinc-100 pb-6">
                <div>
                  <label className="text-[9px] font-black uppercase text-zinc-400 block mb-1">Entry_Type</label>
                  <p className="font-black text-lg uppercase tracking-tight">{proposal.proposalType}</p>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-zinc-400 block mb-1">Target_Site</label>
                  <p className="font-bold text-sm truncate">{proposal.culturalSite?.name || 'NEW_RECORD'}</p>
                </div>
              </div>

              {proposal.proposalMessage && (
                <div className="bg-zinc-50 p-4 border-l-4 border-black">
                  <label className="text-[9px] font-black uppercase text-zinc-400 block mb-1">Requester_Note</label>
                  <p className="text-xs italic leading-relaxed">"{proposal.proposalMessage}"</p>
                </div>
              )}

              <div className="space-y-4">
                <label className="text-[9px] font-black uppercase text-zinc-400 flex items-center gap-1.5">
                  <Info size={10} /> Proposed_Data_Modifications
                </label>
                <div className="border-2 border-zinc-100 rounded p-4 space-y-3">
                  {Object.entries(proposal.proposedChanges || {})
                    .filter(([key]) => !(proposal.proposalType === 'create' && key === 'originalTags'))
                    .map(([key, value]) => (
                      <div key={key} className="flex flex-col gap-1">
                        <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase underline decoration-zinc-200">{key}</span>
                        <div className="text-xs leading-tight">
                          {renderProposedValue(key, value, proposal.proposalType)}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="mt-auto pt-6 flex items-center justify-between text-[10px] font-bold font-mono text-zinc-400 uppercase">
                <div className="flex items-center gap-1.5"><Calendar size={12} /> {new Date(proposal.createdAt).toLocaleDateString()}</div>
                <div className="flex items-center gap-1.5"><User size={12} /> {proposal.proposedBy?.email?.split('@')[0] || 'Unknown'}</div>
              </div>
            </div>

            {/* MODERATION AREA */}
            {proposal.status === 'pending' ? (
              <div className="p-6 border-t-2 border-black bg-zinc-50 space-y-4">
                <div>
                  <label htmlFor={`note-${proposal._id}`} className="text-[10px] font-black uppercase tracking-widest text-black block mb-2 underline decoration-yellow-400 decoration-2">
                    Official Verdict / Admin Note
                  </label>
                  <textarea
                    id={`note-${proposal._id}`}
                    value={adminComment[proposal._id] || ''}
                    onChange={(e) => handleAdminNoteChange(proposal._id, e.target.value)}
                    placeholder="Enter legal or procedural reasoning for this decision..."
                    className="w-full bg-white border-2 border-black p-3 text-xs font-medium focus:ring-0 focus:outline-none min-h-[80px]"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleModerate(proposal._id, 'accept')}
                    disabled={isModerationPending || !adminComment[proposal._id]?.trim()}
                    className="flex-1 bg-black text-white py-3 flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-green-600 transition-colors disabled:opacity-20 disabled:grayscale"
                  >
                    <Check size={14} /> Approve_Entry
                  </button>
                  <button
                    onClick={() => handleModerate(proposal._id, 'reject')}
                    disabled={isModerationPending || !adminComment[proposal._id]?.trim()}
                    className="flex-1 bg-white text-black border-2 border-black py-3 flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-600 hover:text-white transition-colors disabled:opacity-20"
                  >
                    <X size={14} /> Reject_Entry
                  </button>
                </div>
              </div>
            ) : proposal.adminComment && (
              <div className="p-6 border-t-2 border-black bg-zinc-100 italic">
                <label className="text-[9px] font-black uppercase text-zinc-500 block mb-1">Archived_Verdict</label>
                <p className="text-xs text-zinc-600 font-medium">"{proposal.adminComment}"</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Proposals;