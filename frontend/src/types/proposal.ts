export type ProposalType = 'create' | 'update' | 'reject';
export type ProposalStatus = 'pending' | 'accepted' | 'rejected';

export interface Proposal {
  _id: string;
  culturalSite?: any;
  proposedBy: any;
  proposalType: ProposalType;

  proposedChanges: {
    name?: string;
    category?: string;
    location?: {
      type: 'Point';
      coordinates: [number, number];
    };
    sourceId?: string;
    originalTags?: Record<string, any>;
    [key: string]: any;
  };

  proposalMessage?: string;
  status: ProposalStatus;
  reviewedBy?: string;
  adminComment?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}
