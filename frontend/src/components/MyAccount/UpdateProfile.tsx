import { useState } from 'react';
import { useNavigate } from 'react-router';
import defaultProfileImg from '../../assets/profile_image.svg';
import useAuthStore from '../../store/authStore';
import BackButton from '../BackButton';
import { useUpdateProfile } from '../../hooks/data/useUserQueries';
import { User } from '@/types/user';

const UpdateProfile = () => {
  const nameRegex = /^(?!^\d+$)[\p{L}][\p{L}\p{N}\s.'-]*$/u;
  const USERNAME_MAX_LENGTH = 20;
  const BIO_MAX_LENGTH = 200;

  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const navigate = useNavigate();

  const [userName, setUserName] = useState<string>(user?.username ?? '');
  const [nameMessage, setNameMessage] = useState('');
  const [bio, setBio] = useState<string>(user?.bio ?? '');
  const [bioMessage, setBioMessage] = useState('');

  const [showMessage, setShowMessage] = useState({
    showNameMessage: false,
    showBioMessage: false,
    changeSuccess: false,
    apiError: false,
    apiErrorMessage: '',
  });

  const updateProfileMutation = useUpdateProfile();

  const nameInputHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setUserName(inputValue);
    setShowMessage((p) => ({ ...p, showNameMessage: false }));
    if (inputValue.trim() === '') {
      setNameMessage('Username is required.');
      setShowMessage((p) => ({ ...p, showNameMessage: true }));
    }
  };

  const bioInputHandler = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const inputValue = e.target.value;
    setBio(inputValue);
    setShowMessage((p) => ({ ...p, showBioMessage: false }));
    if (inputValue.length > BIO_MAX_LENGTH) {
      setBioMessage(`Bio must be under ${BIO_MAX_LENGTH} characters.`);
      setShowMessage((p) => ({ ...p, showBioMessage: true }));
    }
  };

  const submitUpdateProfileHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let isValid = true;

    // Validation Logic (Username)
    if (userName.trim() === '' || !nameRegex.test(userName)) {
      setNameMessage("Invalid username format.");
      setShowMessage((p) => ({ ...p, showNameMessage: true }));
      isValid = false;
    }

    if (!isValid) return;

    const updateData: Partial<User> = {};
    if (userName !== user?.username) updateData.username = userName;
    if (bio !== user?.bio) updateData.bio = bio;

    if (Object.keys(updateData).length === 0) {
      setShowMessage((p) => ({ ...p, changeSuccess: true }));
      return;
    }

    try {
      const data = await updateProfileMutation.mutateAsync(updateData);
      updateUser(data.data.user);
      setShowMessage((p) => ({ ...p, changeSuccess: true, apiError: false }));
    } catch (error: any) {
      setShowMessage((p) => ({ 
        ...p, 
        apiError: true, 
        apiErrorMessage: error.message || 'Update failed.' 
      }));
    }
  };

  const inputBase = "w-full p-3 border-2 border-black font-mono text-sm focus:bg-zinc-50 outline-none transition-colors rounded-none";
  const labelBase = "block text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-black";

  // --- Success State ---
  if (showMessage.changeSuccess) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full border-2 border-black bg-white p-8 animate-in fade-in zoom-in duration-300">
          <div className="inline-block bg-black text-white px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.2em] mb-6">
            System Message
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-4">Update <br/>Complete</h1>
          <p className="font-mono text-xs text-gray-500 mb-8">
            User records for <span className="text-black font-bold">@{userName}</span> have been successfully synchronized with the archive.
          </p>
          <button
            className="w-full py-4 bg-black text-white font-black uppercase text-xs tracking-[0.3em] hover:bg-zinc-800 transition-colors cursor-pointer"
            onClick={() => navigate('/my-account')}
          >
            Acknowledge & Return
          </button>
        </div>
      </div>
    );
  }

  // --- Main Form State ---
  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12">
      <div className="mb-12 flex items-center justify-between">
        <BackButton />
        <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
          Auth_Ref: {user?._id?.slice(-8) ?? 'NULL'}
        </div>
      </div>

      <header className="mb-12">
        <div className="inline-block bg-black text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
          Record Modification
        </div>
        <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-none">
          Edit <br /> Profile
        </h1>
      </header>

      <form onSubmit={submitUpdateProfileHandler} className="grid grid-cols-1 md:grid-cols-12 gap-12">
        {/* Left: Avatar */}
        <div className="md:col-span-4 flex flex-col items-center">
          <div className="w-32 h-32 border-2 border-black p-1 bg-white relative group">
            <img
              src={user?.profileImage || defaultProfileImg}
              alt="Avatar"
              className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all"
            />
            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-[8px] font-black text-white uppercase bg-black px-1">Static</span>
            </div>
          </div>
          <p className="mt-4 font-mono text-[9px] text-gray-400 text-center uppercase tracking-tighter">
            Profile images are <br/>managed via provider
          </p>
        </div>

        {/* Right: Fields */}
        <div className="md:col-span-8 space-y-8">
          {/* Username */}
          <div>
            <label htmlFor="userName" className={labelBase}>Username ID</label>
            <input
              id="userName"
              value={userName}
              onChange={nameInputHandler}
              className={`${inputBase} ${showMessage.showNameMessage ? 'border-red-500 bg-red-50' : ''}`}
              placeholder="ENTRY_NAME"
            />
            {showMessage.showNameMessage && (
              <p className="mt-2 text-[10px] font-bold text-red-500 uppercase font-mono italic">! {nameMessage}</p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className={labelBase}>User Biography</label>
            <textarea
              id="bio"
              value={bio}
              onChange={bioInputHandler}
              rows={5}
              className={`${inputBase} ${showMessage.showBioMessage ? 'border-red-500 bg-red-50' : ''} resize-none`}
              placeholder="Tell us about your connection to Berlin culture..."
            />
            <div className="flex justify-between mt-2">
              <p className="text-[10px] font-mono text-gray-400 uppercase">
                {showMessage.showBioMessage ? (
                  <span className="text-red-500 font-bold">Overflow Error</span>
                ) : (
                  "Data String Length"
                )}
              </p>
              <p className={`text-[10px] font-mono ${bio.length > BIO_MAX_LENGTH ? 'text-red-500' : 'text-gray-400'}`}>
                {bio.length}/{BIO_MAX_LENGTH}
              </p>
            </div>
          </div>

          {showMessage.apiError && (
            <div className="p-4 border-2 border-red-500 bg-red-50 text-red-600 font-mono text-[10px] uppercase">
              CRITICAL_API_ERROR: {showMessage.apiErrorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="w-full md:w-auto px-12 py-4 bg-black text-white font-black uppercase text-xs tracking-[0.3em] hover:bg-zinc-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
          >
            {updateProfileMutation.isPending ? 'Syncing...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateProfile;