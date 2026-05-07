import { lazy, Suspense } from 'react';

import SidePanel from '../components/SidePanel/SidePanel.jsx';
import FilterPanel from '../components/Filter/FilterPanel.jsx';
import MapContextMenu from '../components/Map/MapContextMenu.jsx';
import LoadingSpinner from '../components/LoadingSpinner';

const MapComponent = lazy(() => import('../components/Map/MapComponent.jsx'));

const HomePage = () => {
  return (
    <>
      <Suspense
        fallback={
          <div className="h-full w-full flex items-center justify-center bg-gray-50">
            <LoadingSpinner />
            <p className="ml-2 text-gray-500">Loading Map Engine...</p>
          </div>
        }
      >
        <MapComponent />
      </Suspense>

      <div className="absolute top-4 left-4 z-20">
        <FilterPanel />
      </div>
      <SidePanel />
      <MapContextMenu />
    </>
  );
};

export default HomePage;
