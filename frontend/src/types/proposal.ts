export type ProposalType = 'create' | 'update' | 'reject'; // 모델의 enum 반영
export type ProposalStatus = 'pending' | 'accepted' | 'rejected';

export interface Proposal {
  _id: string;
  culturalSite?: string; // create일 때는 없을 수 있음
  proposedBy: string;    // User ID
  proposalType: ProposalType;
  
  // Mixed 타입을 위한 정의: 상황에 따라 다른 구조를 가짐
  proposedChanges: {
    name?: string;
    category?: string;
    location?: {
      type: 'Point';
      coordinates: [number, number];
    };
    sourceId?: string;
    originalTags?: Record<string, any>;
    // update일 경우 { oldValue, newValue } 구조를 가질 수 있음
    [key: string]: any; 
  };

  proposalMessage?: string;
  status: ProposalStatus;
  reviewedBy?: string;   // Admin ID
  adminComment?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}