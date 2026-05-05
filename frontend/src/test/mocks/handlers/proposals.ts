import { http, HttpResponse } from 'msw';

const mockProposals = [
  {
    _id: 'prop-1',
    proposalType: 'create',
    proposedBy: 'user-1',
    status: 'pending',
    proposedChanges: { name: 'New Cultural Site', category: 'palace' },
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'prop-2',
    culturalSite: 'site-123',
    proposalType: 'update',
    proposedBy: 'user-1',
    status: 'pending',
    proposedChanges: { name: { oldValue: 'Old Name', newValue: 'New Name' } },
    createdAt: new Date().toISOString(),
  },
];

export const proposalHandlers = [
  // 1. View all proposal list (Admin)
  http.get('*/proposals', () => {
    return HttpResponse.json({
      status: 'success',
      data: { proposals: mockProposals },
    });
  }),

  // 2. View my suggestion list
  http.get('*/proposals/my-proposals', () => {
    return HttpResponse.json({
      status: 'success',
      data: { proposals: [mockProposals[0]] },
    });
  }),

  // 3. Submit proposal
  http.post('*/proposals', async ({ request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json(
      {
        status: 'success',
        data: { proposal: { ...body, _id: 'new-prop', status: 'pending' } },
      },
      { status: 201 },
    );
  }),

  // 4. Accept/reject proposal (Patch)
  http.patch('*/proposals/:id/:action', ({ params }) => {
    const { id, action } = params;
    const status = action === 'accept' ? 'accepted' : 'rejected';

    return HttpResponse.json({
      status: 'success',
      data: {
        proposal: {
          _id: id,
          status,
          proposalType: 'create', // Fixed value for testing
          culturalSite: 'site-123',
        },
      },
    });
  }),
];
