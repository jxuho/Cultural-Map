import { Outlet } from 'react-router';
import GoToTopButton from '../components/GoToTopButton';

const MyAccountPage = () => {
  return (
    <div className="w-full h-full p-4 md:p-12 mx-auto max-w-420 overflow-auto">
      <Outlet />
      <GoToTopButton />
    </div>
  );
};

export default MyAccountPage;
