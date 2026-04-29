import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import ProtectedRoute from './ProtectedRoute';
import useAuthStore from '../store/authStore';

// useAuthStore is mocked to control the authentication state in tests.
vi.mock('../store/authStore', () => ({
  default: vi.fn(),
}));

describe('ProtectedRoute', () => {
  const MockChild = () => <div>Protected Content</div>;
  const SignInPage = () => <div>Sign In Page</div>;
  const HomePage = () => <div>Home Page</div>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Utility functions: configure rendering for different situations
  const renderWithRouter = (props = {}, route = '/protected') => {
    return render(
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute {...props}>
                <MockChild />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );
  };

  test('Show loading spinner when loading', () => {
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: false,
      loading: true,
      user: null,
    });

    renderWithRouter();
    // Assuming that there is 'loading-spinner' or a specific text inside the LoadingSpinner
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('Redirect unauthenticated users to /sign-in', () => {
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: false,
      loading: false,
      user: null,
    });

    renderWithRouter();
    expect(screen.getByText('Sign In Page')).toBeInTheDocument();
  });

  test('If the required role does not match, you will be redirected to home.', () => {
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { role: 'user' },
    });

    renderWithRouter({ requiredRole: 'admin' });
    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });

  test('If authenticated and the roles match, render the child component.', () => {
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { role: 'admin' },
    });

    renderWithRouter({ requiredRole: 'admin' });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  test('If there are no role restrictions, the child is rendered once authenticated.', () => {
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { role: 'user' },
    });

    renderWithRouter(); // no requiredRole 
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});