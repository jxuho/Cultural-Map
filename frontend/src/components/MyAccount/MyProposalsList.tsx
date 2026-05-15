import { useState, useMemo } from 'react';
import { useMyProposals } from '../../hooks/data/useProposalQueries';
import BackButton from '../BackButton';
import { ProposalType } from '../../types/proposal';
import { Loader2, Clock, CheckCircle2, XCircle, ChevronRight, Hash } from 'lucide-react';

const MyProposalsList = () => {
  const [sortOption, setSortOption] = useState('-createdAt');
  const { data: proposals = [], isLoading, isError, error } = useMyProposals();

  const sortedProposals = useMemo(() => {
    if (!proposals.length) return [];
    const sortableProposals = [...proposals];
    sortableProposals.sort((a, b) => {
      switch (sortOption) {
        case '-createdAt': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'createdAt': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'status': return a.status.localeCompare(b.status);
        case '-status': return b.status.localeCompare(a.status);
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    return sortableProposals;
  }, [proposals, sortOption]);

  const renderProposedValue = (key: string, value: any, proposalType: ProposalType) => {
    if (key === 'location' && typeof value === 'object' && value?.type === 'Point') {
      return <code className="bg-zinc-100 px-1 rounded text-[10px]">{`COORD[${value.coordinates[0]}, ${value.coordinates[1]}]`}</code>;
    }

    if (proposalType === 'create') {
      const val = typeof value === 'object' ? JSON.stringify(value) : String(value);
      return <span className="font-bold">"{val}"</span>;
    } else {
      const oldV = typeof value.oldValue === 'object' ? 'OBJ' : String(value.oldValue);
      const newV = typeof value.newValue === 'object' ? 'OBJ' : String(value.newValue);
      return (
        <span className="flex flex-wrap items-center gap-1">
          <del className="text-zinc-400 font-normal">"{oldV}"</del>
          <ChevronRight size={12} className="text-black" />
          <span className="font-bold text-black">"{newV}"</span>
        </span>
      );
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-black" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em]">Processing Records...</p>
    </div>
  );

  if (isError) return (
    <div className="max-w-2xl mx-auto mt-12 border-2 border-red-600 p-8 bg-red-50">
      <h3 className="text-red-600 font-black uppercase mb-2">System Error_</h3>
      <p className="font-mono text-xs">{error.message}</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12">
      <div className="mb-10">
        <BackButton />
      </div>

      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-block bg-black text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
            User Contribution Ledger
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.85]">
            My <br /> Proposals
          </h1>
        </div>

        <div className="flex flex-col gap-2 min-w-[200px]">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Filter_Results</label>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="appearance-none bg-white border-2 border-black px-4 py-2 font-black text-[10px] uppercase tracking-widest focus:bg-black focus:text-white transition-colors cursor-pointer"
          >
            <option value="-createdAt">Date (Newest)</option>
            <option value="createdAt">Date (Oldest)</option>
            <option value="status">Status (A-Z)</option>
            <option value="-status">Status (Z-A)</option>
          </select>
        </div>
      </header>

      {!sortedProposals.length ? (
        <div className="border-2 border-dashed border-zinc-300 py-24 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">No submission history found.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {sortedProposals.map((proposal) => (
            <div key={proposal._id} className="border-2 border-black flex flex-col bg-white hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-shadow">
              {/* Card Header */}
              <div className="p-4 border-b-2 border-black flex justify-between items-start bg-zinc-50">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Hash size={12} />
                    <span className="font-mono text-[10px] font-bold uppercase">{proposal._id.slice(-8)}</span>
                  </div>
                  <h3 className="font-black uppercase tracking-tight text-sm">
                    {proposal.proposalType === 'create' ? 'Registration Request' : 'Modification Request'}
                  </h3>
                </div>
                <div className={`
                  flex items-center gap-1.5 px-2 py-1 border-2 border-black font-black text-[10px] uppercase tracking-wider
                  ${proposal.status === 'pending' ? 'bg-yellow-400 text-black' : 
                    proposal.status === 'accepted' ? 'bg-green-500 text-white' : 'bg-red-600 text-white'}
                `}>
                  {proposal.status === 'pending' && <Clock size={12} />}
                  {proposal.status === 'accepted' && <CheckCircle2 size={12} />}
                  {proposal.status === 'rejected' && <XCircle size={12} />}
                  {proposal.status}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 grow flex flex-col gap-4">
                {proposal.culturalSite && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 italic">Target Site</p>
                    <p className="font-black uppercase text-base">{proposal.culturalSite.name || 'Untitled'}</p>
                  </div>
                )}

                {proposal.proposalMessage && (
                  <div className="bg-zinc-100 p-3 border-l-4 border-black">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">User Statement</p>
                    <p className="text-xs leading-relaxed italic">"{proposal.proposalMessage}"</p>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Proposed Changes</p>
                  <ul className="space-y-1.5">
                    {Object.entries(proposal.proposedChanges || {})
                      .filter(([key]) => !(proposal.proposalType === 'create' && key === 'originalTags'))
                      .map(([key, value]) => (
                        <li key={key} className="flex items-start gap-2 text-[11px] font-mono leading-tight">
                          <span className="font-bold text-black min-w-[80px]">{key}:</span>
                          <span className="text-zinc-600">{renderProposedValue(key, value, proposal.proposalType)}</span>
                        </li>
                      ))}
                  </ul>
                </div>

                {proposal.adminComment && (
                  <div className="mt-2 p-3 border-2 border-black bg-zinc-900 text-white">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 text-zinc-400 italic underline">Admin Verdict_</p>
                    <p className="text-xs font-medium leading-relaxed">{proposal.adminComment}</p>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="p-4 border-t border-zinc-100 flex flex-wrap gap-x-4 gap-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold font-mono text-zinc-400 uppercase">
                  <span className="text-black">Submitted:</span>
                  {new Date(proposal.createdAt).toLocaleDateString('en-GB')}
                </div>
                {proposal.reviewedAt && (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold font-mono text-zinc-400 uppercase">
                    <span className="text-black">Reviewed:</span>
                    {new Date(proposal.reviewedAt).toLocaleDateString('en-GB')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyProposalsList;