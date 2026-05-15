import { MdKeyboardArrowRight } from 'react-icons/md';
import {
  PiUserCircleThin,
  PiTrashThin,
  PiMapPinLineThin,
  PiChatCircleTextThin,
  PiClipboardTextThin,
  PiUsersThreeThin,
  PiFileTextThin,
} from 'react-icons/pi';
import useAuthStore from '../../store/authStore';
import useUiStore from '../../store/uiStore';
import defaultProfileImg from '../../assets/profile_image.svg';
import { Link } from 'react-router';

const ProfileView = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { openModal, closeModal } = useUiStore();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] font-mono uppercase tracking-widest text-xs">
        Accessing User Records...
      </div>
    );
  }

  const signOutHandler = () => {
    openModal(
      <div className="p-4 border-2 border-black bg-white">
        <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Sign Out?</h3>
        <p className="text-sm font-mono text-gray-600 mb-6">Are you sure you want to terminate the current session?</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              closeModal();
              logout();
              window.location.reload();
            }}
            className="flex-1 py-2 bg-black text-white font-black uppercase text-xs tracking-widest hover:bg-red-600 transition-colors cursor-pointer"
          >
            Confirm
          </button>
          <button onClick={closeModal} className="flex-1 py-2 border-2 border-black font-black uppercase text-xs tracking-widest hover:bg-gray-100 cursor-pointer">
            Cancel
          </button>
        </div>
      </div>,
    );
  };

  const cardClass = "group flex flex-col justify-between p-6 bg-white border-2 border-black transition-all hover:bg-zinc-50 relative overflow-hidden";
  const iconClass = "text-black mb-4 transition-transform group-hover:scale-110 duration-300";
  const titleClass = "text-2xl font-black uppercase tracking-tighter mb-1";
  const linkClass = "mt-8 pt-4 border-t-2 border-black flex items-center justify-between font-black uppercase text-[10px] tracking-[0.2em] group-hover:text-black transition-colors";

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto">
      {/* Page Header */}
      <header className="mb-12 space-y-2">
        <div className="inline-block bg-black text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em]">
          Account Dashboard
        </div>
        <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-none">
          User <br /> Profile
        </h1>
      </header>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        
        {/* 1. Main Profile Card (Tall) */}
        <div className={`${cardClass} md:row-span-2 bg-white`}>
          <div className="flex flex-col items-center py-8">
            <div className="w-24 h-24 border-2 border-black overflow-hidden mb-6">
              <img 
                className="w-full h-full object-cover" 
                src={user.profileImage || defaultProfileImg} 
                alt="profile" 
              />
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-black uppercase tracking-tighter leading-tight break-all">
                {user.username || user.email.split('@')[0]}
              </h2>
              <p className="font-mono text-[10px] text-gray-500">{user.email}</p>
            </div>
            {user.bio && (
              <p className="mt-6 text-center text-xs font-mono text-gray-400 italic px-4">
                "{user.bio}"
              </p>
            )}
            <div className="mt-8 px-3 py-1 border border-black text-[9px] font-black uppercase tracking-widest">
              Role: {user.role}
            </div>
          </div>
          
          <button
            onClick={signOutHandler}
            className="mt-12 w-full py-3 bg-black text-white font-black uppercase text-[10px] tracking-[0.3em] hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Terminate Session
          </button>
        </div>

        {/* 2. Update Profile */}
        <div className={cardClass}>
          <div>
            <PiUserCircleThin size={48} className={iconClass} />
            <h3 className={titleClass}>Records</h3>
            <p className="text-xs font-mono text-gray-500">Update personal archival information.</p>
          </div>
          <Link to="update-profile" className={linkClass}>
            Edit Profile <MdKeyboardArrowRight size={18} />
          </Link>
        </div>

        {/* 3. Favorite Sites */}
        <div className={cardClass}>
          <div>
            <PiMapPinLineThin size={48} className={iconClass} />
            <h3 className={titleClass}>Saved</h3>
            <p className="text-xs font-mono text-gray-500">Review your bookmarked cultural sites.</p>
          </div>
          <Link to="favorite-sites" className={linkClass}>
            View Favorites <MdKeyboardArrowRight size={18} />
          </Link>
        </div>

        {/* 4. Reviews */}
        <div className={cardClass}>
          <div>
            <PiChatCircleTextThin size={48} className={iconClass} />
            <h3 className={titleClass}>Reviews</h3>
            <p className="text-xs font-mono text-gray-500">History of submitted community feedback.</p>
          </div>
          <Link to="reviews" className={linkClass}>
            Check Logs <MdKeyboardArrowRight size={18} />
          </Link>
        </div>

        {/* 5. User: Proposals / Admin: Management (Conditional) */}
        {user.role === 'user' ? (
          <div className={cardClass}>
            <div>
              <PiFileTextThin size={48} className={iconClass} />
              <h3 className={titleClass}>Proposals</h3>
              <p className="text-xs font-mono text-gray-500">View your submitted site records.</p>
            </div>
            <Link to="my-proposals" className={linkClass}>
              My Entries <MdKeyboardArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <>
            <div className={cardClass}>
              <div>
                <PiClipboardTextThin size={48} className={iconClass} />
                <h3 className={titleClass}>Inbox</h3>
                <p className="text-xs font-mono text-gray-500">Review pending user proposals.</p>
              </div>
              <Link to="proposals" className={linkClass}>
                Manage Submissions <MdKeyboardArrowRight size={18} />
              </Link>
            </div>
            <div className={cardClass}>
              <div>
                <PiUsersThreeThin size={48} className={iconClass} />
                <h3 className={titleClass}>Access</h3>
                <p className="text-xs font-mono text-gray-500">Database user management panel.</p>
              </div>
              <Link to="users" className={linkClass}>
                User Directory <MdKeyboardArrowRight size={18} />
              </Link>
            </div>
          </>
        )}

        {/* 6. Delete Account (Danger Zone) */}
        <div className={`${cardClass} border-red-500 hover:bg-red-50`}>
          <div>
            <PiTrashThin size={48} className="text-red-500 mb-4" />
            <h3 className={`${titleClass} text-red-500`}>Purge</h3>
            <p className="text-xs font-mono text-red-400">Permanently erase account from archive.</p>
          </div>
          <Link to="delete-account" className={`${linkClass} border-red-500 text-red-500`}>
            Delete Account <MdKeyboardArrowRight size={18} />
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ProfileView;