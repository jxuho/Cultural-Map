import { Routes, Route } from 'react-router';
import { useEffect, lazy, Suspense } from 'react'; // lazy, Suspense 추가
import useAuthStore from './store/authStore';

import MainLayout from './layouts/MainLayout';
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import Modal from './components/Modal';

const HomePage = lazy(() => import('./pages/HomePage'));
const SignInPage = lazy(() => import('./pages/SignInPage'));
const MyAccountPage = lazy(() => import('./pages/MyAccountPage'));
const ListPage = lazy(() => import('./pages/ListPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const ProfileView = lazy(() => import('./components/MyAccount/ProfileView'));
const UpdateProfile = lazy(
  () => import('./components/MyAccount/UpdateProfile'),
);
const MyReviews = lazy(() => import('./components/MyAccount/MyReviews'));
const FavoriteSites = lazy(
  () => import('./components/MyAccount/FavoriteSites'),
);
const Proposals = lazy(() => import('./components/MyAccount/Proposals'));
const DeleteAccount = lazy(
  () => import('./components/MyAccount/DeleteAccount'),
);
const UsersManagementPage = lazy(
  () => import('./components/MyAccount/UsersManagementPage'),
);
const MyProposalsList = lazy(
  () => import('./components/MyAccount/MyProposalsList'),
);

const App = () => {
  const checkAuthStatus = useAuthStore((state) => state.checkAuthStatus);
  const loading = useAuthStore((state) => state.loading);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Modal />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/sign-in" element={<SignInPage />} />

          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="list" element={<ListPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="my-account" element={<MyAccountPage />}>
                <Route index element={<ProfileView />} />
                <Route path="update-profile" element={<UpdateProfile />} />
                <Route path="reviews" element={<MyReviews />} />
                <Route path="favorite-sites" element={<FavoriteSites />} />
                <Route path="delete-account" element={<DeleteAccount />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute requiredRole="user" />}>
              <Route
                path="/my-account/my-proposals"
                element={<MyProposalsList />}
              />
            </Route>

            <Route element={<ProtectedRoute requiredRole="admin" />}>
              <Route path="/my-account/proposals" element={<Proposals />} />
              <Route
                path="/my-account/users"
                element={<UsersManagementPage />}
              />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
};

export default App;
