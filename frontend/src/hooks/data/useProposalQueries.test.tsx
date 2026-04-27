import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createWrapper } from '../../test/test-utils';
import { 
  useSubmitProposal, 
  useProposals, 
  useProposalModeration, 
  useMyProposals 
} from './useProposalQueries';

// Mocking global alerts
window.alert = vi.fn();

describe('useProposalQueries', () => {
  
  describe('useProposals & useMyProposals (get)', () => {
    it('Administrator can get a list of all suggestions', async () => {
      const { result } = renderHook(() => useProposals(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0]._id).toBe('prop-1');
    });

    it('User can only get their own proposal list', async () => {
      const { result } = renderHook(() => useMyProposals(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toHaveLength(1);
    });
  });

  describe('useSubmitProposal (Submit Proposal)', () => {
    it('should successfully submit a new proposal', async () => {
      const { result } = renderHook(() => useSubmitProposal(), {
        wrapper: createWrapper(),
      });

      const newProposal = {
        proposalType: 'create',
        proposedChanges: { name: '테스트 유적지', category: 'temple' }
      } as const;

      await result.current.mutateAsync(newProposal);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.status).toBe('success');
    });
  });

  describe('useProposalModeration (Approve/Rejectt/Reject)', () => {
    it('should show an alert and return success data when a proposal is accepted', async () => {
      const { result } = renderHook(() => useProposalModeration(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        proposalId: 'prop-1',
        actionType: 'accept',
        adminComment: 'I approve.'
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('successfully accepted'));
    });

    it('should update the proposal status to rejected when it is rejected', async () => {
      const { result } = renderHook(() => useProposalModeration(), {
        wrapper: createWrapper(),
      });

      const response = await result.current.mutateAsync({
        proposalId: 'prop-1',
        actionType: 'reject',
        adminComment: 'Reason for nonconformity not suitable'
      });

      expect(response.data.proposal.status).toBe('rejected');
    });
  });
});