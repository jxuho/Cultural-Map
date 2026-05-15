import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router';
import {
  FaThList,
  FaMapMarkedAlt,
  FaBookmark,
  FaUserCircle,
  FaUserCog,
  FaArrowRight,
} from 'react-icons/fa';
import { Menu, X } from 'lucide-react';
import useUiStore from '../store/uiStore';
import useAuthStore from '../store/authStore';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { user, logout, isAuthenticated } = useAuthStore();
  const { openAccountManager } = useUiStore();

  const navItems = [
    { label: 'Map Explorer', path: '/', icon: <FaMapMarkedAlt /> },
    { label: 'The Archives', path: '/list', icon: <FaThList /> },
  ];

  /**
   * [UX 개선] 뷰포트가 md(768px) 미만일 때
   * 프로필 버튼을 클릭하면 드롭다운 대신 바로 설정 페이지로 이동
   */
  const handleProfileClick = (e: React.MouseEvent) => {
    if (window.innerWidth < 768) {
      e.preventDefault();
      setIsMobileMenuOpen(false); // 메뉴가 열려있다면 닫기
      navigate('/my-account');
    }
  };

  return (
    <header className="sticky top-0 z-[100] w-full bg-white/80 backdrop-blur-md border-b border-black font-sans">
      {/* Bauhaus Accent Bar */}
      <div className="h-[1px] w-full flex bg-gray-200">
        <div className="h-full w-1/3 bg-black/10" />
        <div className="h-full w-1/3 bg-red-600/10" />
        <div className="h-full w-1/3 bg-amber-500/10" />
      </div>

      <div className="container mx-auto h-20 flex items-center justify-between px-6 md:px-8 relative">
        {/* [Left] Mobile Menu Toggle */}
        <div className="flex md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-black p-2 hover:bg-gray-100 transition-colors"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* [Left] Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-10">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative group flex items-center gap-2 transition-colors duration-300 ${
                  isActive ? 'text-black' : 'text-gray-400 hover:text-black'
                }`}
              >
                <span className="text-[10px] lg:text-[11px] uppercase tracking-[0.2em] lg:tracking-[0.25em] font-black">
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute -bottom-1 left-0 w-4 h-[2px] bg-black" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* [Center] Brand Identity: BERLIN HERITAGE */}
        <Link
          to="/"
          className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center group whitespace-nowrap"
        >
          <div className="flex flex-col items-center">
            <span className="text-xl md:text-3xl font-black tracking-[-0.05em] leading-none text-black">
              BERLIN
              <span className="font-light italic text-gray-400">HERITAGE</span>
            </span>
            <span className="text-[9px] tracking-[0.6em] font-medium text-gray-500 uppercase mt-1.5 ml-1">
              Digital Collection
            </span>
          </div>
        </Link>

        {/* [Right] User Interaction Area */}
        <div className="flex items-center">
          {isAuthenticated ? (
            <div className="relative group">
              {/* 프로필 버튼: 모바일 클릭 시 /my-account 이동 */}
              <button
                onClick={handleProfileClick}
                className="flex items-center gap-2 md:gap-3 py-2 group cursor-pointer outline-none"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">
                    {user?.role || 'Explorer'}
                  </p>
                  <p className="text-[11px] font-bold text-black uppercase tracking-tight">
                    {user?.username}
                  </p>
                </div>

                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-black p-0.5 group-hover:bg-black transition-all duration-300 overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] md:shadow-none">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      className="w-full h-full rounded-full object-cover grayscale group-hover:grayscale-0 transition-all"
                      alt="profile"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full flex items-center justify-center group-hover:text-white transition-colors bg-white">
                      <FaUserCircle size={18} />
                    </div>
                  )}
                </div>
              </button>

              {/* Desktop Dropdown: md 이상에서만 호버 시 표시 */}
              <div className="absolute right-0 mt-2 w-56 bg-white border border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,0.05)] py-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 hidden md:block">
                <div className="px-6 pb-4 border-b border-gray-100 mb-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 font-mono">
                    Registry Info
                  </p>
                  <p className="text-[12px] font-medium text-black truncate">
                    {user?.email}
                  </p>
                </div>

                <MenuLink
                  onClick={() => navigate('/dashboard')}
                  icon={<FaBookmark />}
                  label="My Collection"
                />
                <MenuLink
                  onClick={() => navigate('/my-account')}
                  icon={<FaUserCog />}
                  label="Preferences"
                />

                <div className="mt-4 px-4">
                  <button
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 bg-black text-white hover:bg-gray-800 transition-all group/btn"
                  >
                    <span className="text-[10px] uppercase font-bold tracking-widest">
                      Sign Out
                    </span>
                    <FaArrowRight
                      size={10}
                      className="group-hover/btn:translate-x-1 transition-transform"
                    />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => openAccountManager()}
              className="flex items-center gap-2 md:gap-3 group text-black transition-all"
            >
              <span className="hidden sm:inline text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] border-b border-black pb-0.5 whitespace-nowrap">
                Access Archive
              </span>
              <FaArrowRight
                size={12}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
          )}
        </div>
      </div>

      {/* [Mobile] Navigation Overlay: md 미만에서 메뉴 토글 시 표시 */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-[81px] left-0 w-full bg-white border-b-2 border-black animate-in slide-in-from-top duration-300 shadow-xl">
          <div className="flex flex-col divide-y divide-gray-100">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-4 px-8 py-5 text-black active:bg-gray-50 transition-colors"
              >
                <span className="text-gray-400">{item.icon}</span>
                <span className="text-[11px] font-black uppercase tracking-widest">
                  {item.label}
                </span>
              </Link>
            ))}
            {isAuthenticated && (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-4 px-8 py-5 text-black active:bg-gray-50 transition-colors"
                >
                  <FaBookmark className="text-gray-400" />
                  <span className="text-[11px] font-black uppercase tracking-widest">
                    My Collection
                  </span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                    navigate('/');
                  }}
                  className="flex items-center gap-4 px-8 py-6 text-red-600 bg-red-50 font-black uppercase text-[11px] tracking-widest text-left"
                >
                  <FaArrowRight size={12} className="rotate-180" />
                  Sign Out of Archive
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

/**
 * Dropdown용 재사용 가능 링크 컴포넌트
 */
const MenuLink = ({
  onClick,
  icon,
  label,
}: {
  onClick: () => void;
  icon: any;
  label: string;
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-all text-black group/item text-left"
  >
    <span className="text-sm opacity-30 group-hover/item:opacity-100 transition-opacity">
      {icon}
    </span>
    <span className="text-[11px] uppercase tracking-widest font-bold">
      {label}
    </span>
  </button>
);

export default Header;
