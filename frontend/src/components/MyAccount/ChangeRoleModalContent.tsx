import React, { useState } from 'react';
import useUiStore from '../../store/uiStore';
import { useUpdateUserRole } from '../../hooks/data/useUserQueries';
import { ShieldAlert, X, ChevronRight, Loader2, AlertCircle } from 'lucide-react';

export const ChangeRoleModalContent = ({ user }: { user: any }) => {
  const { closeModal } = useUiStore();
  const [selectedRole, setSelectedRole] = useState(user.role);
  const updateUserRoleMutation = useUpdateUserRole();

  const isPending = updateUserRoleMutation.isPending;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (selectedRole === user.role) {
      alert('Security Warning: No change in authorization level detected.');
      closeModal();
      return;
    }

    try {
      await updateUserRoleMutation.mutateAsync({
        userId: user._id,
        newRole: selectedRole,
      });
      closeModal();
    } catch (error) {
      console.error('Failed to change role in modal:', error);
    }
  };

  return (
    <div className="bg-white border-4 border-black p-0 max-w-md w-full overflow-hidden shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
      {/* MODAL HEADER */}
      <div className="bg-black text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert size={18} className="text-yellow-400" />
          <h2 className="text-xs font-black uppercase tracking-[0.2em]">
            Auth_Level_Modification
          </h2>
        </div>
        <button 
          onClick={closeModal} 
          className="hover:text-red-500 transition-colors"
          disabled={isPending}
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-6 md:p-8">
        <div className="mb-8">
          <p className="text-[10px] font-black uppercase text-zinc-400 mb-1">Target_Subject</p>
          <h3 className="text-2xl font-black uppercase tracking-tighter italic">
            "{user.username}"
          </h3>
        </div>

        {updateUserRoleMutation.isError && (
          <div className="mb-6 p-3 bg-red-100 border-2 border-red-600 flex items-start gap-2">
            <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
            <p className="text-[10px] font-bold text-red-600 leading-tight uppercase">
              CRITICAL_ERROR: {updateUserRoleMutation.error.message || 'Access modification failed.'}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <label
              htmlFor="role-select"
              className="block text-[10px] font-black uppercase tracking-widest text-zinc-500"
            >
              Assign_New_Clearance
            </label>
            
            <div className="relative group">
              <select
                id="role-select"
                className={`
                  w-full appearance-none bg-white border-4 border-black p-4 
                  text-sm font-black uppercase tracking-widest outline-none
                  transition-all cursor-pointer
                  ${isPending ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-50 focus:bg-yellow-50'}
                `}
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                disabled={isPending}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none group-hover:translate-x-1 transition-transform">
                <ChevronRight size={20} strokeWidth={3} />
              </div>
            </div>
            
            <p className="text-[9px] font-medium text-zinc-400 leading-relaxed italic">
              * Caution: Elevating or demoting clearance levels will be logged in the permanent system audit trail.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t-2 border-zinc-100">
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 border-2 border-black py-3 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-100 transition-colors disabled:opacity-30"
              disabled={isPending}
            >
              Abort
            </button>
            <button
              type="submit"
              className={`
                flex-[2] py-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all
                ${selectedRole === user.role 
                  ? 'bg-zinc-200 text-zinc-400 border-2 border-zinc-200 cursor-not-allowed' 
                  : 'bg-black text-white border-2 border-black hover:bg-green-600 hover:border-green-600'}
              `}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Updating_Registry...
                </>
              ) : (
                'Commit_Changes'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* FOOTER BAR */}
      <div className="bg-zinc-50 px-6 py-2 border-t-2 border-black flex justify-between">
        <span className="text-[8px] font-mono font-bold text-zinc-400">SESSION_ID: {Math.random().toString(36).substring(7).toUpperCase()}</span>
        <span className="text-[8px] font-mono font-bold text-zinc-400 tracking-tighter">THE_BERLIN_ARCHIVE_CORE</span>
      </div>
    </div>
  );
};