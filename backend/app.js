// 1. Load environment variables (always on top)
require('dotenv').config();
// 2. Core Node.js/Express framework and middleware (built-in/common)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// 3. Third-party middleware
const cookieParser = require('cookie-parser');
const passport = require('passport');
const rateLimit = require('express-rate-limit');
// 4. Model file (schema definition)
// The model must be defined before it can be referenced in a route or controller.
require('./models/User');
require('./models/CulturalSite');
require('./models/Review');
// 5. Utility files (helper functions/classes used throughout the application)
const AppError = require('./utils/AppError');
// 6. Controller file (business logic to be used in the router)
const errorController = require('./controllers/errorController');
// 7. Passport configuration file (strategy definition)
// This is the part that defines and initializes the Passport strategy, so it must be loaded before the router.
require('./config/passport');
// 8. Router file (API endpoint definition)
// After all models, utilities, authentication settings, etc. are loaded, the router must be defined.
const culturalSitesRoutes = require('./routes/culturalSitesRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const proposalRoutes = require('./routes/proposalRoutes');

const { loadCityBoundary } = require('./utils/locationUtils');

const seedIfEmpty = require('./utils/seedIfEmpty');

// cron-related files (scheduling)
const cron = require('node-cron');
const { overpassUpdater } = require('./services/overpassService');

// Swagger-related packages
const path = require('path');
const YAML = require('yamljs');
const swaggerUi = require('swagger-ui-express');

const app = express();

app.set('trust proxy', 1);
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

// API rate limiting (limited to 1000 requests per hour from the same IP)
const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request on this ip.',
});
app.use('/api', limiter); // Applies to all routes starting with /api

const allowedOrigins = [
  'http://localhost:5173', // Vite default port
  'http://localhost:3000',
  'https://cultural-heritage-map.vercel.app',
];

app.use(express.json());
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.static(`${__dirname}/public`));
app.use(passport.initialize());

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use('/api/v1/cultural-sites', culturalSitesRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/proposals', proposalRoutes);

// Add Swagger UI route
const swaggerDocument = YAML.load(path.join(__dirname, 'public/openapi.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/', (req, res) => {
  res.send('Message from the server: Server is Running!');
});

app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(errorController);

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');

    if (process.env.NODE_ENV !== 'production') {
      await seedIfEmpty();
    }

    // boundary load
    // 1. 현재 타겟 도시 설정 (기본값: berlin)
    const currentCity = process.env.CITY_NAME || 'berlin';

    // 2. 도시 경계 로드
    try {
      loadCityBoundary(currentCity);
      console.log(`${currentCity.toUpperCase()} boundary data loaded successfully.`);
    } catch (error) {
      console.error(`Failed to load ${currentCity} boundary data:`, error);
      // 필수 데이터라면 서버를 끄는 것도 방법이지만, 
      // 일단 로그만 남기고 진행하도록 유연하게 대처합니다.
    }
    // Run cron scheduler
    cron.schedule(
      '0 0 * * 0',
      async () => {
        console.log(`Weekly Overpass data update task for ${currentCity} started...`);
        try {
          // overpassUpdater 내부에서 currentCity를 받도록 수정되어야 함
          await overpassUpdater(currentCity);
          console.log(`Weekly Overpass data update task for ${currentCity} completed successfully.`);
        } catch (error) {
          console.error(`Error during weekly Overpass update for ${currentCity}:`, error);
        }
      },
      {
        scheduled: true,
        timezone: 'Europe/Berlin',
      },
    );
    console.log('Overpass data update scheduled for every Sunday 00:00.');

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
