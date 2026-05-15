import { useLocation } from 'react-router';

const Footer = () => {
  const location = useLocation();
  const isMapPage = location.pathname === '/';

  if (isMapPage) return null;

  return (
    <footer className="w-full bg-white border-t border-black py-8 px-8 shrink-0">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-end gap-6">
        {/* Left Side: Brand & Identity */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-black" /> {/* Bauhaus dot */}
            <span className="text-[11px] font-black uppercase tracking-[0.3em]">
              Berlin Heritage Map
            </span>
          </div>
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest leading-relaxed max-w-[300px]">
            A digital archive dedicated to preserving and exploring the cultural
            landscape of Berlin.
          </p>
        </div>

        {/* Right Side: Legal & Data Credits */}
        <div className="flex flex-col items-end gap-1 font-mono">
          <div className="text-[9px] text-gray-500 uppercase tracking-tighter">
            Data provided by:
          </div>
          <div className="flex flex-wrap justify-end gap-x-3 gap-y-1 text-[10px] font-bold uppercase text-black">
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener"
              className="hover:line-through"
            >
              OpenStreetMap
            </a>
            <span className="text-gray-300">/</span>
            <span className="hover:line-through cursor-help">Nominatim</span>
            <span className="text-gray-300">/</span>
            <span className="hover:line-through cursor-help">Overpass API</span>
          </div>
          <div className="text-[9px] text-gray-400 mt-2 tracking-widest">
            &copy; {new Date().getFullYear()} ARCHIVE BERLIN. ALL RIGHTS
            RESERVED.
          </div>
        </div>
      </div>

      {/* Decorative Bauhaus Line */}
      <div className="mt-8 h-[1px] w-full bg-gray-100" />
    </footer>
  );
};

export default Footer;
