import { useAllUsers } from '../../hooks/data/useUserQueries';
import defaultProfileImg from '../../assets/profile_image.svg';
import UserProfileCard from './UserProfileCard';
import { useState, useMemo } from 'react';
import BackButton from '../BackButton';
import useAuthStore from '../../store/authStore';
import { Users, SortAsc, ChevronDown, ChevronUp, Loader2, Search, UserCheck } from 'lucide-react';

const UsersManagementPage = () => {
  const { data: users, isLoading, isError, error } = useAllUsers();
  const { user: currentUser } = useAuthStore();

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'username' | 'role' | 'createdAt' | 'updatedAt'>('username');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleViewProfile = (userId: string) => {
    setSelectedUserId((prev) => (prev === userId ? null : userId));
  };

  const sortedUsers = useMemo(() => {
    if (!users || users.length === 0) return [];

    const otherUsers = users.filter((user) => user._id !== currentUser?._id);
    const loggedInUser = users.find((user) => user._id === currentUser?._id);

    const sortableUsers = [...otherUsers];

    sortableUsers.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortBy) {
        case 'role': valA = a.role; valB = b.role; break;
        case 'createdAt': valA = new Date(a.createdAt).getTime(); valB = new Date(b.createdAt).getTime(); break;
        case 'updatedAt': valA = new Date(a.updatedAt).getTime(); valB = new Date(b.updatedAt).getTime(); break;
        default: valA = a.username || ''; valB = b.username || ''; break;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

    return loggedInUser ? [loggedInUser, ...sortableUsers] : sortableUsers;
  }, [users, sortBy, sortOrder, currentUser]);

  const handleSortChange = (criteria: typeof sortBy) => {
    if (sortBy === criteria) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(criteria);
      setSortOrder('asc');
    }
  };

  const getSortIndicator = (criteria: typeof sortBy) => {
    if (sortBy !== criteria) return null;
    return sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-white gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-black" strokeWidth={3} />
      <p className="font-black uppercase tracking-[0.3em] text-[10px]">Accessing Personnel Records...</p>
    </div>
  );

  if (isError) return (
    <div className="p-12 text-center h-screen flex flex-col items-center justify-center">
      <div className="border-4 border-black p-8 bg-red-50 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-2xl font-black uppercase mb-2">Access_Denied</h2>
        <p className="font-mono text-sm">{error.message || 'Failed to load user database.'}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <BackButton />
        </div>

        <header className="mb-16 border-b-8 border-black pb-8 flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-black text-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
              <Users size={14} /> Global Administration
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.8]">
              User<br />Registry
            </h1>
          </div>
          <div className="text-right hidden md:block font-mono text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-relaxed">
            Total_Entries: {users?.length || 0}<br />
            Security_Level: Level_4
          </div>
        </header>

        {/* Sort Controls - Tab Style */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <SortAsc size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Sort_Logic:</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { id: 'username', label: 'Username' },
              { id: 'role', label: 'Authority' },
              { id: 'createdAt', label: 'Join Date' },
              { id: 'updatedAt', label: 'Last Sync' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleSortChange(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 border-2 border-black font-black text-[11px] uppercase tracking-widest transition-all
                  ${sortBy === tab.id 
                    ? 'bg-black text-white translate-x-1 -translate-y-1 shadow-[-4px_4px_0px_0px_rgba(253,224,71,1)]' 
                    : 'bg-white text-black hover:bg-zinc-100'}`}
              >
                {tab.label} {getSortIndicator(tab.id as any)}
              </button>
            ))}
          </div>
        </div>

        {/* User List */}
        <div className="grid gap-6">
          {sortedUsers.map((user) => {
            const isMe = currentUser && user._id === currentUser._id;
            const isOpen = selectedUserId === user._id;

            return (
              <div 
                key={user._id} 
                className={`border-2 border-black transition-all ${
                  isOpen ? 'bg-white' : 'bg-white hover:bg-zinc-100'
                } ${isMe ? 'ring-4 ring-yellow-400 ring-offset-2' : ''}`}
              >
                <div className="p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className="relative shrink-0">
                      <img
                        src={user.profileImage || defaultProfileImg}
                        alt={user.username}
                        className="w-16 h-16 border-2 border-black grayscale-[0.5]"
                      />
                      {isMe && (
                        <div className="absolute -top-2 -right-2 bg-yellow-400 border border-black p-1">
                          <UserCheck size={12} />
                        </div>
                      )}
                    </div>
                    
                    <div className="grow min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-xl font-black uppercase tracking-tight truncate">{user.username || 'N/A'}</h2>
                        {isMe && <span className="text-[9px] font-black bg-black text-white px-1.5 py-0.5">CURRENT_ADMIN</span>}
                      </div>
                      <p className="text-xs font-mono text-zinc-500 truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                    <div className="hidden sm:block text-right">
                      <p className="text-[9px] font-black uppercase text-zinc-400">Security_Role</p>
                      <p className="text-xs font-bold uppercase tracking-widest">{user.role}</p>
                    </div>
                    <button
                      onClick={() => handleViewProfile(user._id)}
                      className={`grow md:grow-0 px-6 py-3 font-black text-[10px] uppercase tracking-[0.2em] transition-all border-2 border-black
                        ${isOpen ? 'bg-black text-white' : 'bg-white text-black hover:bg-yellow-400 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}`}
                    >
                      {isOpen ? 'Close_File' : 'Open_Record'}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="p-4 md:p-8 bg-zinc-50 border-t-2 border-black animate-in slide-in-from-top-2 duration-200">
                    <UserProfileCard user={user} currentUser={currentUser} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default UsersManagementPage;