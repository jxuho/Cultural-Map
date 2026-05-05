import { http, HttpResponse } from 'msw';

const createMockSite = (id: string, name: string) => ({
  _id: id,
  name: name,
  description: `This is an explanation of the ${name}.`,
  category: 'artwork',
  location: {
    type: 'Point',
    coordinates: [126.9774, 37.5663],
  },
  address: 'Chemnitz address example',
  favoritesCount: 1,
  averageRating: 4.5, // Fields added by Aggregation
  reviewCount: 10, // Fields added by Aggregation
});

let mockFavorites = [createMockSite('site-123', 'ABC Historic Site')];

export const favoriteHandlers = [
  // [GET] View favorites list
  http.get('*/users/me/favorites', () => {
    return HttpResponse.json({
      status: 'success',
      results: mockFavorites.length,
      data: {
        favoriteSites: mockFavorites,
      },
    });
  }),

  // [POST] Add to favorites
  http.post('*/users/me/favorites/:siteId', ({ params }) => {
    const { siteId } = params as { siteId: string };
    const newSite = createMockSite(siteId, 'new historic site');

    // Fake status updates in test environment (optional)
    mockFavorites.push(newSite);

    return HttpResponse.json({
      status: 'success',
      message: 'Successfully added.',
      data: {
        user: { _id: 'user-1', favoriteSites: mockFavorites.map((s) => s._id) },
        culturalSite: newSite,
        // IMPORTANT: Frontend api/favoriteApi.ts references this path
        favoriteSites: mockFavorites,
      },
    });
  }),

  // [DELETE] Delete favorites
  http.delete('*/users/me/favorites/:siteId', ({ params }) => {
    const { siteId } = params as { siteId: string };
    mockFavorites = mockFavorites.filter((s) => s._id !== siteId);

    return HttpResponse.json({
      status: 'success',
      message: 'Successfully removed.',
      data: {
        user: { _id: 'user-1', favoriteSites: mockFavorites.map((s) => s._id) },
      },
    });
  }),
];
