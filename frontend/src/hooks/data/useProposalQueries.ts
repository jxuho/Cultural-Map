import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  acceptProposal,
  fetchAllProposals,
  fetchMyProposals,
  rejectProposal,
  submitProposal,
} from '../../api/proposalApi';
import { Proposal } from '../../types/proposal';

// An interface assuming that the API response structure is usually in the form { data: { proposal: Proposal } }
interface ProposalResponse {
  data: {
    proposal: Proposal;
  };
  message?: string;
}

export const useSubmitProposal = () => {
  return useMutation({
    mutationFn: (newProposal: Partial<Proposal>) => submitProposal(newProposal),
    onSuccess: () => {
      console.log('Proposal submitted successfully!');
    },
    onError: (error: Error) => {
      console.error('Error submitting proposal:', error);
      throw error;
    },
  });
};

export const useProposals = () => {
  return useQuery<Proposal[], Error>({
    queryKey: ['proposals'],
    queryFn: fetchAllProposals,
    // From v5, staleTime, etc. can be adjusted in queryClient defaults or set here.
    staleTime: 1000 * 60,
  });
};

// Type definitions for mutation arguments
interface ModerationVariables {
  proposalId: string;
  actionType: 'accept' | 'reject';
  adminComment?: string;
}

export const useProposalModeration = () => {
  const queryClient = useQueryClient();

  return useMutation<ProposalResponse, Error, ModerationVariables>({
    mutationFn: async ({ proposalId, actionType, adminComment }) => {
      if (actionType === 'accept') {
        return acceptProposal(proposalId, adminComment);
      } else if (actionType === 'reject') {
        return rejectProposal(proposalId, adminComment);
      }
      throw new Error('Invalid proposal moderation action type.');
    },
    onSuccess: (data, variables) => {
      const { proposalId, actionType } = variables;
      console.log(`Proposal ${proposalId} ${actionType}ed successfully!`, data);

      // Invalidate suggestion list
      queryClient.invalidateQueries({ queryKey: ['proposals'] });

      // Update the list of cultural properties if a new creation proposal is approved.
      if (
        data?.data?.proposal?.proposalType === 'create' &&
        actionType === 'accept'
      ) {
        queryClient.invalidateQueries({ queryKey: ['culturalSites'] });
      }

      // If a proposal to modify a specific cultural property is approved, update the details of the cultural property
      if (actionType === 'accept' && data?.data?.proposal?.culturalSite) {
        queryClient.invalidateQueries({
          queryKey: ['culturalSite', data.data.proposal.culturalSite],
        });
      }

      alert(
        `Proposal is successfully ${actionType === 'accept' ? 'accepted' : 'rejected'}.`,
      );
    },
    onError: (error, variables) => {
      console.error(
        `Error ${variables.actionType}ing proposal ${variables.proposalId}:`,
        error,
      );
      alert(
        `Failed to process the ${variables.actionType} proposal: ${error.message || 'Unknown error'}`,
      );
    },
  });
};

export const useMyProposals = () => {
  return useQuery<Proposal[], Error>({
    queryKey: ['myProposals'],
    queryFn: fetchMyProposals,
    staleTime: 5 * 60 * 1000,
    // In TanStack Query v4/v5, cacheTime was renamed to gcTime.
    // If you are using v5, use gcTime.
    gcTime: 10 * 60 * 1000,
  });
};
