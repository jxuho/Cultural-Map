import L from 'leaflet';
import ReactDOMServer from 'react-dom/server';
import React from 'react';
import {
  FaUniversity,
  FaLandmark,
  FaPlaceOfWorship,
  FaChessRook,
  FaTree,
  FaPalette,
  FaTheaterMasks,
  FaTools,
  FaSearchLocation,
  FaMonument,
  FaArchway,
  FaQuestionCircle,
  FaRibbon,
} from 'react-icons/fa';
import { categoryBorderColors } from '../config/colors';

// 1. 카테고리별 아이콘 컴포넌트 매핑
const categoryIconComponents: Record<string, React.ReactNode> = {
  historic_ensemble: <FaArchway />,
  museums_galleries: <FaLandmark />,
  monument: <FaMonument />,
  memorial: <FaRibbon />,
  castle: <FaChessRook />,
  religious_heritage: <FaPlaceOfWorship />,
  cultural_venues: <FaTheaterMasks />,
  public_art: <FaPalette />,
  industrial_heritage: <FaTools />,
  archaeological_sites: <FaSearchLocation />,
  heritage_buildings: <FaUniversity />,
  gardens_parks: <FaTree />,
  other: <FaQuestionCircle />,
};

// 2. 아이콘 객체를 저장할 캐시 (1.7만 번 생성을 방지)
const iconCache: Record<string, L.DivIcon> = {};
const selectedIconCache: Record<string, L.DivIcon> = {};

export const getCustomIcon = (
  category: string,
  isSelected = false,
): L.DivIcon => {
  const cache = isSelected ? selectedIconCache : iconCache;

  // 이미 생성된 아이콘이 있다면 즉시 반환
  if (cache[category]) return cache[category];

  // 아이콘 생성 로직 시작
  const IconComponent =
    categoryIconComponents[category] || categoryIconComponents.other;
  const backgroundColor = isSelected ? 'red' : 'white';
  const defaultBorderColor =
    categoryBorderColors[category] || categoryBorderColors.other;
  const borderColor = isSelected ? 'red' : defaultBorderColor;
  const iconColor = isSelected ? 'white' : '#333';
  const size = isSelected ? '35px' : '30px';
  const fontSize = isSelected ? '22px' : '18px';

  // renderToString은 무거운 작업이므로 카테고리당 딱 한 번만 실행됨
  const iconHtml = ReactDOMServer.renderToString(
    <div
      style={{
        backgroundColor,
        borderRadius: '50%',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isSelected
          ? '0 2px 8px rgba(255,0,0,0.5)'
          : '0 2px 5px rgba(0,0,0,0.3)',
        fontSize,
        color: iconColor,
        border: `3.5px solid ${borderColor}`,
      }}
    >
      {IconComponent}
    </div>,
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

export const preloadIcons = () => {
  const categories = Object.keys(categoryIconComponents);

  // 'other' 카테고리가 매핑에 없을 경우를 대비해 명시적 추가 가능
  const allCategories = categories.includes('other')
    ? categories
    : [...categories, 'other'];

  allCategories.forEach((category) => {
    // 일반 상태 아이콘 생성 및 캐싱
    getCustomIcon(category, false);
    // 선택 상태(Selected) 아이콘 생성 및 캐싱
    getCustomIcon(category, true);
  });
};

export const getClusterIcon = (count: number): L.DivIcon => {
  // 클러스터 원 사이즈 (기존과 동일)
  const size = count < 100 ? 35 : count < 500 ? 45 : 55;

  // 색상: 차분한 톤
  const color =
    count < 100
      ? '#7fb3d5' // 연한 파랑
      : count < 500
        ? '#f0b67f' // 연한 주황
        : '#d67f7f'; // 연한 빨강

  // 글자 크기 (원 크기에 비례)
  const fontSize = size / 2.5;

  return L.divIcon({
    html: `<div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${fontSize}px;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        transition: all 0.2s ease;
      ">${count}</div>`,
    className: 'custom-cluster-icon',
    iconSize: L.point(size, size),
    iconAnchor: L.point(size / 2, size / 2),
  });
};

// export const getClusterIcon = (count: number): L.DivIcon => {
//   const size = count < 100 ? 35 : count < 1000 ? 45 : 55;
//   const color = count < 100 ? '#51afef' : count < 1000 ? '#e5c07b' : '#e06c75';

//   return L.divIcon({
//     html: `<div style="
//         background-color: ${color};
//         width: ${size}px;
//         height: ${size}px;
//         border-radius: 50%;
//         display: flex;
//         align-items: center;
//         justify-content: center;
//         color: white;
//         font-weight: bold;
//         border: 3px solid white;
//         box-shadow: 0 2px 5px rgba(0,0,0,0.4);
//       ">${count}</div>`,
//     className: 'custom-cluster-icon',
//     iconSize: L.point(size, size),
//     iconAnchor: L.point(size / 2, size / 2),
//   });
// };
