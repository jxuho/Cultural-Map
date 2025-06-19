// MemoizedCulturalSiteMarker.jsx
import React from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import ReactDOMServer from 'react-dom/server';
import { FaLandmark, FaPalette, FaBuilding, FaUtensils, FaTheaterMasks, FaUsers, FaBook, FaFilm, FaQuestionCircle } from 'react-icons/fa';

// 카테고리 아이콘 매핑 (이 부분은 CulturalSiteMarkers에서 복사해옴)
const categoryIconComponents = {
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

// L.divIcon을 생성하는 헬퍼 함수 (이 부분은 CulturalSiteMarkers에서 복사해옴)
const createCustomIcon = (category, isSelected = false) => {
    const IconComponent = categoryIconComponents[category] || categoryIconComponents.other;

    const backgroundColor = isSelected ? 'red' : 'white';
    const borderColor = isSelected ? 'red' : '#333';
    const iconColor = isSelected ? 'white' : '#333';
    const boxShadow = isSelected ? '0 2px 8px rgba(255,0,0,0.5)' : '0 2px 5px rgba(0,0,0,0.3)';
    const size = isSelected ? '35px' : '30px';
    const fontSize = isSelected ? '22px' : '18px';

    const iconHtml = ReactDOMServer.renderToString(
        <div style={{
            backgroundColor: backgroundColor,
            borderRadius: '50%',
            width: size,
            height: size,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: boxShadow,
            fontSize: fontSize,
            color: iconColor,
            border: `2px solid ${borderColor}`
        }}>
            {IconComponent}
        </div>
    );

    const iconSize = isSelected ? [35, 35] : [30, 30];
    const iconAnchor = isSelected ? [17.5, 17.5] : [15, 15];

    return L.divIcon({
        html: iconHtml,
        className: `custom-div-icon ${isSelected ? 'selected' : ''}`,
        iconSize: iconSize,
        iconAnchor: iconAnchor,
    });
};

// 개별 마커를 위한 컴포넌트
const MemoizedCulturalSiteMarker = React.memo(({ culturalSite, openSidePanel, isSelected }) => {
    console.log(`마커 ${culturalSite.name} (${culturalSite._id}) 재렌더링됨. isSelected: ${isSelected}`);

    // 아이콘 생성은 여기서 직접 합니다.
    const iconToRender = createCustomIcon(culturalSite.category, isSelected);

    return (
        <Marker
            key={culturalSite._id} // 여기의 key는 MarkerClusterGroup 내부이므로 제거해도 됩니다.
            position={[
                culturalSite.location.coordinates[1],
                culturalSite.location.coordinates[0],
            ]}
            icon={iconToRender}
            zIndexOffset={isSelected ? 1000 : 0}
            eventHandlers={{
                click: () => openSidePanel(culturalSite),
            }}
        />
    );
}, (prevProps, nextProps) => {
    // 이전 props와 다음 props를 비교하여 재렌더링 여부 결정
    // culturalSite 객체의 _id는 동일해야 함 (key로 사용되므로)
    // isSelected 상태가 변했을 때만 재렌더링 (true 반환 시 재렌더링 안 함)
    return (
        prevProps.culturalSite === nextProps.culturalSite &&
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.openSidePanel === nextProps.openSidePanel // openSidePanel이 안정적인 함수인지 확인
    );
});

export default MemoizedCulturalSiteMarker;