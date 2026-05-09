require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const booleanPointInPolygon = require('@turf/boolean-point-in-polygon').default;
const { point, polygon, multiPolygon } = require('@turf/helpers');
const CulturalSite = require('../models/CulturalSite');

const migrateDistricts = async () => {
  try {
    // 1. DB 연결
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 2. 구역 GeoJSON 데이터 로드 (파일 경로는 본인의 환경에 맞게 수정하세요)
    const districtsPath = path.join(__dirname, '../data/berlin_district_boundary.geojson');
    const districtsData = JSON.parse(fs.readFileSync(districtsPath, 'utf8'));

    // 3. 모든 사이트 가져오기
    const sites = await CulturalSite.find({});
    console.log(`🚀 Starting migration for ${sites.length} sites...`);

    let updatedCount = 0;

    for (const site of sites) {
      const [lon, lat] = site.location.coordinates;
      const pt = point([lon, lat]);
      let foundDistrict = 'Unknown';

      // 각 구역 폴리곤과 대조
      for (const feature of districtsData.features) {
        try {
          let poly;
          if (feature.geometry.type === 'Polygon') {
            poly = polygon(feature.geometry.coordinates);
          } else if (feature.geometry.type === 'MultiPolygon') {
            poly = multiPolygon(feature.geometry.coordinates);
          }

          if (poly && booleanPointInPolygon(pt, poly)) {
            foundDistrict = feature.properties.name;
            break;
          }
        } catch (err) {
          continue;
        }
      }

      // 4. 주소 구조 업데이트 (기존 문자열 보존 + 구 추가)
      const oldAddress = typeof site.address === 'string' ? site.address : (site.address?.fullAddress || '');
      
      site.address = {
        fullAddress: oldAddress,
        street: site.address?.street || '',
        houseNumber: site.address?.houseNumber || '',
        postcode: site.address?.postcode || '',
        district: foundDistrict, // 찾은 구 이름 삽입
        city: 'berlin'
      };

      await site.save();
      updatedCount++;

      if (updatedCount % 500 === 0) {
        console.log(`⏳ Progress: ${updatedCount}/${sites.length} sites processed...`);
      }
    }

    console.log(`\n✨ Migration Completed! ${updatedCount} sites updated.`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

migrateDistricts();