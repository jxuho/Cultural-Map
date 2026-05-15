import { useState, useMemo } from 'react';
import { BsStarFill } from 'react-icons/bs';
import useAuthStore from '../../store/authStore';
import {
  useMyFavorites,
  useFavoriteMutation,
} from '../../hooks/data/useFavoriteQueries';
import ErrorMessage from '../ErrorMessage';
import StarIcon from '../StarIcon';
import BackButton from '../BackButton';
import { Loader2, ArrowUpDown, Info, ExternalLink } from 'lucide-react';

type SortCriteria = 'name' | 'averageRating' | 'reviewCount';
type SortOrder = 'asc' | 'desc';

const FavoriteSites = () => {
  const currentUser = useAuthStore((state) => state.user);
  const [expandedSiteId, setExpandedSiteId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortCriteria>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const {
    data: myFavorites,
    isLoading: isLoadingFavorites,
    isError: isFavoritesError,
    error: favoritesError,
  } = useMyFavorites(currentUser?._id);

  const favoriteMutation = useFavoriteMutation();

  const handleFavoriteChange = async (
    event: React.MouseEvent<HTMLButtonElement>,
    culturalSiteId: string,
    isCurrentlyFavorite: boolean,
  ) => {
    event.stopPropagation();
    if (!currentUser) {
      alert('Authentication required.');
      return;
    }
    try {
      await favoriteMutation.mutateAsync({
        actionType: isCurrentlyFavorite ? 'delete' : 'add',
        culturalSiteId: culturalSiteId,
      });
    } catch (err) {
      console.error('Favorite status sync failed:', err);
    }
  };

  const sortedFavorites = useMemo(() => {
    if (!myFavorites || myFavorites.length === 0) return [];
    const sortableFavorites = [...myFavorites];
    sortableFavorites.sort((a, b) => {
      let valA, valB;
      switch (sortBy) {
        case 'averageRating': valA = a.averageRating || 0; valB = b.averageRating || 0; break;
        case 'reviewCount': valA = a.reviewCount || 0; valB = b.reviewCount || 0; break;
        default: valA = a.name || ''; valB = b.name || '';
      }
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
    return sortableFavorites;
  }, [myFavorites, sortBy, sortOrder]);

  const handleSortChange = (criteria: SortCriteria) => {
    if (sortBy === criteria) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(criteria);
      setSortOrder('asc');
    }
  };

  const labelClass = "text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 block";
  const infoRowClass = "border-b border-zinc-100 py-3 last:border-0";

  const renderContent = () => {
    if (!currentUser) return (
      <div className="py-20 text-center border-2 border-black bg-zinc-50">
        <p className="font-mono text-xs uppercase font-bold">Access Denied: Please Sign In</p>
      </div>
    );

    if (isLoadingFavorites) return (
      <div className="py-20 flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Syncing Archive...</p>
      </div>
    );

    if (isFavoritesError) return <ErrorMessage message={favoritesError?.message || 'Archive sync failed.'} />;

    if (sortedFavorites.length === 0) return (
      <div className="py-20 text-center border-2 border-dashed border-zinc-300">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">No bookmark records found.</p>
      </div>
    );

    return (
      <div className="grid gap-4">
        {sortedFavorites.map((site) => (
          <div 
            key={site._id}
            className={`border-2 border-black transition-all ${expandedSiteId === site._id ? 'bg-white' : 'bg-zinc-50 hover:bg-zinc-100'}`}
          >
            <div 
              className="flex items-center justify-between p-5 cursor-pointer"
              onClick={() => setExpandedSiteId(expandedSiteId === site._id ? null : site._id)}
            >
              <div className="grow">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-black text-white px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider">Indexed</span>
                  <span className="text-[10px] font-mono text-zinc-400">#{site._id.slice(-6)}</span>
                </div>
                <h3 className="text-lg font-black uppercase tracking-tighter leading-none">{site.name}</h3>
              </div>
              <button
                onClick={(e) => handleFavoriteChange(e, site._id, true)}
                className={`p-3 border-2 border-black transition-colors ${favoriteMutation.isPending ? 'opacity-20' : 'hover:bg-yellow-400 bg-white'}`}
                disabled={favoriteMutation.isPending}
              >
                <BsStarFill className={favoriteMutation.isPending ? 'text-zinc-300' : 'text-black'} />
              </button>
            </div>

            {expandedSiteId === site._id && (
              <div className="p-6 border-t-2 border-black bg-white animate-in slide-in-from-top-2 duration-200">
                <div className="grid md:grid-cols-2 gap-x-12">
                  <div className={infoRowClass}>
                    <label className={labelClass}>Collective Rating</label>
                    <div className="flex items-center gap-3">
                      <div className="flex text-black">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon key={i} rating={site.averageRating || 0} index={i} className="w-4 h-4" displayMode="averageRating" />
                        ))}
                      </div>
                      <span className="font-mono text-sm font-bold">{site.averageRating?.toFixed(1) || '0.0'} ({site.reviewCount})</span>
                    </div>
                  </div>

                  <div className={infoRowClass}>
                    <label className={labelClass}>Category Tags</label>
                    <p className="text-xs font-bold uppercase tracking-tight">
                      {site.category?.replace(/_/g, ' ') || 'UNCLASSIFIED'}
                    </p>
                  </div>

                  <div className={`${infoRowClass} md:col-span-2`}>
                    <label className={labelClass}>Geographic Location</label>
                    <p className="text-xs font-mono">{site.address?.fullAddress || 'Location data missing'}</p>
                  </div>

                  {site.description && (
                    <div className={`${infoRowClass} md:col-span-2`}>
                      <label className={labelClass}>Archive Description</label>
                      <p className="text-xs leading-relaxed text-zinc-600 font-serif italic">"{site.description}"</p>
                    </div>
                  )}
                </div>

                {site.website && (
                  <a 
                    href={site.website} target="_blank" rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-2 bg-black text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                  >
                    External Link <ExternalLink size={12} />
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const sortBtnClass = (active: boolean) => `
    flex items-center gap-2 px-4 py-2 border-2 border-black text-[10px] font-black uppercase tracking-widest transition-all
    ${active ? 'bg-black text-white' : 'bg-white text-black hover:bg-zinc-100'}
  `;

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-12 min-h-full flex flex-col">
      <div className="mb-12">
        <BackButton />
      </div>

      <header className="mb-12">
        <div className="inline-block bg-black text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
          Personal Storage
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.85]">
          My <br /> Favorites
        </h1>
      </header>

      <div className="flex flex-wrap gap-2 mb-10">
        {(['name', 'averageRating', 'reviewCount'] as SortCriteria[]).map((criteria) => (
          <button 
            key={criteria}
            onClick={() => handleSortChange(criteria)} 
            className={sortBtnClass(sortBy === criteria)}
          >
            {criteria === 'averageRating' ? 'Rating' : criteria === 'reviewCount' ? 'Reviews' : 'Name'}
            {sortBy === criteria && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        ))}
      </div>

      <div className="grow">
        {renderContent()}
      </div>

      {favoriteMutation.isPending && (
        <div className="fixed bottom-8 right-8 bg-black text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest animate-pulse border-2 border-white shadow-xl">
          Updating Archive...
        </div>
      )}
    </div>
  );
};

export default FavoriteSites;