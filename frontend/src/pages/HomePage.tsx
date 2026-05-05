import MapComponent from '../components/Map/MapComponent.jsx';
import SidePanel from '../components/SidePanel/SidePanel.jsx';
import FilterPanel from '../components/Filter/FilterPanel.jsx';
import MapContextMenu from '../components/Map/MapContextMenu.jsx';

const HomePage = () => {
  return (
    <>
      <MapComponent />
      <div className="absolute top-4 left-4 z-20">
        <FilterPanel />
      </div>
      <SidePanel />
      <MapContextMenu />
    </>
  );
};

export default HomePage;
