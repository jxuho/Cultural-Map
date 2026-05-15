import { User } from '@/types/user';
import defaultProfileImg from '../../assets/profile_image.svg';
import useUiStore from '../../store/uiStore';
import { ChangeRoleModalContent } from './ChangeRoleModalContent';
import { Fingerprint, ShieldAlert, Calendar, History, Heart } from 'lucide-react';

interface UserProfileCardProps {
  user: User;
  currentUser: User | null;
}

const UserProfileCard = ({ user }: UserProfileCardProps) => {
  const { openModal } = useUiStore();

  const {
    _id,
    username = 'N/A',
    email = 'N/A',
    profileImage,
    role = 'user',
    googleId,
    bio = '',
    favoriteSites = [],
    createdAt,
    updatedAt,
  } = user;

  const handleRoleClick = () => {
    openModal(<ChangeRoleModalContent user={user} />);
  };

  return (
    <div className="max-w-xl mx-auto bg-white border-2 border-black p-0 mt-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
      {/* CARD HEADER - IDENTITY SECTION */}
      <div className="bg-black text-white p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative shrink-0">
          <img
            src={profileImage || defaultProfileImg}
            alt={`${username}'s profile`}
            className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-white object-cover bg-zinc-200 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]"
          />
          <div className="absolute -bottom-2 -right-2 bg-yellow-400 border-2 border-black p-1.5 text-black">
            <Fingerprint size={20} />
          </div>
        </div>
        
        <div className="grow min-w-0 text-center sm:text-left">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter leading-none mb-2 break-words">
            {username}
          </h2>
          <p className="text-sm font-mono text-zinc-400 mb-3 break-all">{email}</p>
          <div className="inline-flex items-center gap-2 bg-white text-black px-3 py-1 border-2 border-black cursor-pointer hover:bg-yellow-400 transition-colors" onClick={handleRoleClick}>
            <ShieldAlert size={14} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{role}</span>
          </div>
        </div>
      </div>

      {/* METADATA GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 border-b-2 border-black">
        <div className="p-5 border-b-2 sm:border-b-0 sm:border-r-2 border-black bg-zinc-50">
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1 italic underline decoration-zinc-300">Archive_ID</p>
          <p className="font-mono text-[11px] break-all leading-tight">HEX_{_id.slice(-12).toUpperCase()}</p>
          {googleId && (
            <p className="font-mono text-[10px] text-zinc-400 mt-1 truncate">G_AUTH: {googleId.slice(0, 10)}...</p>
          )}
        </div>
        <div className="p-5 flex items-center justify-between bg-white group hover:bg-black hover:text-white transition-colors">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1 italic">Favorites_Count</p>
            <p className="text-2xl font-black tracking-tighter leading-none">{favoriteSites.length}</p>
          </div>
          <Heart size={24} className="group-hover:fill-red-500 transition-colors" strokeWidth={3} />
        </div>
      </div>

      {/* CHRONOLOGY SECTION */}
      <div className="p-6 border-b-2 border-black">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <Calendar size={18} className="mt-1 shrink-0" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 italic">Initial_Registration</p>
              <p className="text-sm font-bold uppercase leading-none mt-1">
                {createdAt ? new Date(createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '---'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <History size={18} className="mt-1 shrink-0" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 italic">Record_Synchronized</p>
              <p className="text-sm font-bold uppercase leading-none mt-1">
                {updatedAt ? new Date(updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '---'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* BIOGRAPHY SECTION */}
      <div className="p-6 bg-zinc-50 relative overflow-hidden">
        {/* Background Decorative Text */}
        <span className="absolute -bottom-4 -right-4 text-7xl font-black text-black/5 pointer-events-none select-none uppercase tracking-tighter">
          Bio
        </span>
        
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-black mb-3 flex items-center gap-2">
          <div className="w-8 h-[2px] bg-black"></div> Personal_Statement
        </h3>
        <p className="text-sm font-medium italic leading-relaxed text-zinc-700 relative z-10 whitespace-pre-line border-l-2 border-zinc-200 pl-4 py-1">
          {bio.trim() !== '' ? bio : 'Identity statement remains unfiled. Profile verification incomplete.'}
        </p>
      </div>

      {/* FOOTER - AUTHENTICITY BAR */}
      <div className="bg-zinc-100 px-6 py-2 border-t border-zinc-200 flex justify-between items-center">
        <span className="text-[8px] font-mono font-bold text-zinc-400">STATUS: VERIFIED_RECORD</span>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 bg-black"></div>
          <div className="w-1.5 h-1.5 bg-black/40"></div>
          <div className="w-1.5 h-1.5 bg-black/10"></div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileCard;