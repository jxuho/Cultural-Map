import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  className?: string;
  iconSize?: number;
}

const BackButton = ({ className = '', iconSize = 20 }: BackButtonProps) => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <button
      onClick={handleGoBack}
      className={`
        group relative flex items-center gap-3
        px-4 py-2 bg-white
        border-2 border-black
        text-black font-black uppercase tracking-[0.2em] text-[11px]
        transition-all duration-150
        hover:bg-black hover:text-white
        hover:translate-x-[-4px] hover:translate-y-[-4px]
        hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
        active:translate-x-0 active:translate-y-0
        active:shadow-none
        focus:outline-none focus:ring-2 focus:ring-yellow-400
        cursor-pointer overflow-hidden
        ${className}
      `}
      aria-label="Return to previous record"
      title="Return to previous record"
    >
      {/* 화살표 애니메이션 컨테이너 */}
      <div className="relative overflow-hidden w-5 h-5 flex items-center justify-center">
        <ArrowLeft 
          size={iconSize} 
          className="transition-transform duration-300 group-hover:-translate-x-6 absolute" 
        />
        <ArrowLeft 
          size={iconSize} 
          className="transition-transform duration-300 translate-x-6 group-hover:translate-x-0 absolute" 
        />
      </div>

      <span className="relative z-10">
        Return_Path
      </span>

      {/* 배경 장식 (호버 시 나타나는 미세한 패턴) */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:4px_4px]"></div>
    </button>
  );
};

export default BackButton;