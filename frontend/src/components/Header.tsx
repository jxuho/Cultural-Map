import React from 'react';
import useUiStore from '../store/uiStore';
import { CgProfile } from 'react-icons/cg';
import { FaThList, FaMapMarkedAlt } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router';

type HeaderOption = 'accountManager' | 'toggleListView';

const Header: React.FC = () => {
  const isAccountManagerOpen = useUiStore(
    (state) => state.isAccountManagerOpen,
  );
  const openAccountManager = useUiStore((state) => state.openAccountManager);
  const closeAccountManager = useUiStore((state) => state.closeAccountManager);

  const navigate = useNavigate();
  const location = useLocation();

  const isNotRootPath = location.pathname !== '/';

  const headerButtonsClickHandler = (option: HeaderOption) => {
    switch (option) {
      case 'accountManager':
        if (isAccountManagerOpen) {
          closeAccountManager();
        } else {
          openAccountManager();
        }
        break;
      case 'toggleListView':
        if (isNotRootPath) {
          navigate('/');
        } else {
          navigate('/list');
        }
        break;
      default:
        break;
    }
  };

  return (
    <header className="flex flex-row justify-between items-center h-12 text-white bg-chemnitz-blue">
      <nav className="container mx-auto flex justify-between items-center relative">
        {/*List/map view switch button */}
        <div
          id="toggleListViewButton"
          className="flex justify-center items-center h-12 w-12 hover:bg-[#44a1bd] transition ease-in-out duration-100 hover:cursor-pointer"
          onClick={() => headerButtonsClickHandler('toggleListView')}
          title={isNotRootPath ? 'Go to Map View' : 'See All Cultural Sites'}
        >
          {isNotRootPath ? (
            <FaMapMarkedAlt size="20px" className="text-white" />
          ) : (
            <FaThList size="20px" className="text-white" />
          )}
        </div>

        {/*central logo */}
        <header className="absolute left-1/2 -translate-x-1/2">
          <a
            href="/"
            className="font-bold text-white hover:cursor-pointer text-base sm:text-lg md:text-xl lg:text-2xl whitespace-nowrap"
          >
            Cultural Heritage Map
          </a>
        </header>

        {/*Account Management Button */}
        <div className="flex items-center pr-4">
          <div
            id="accountManagerButton"
            className="flex justify-center items-center h-12 w-12 hover:bg-[#44a1bd] transition ease-in-out duration-100 hover:cursor-pointer"
            onClick={() => headerButtonsClickHandler('accountManager')}
            title="Account manager"
          >
            <CgProfile size="20px" className="text-white" />
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
