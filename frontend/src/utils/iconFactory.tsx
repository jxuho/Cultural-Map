import L from 'leaflet';
import ReactDOMServer from 'react-dom/server';
import React from 'react';
import { 
  FaLandmark, FaPalette, FaBuilding, FaUtensils, 
  FaTheaterMasks, FaUsers, FaBook, FaFilm, FaQuestionCircle 
} from 'react-icons/fa';
import { categoryBorderColors } from '../config/colors';

// 1. 카테고리별 아이콘 컴포넌트 매핑
const categoryIconComponents: Record<string, React.ReactNode> = {
  artwork: <FaPalette />,
  gallery: <FaBuilding />,
  museum: <FaLandmark />,
  restaurant: <FaUtensils />,
  theatre: <FaTheaterMasks />,
  arts_centre: <FaUsers />,
  community_centre: <FaUsers />,
  library: <FaBook />,
  cinema: <FaFilm />,
  other: <FaQuestionCircle />,
};

// 2. 아이콘 객체를 저장할 캐시 (1.7만 번 생성을 방지)
const iconCache: Record<string, L.DivIcon> = {};
const selectedIconCache: Record<string, L.DivIcon> = {};

export const getCustomIcon = (category: string, isSelected = false): L.DivIcon => {
  const cache = isSelected ? selectedIconCache : iconCache;
  
  // 이미 생성된 아이콘이 있다면 즉시 반환
  if (cache[category]) return cache[category];

  // 아이콘 생성 로직 시작
  const IconComponent = categoryIconComponents[category] || categoryIconComponents.other;
  const backgroundColor = isSelected ? 'red' : 'white';
  const defaultBorderColor = categoryBorderColors[category] || categoryBorderColors.other;
  const borderColor = isSelected ? 'red' : defaultBorderColor;
  const iconColor = isSelected ? 'white' : '#333';
  const size = isSelected ? '35px' : '30px';
  const fontSize = isSelected ? '22px' : '18px';

  // renderToString은 무거운 작업이므로 카테고리당 딱 한 번만 실행됨
  const iconHtml = ReactDOMServer.renderToString(
    <div style={{
      backgroundColor,
      borderRadius: '50%',
      width: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: isSelected ? '0 2px 8px rgba(255,0,0,0.5)' : '0 2px 5px rgba(0,0,0,0.3)',
      fontSize,
      color: iconColor,
      border: `3.5px solid ${borderColor}`,
    }}>
      {IconComponent}
    </div>
  );

  const icon = L.divIcon({
    html: iconHtml,
    className: `custom-div-icon ${isSelected ? 'selected' : ''}`,
    iconSize: isSelected ? [35, 35] : [30, 30],
    iconAnchor: isSelected ? [17.5, 17.5] : [15, 15],
  });

  // 캐시에 저장 후 반환
  cache[category] = icon;
  return icon;
};