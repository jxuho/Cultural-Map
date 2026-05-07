import { http, HttpResponse } from 'msw';

const mockUsers = [
  {
    _id: 'user-1',
    username: 'max',
    email: 'user1@test.com',
    googleId: 'google-123',
    profileImage: '',
    role: 'user',
    bio: 'hello',
    favoriteSites: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'admin-1',
    username: 'admin',
    email: 'admin@test.com',
    googleId: 'google-234',
    profileImage: '',
    role: 'admin',
    bio: 'hello admin',
    favoriteSites: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const userHandlers = [
  // 1. Edit my profile
  http.patch('*/users/updateMe', async ({ request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json({
      status: 'success',
      data: { user: { ...mockUsers[0], ...body } },
    });
  }),

  // 2. Delete account
  http.delete('*/users/deleteMe', () => {
    return HttpResponse.json({
      status: 'success',
      message: 'Your account has been successfully deleted.',
    });
  }),

  // 3. Search for a specific user
  http.get('*/users/:userId', ({ params }) => {
    const { userId } = params;
    const user = mockUsers.find((u) => u._id === userId) || mockUsers[0];
    return HttpResponse.json({
      status: 'success',
      data: user,
    });
  }),

  // 4. View all users (Admin)
  http.get('*/users', () => {
    return HttpResponse.json({
      status: 'success',
      results: mockUsers.length,
      data: { users: mockUsers },
    });
  }),

  // 5. Modify user permissions (Admin)
  http.patch('*/users/updateRole/:userId', async ({ params, request }) => {
    const { userId } = params;
    const { newRole } = (await request.json()) as any;
    return HttpResponse.json({
      status: 'success',
      data: { user: { ...mockUsers[0], _id: userId, role: newRole } },
    });
  }),
];

(http.get('*/auth/refresh', ({ cookies }) => {
  // If refreshToken is not present in cookie or is 'loggedout', 401 is returned (reflects backend logic)
  if (!cookies.refreshToken || cookies.refreshToken === 'loggedout') {
    return new HttpResponse(null, { status: 401 });
  }

  return HttpResponse.json({
    status: 'success',
    accessToken: 'mock-access-token',
    data: { user: mockUsers[0] },
  });
}),
  http.post('*/auth/logout', () => {
    return HttpResponse.json({ status: 'success' });
  }));
