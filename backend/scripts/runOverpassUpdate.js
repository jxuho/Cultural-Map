// runOverpassUpdate.js
require('dotenv').config();
const mongoose = require('mongoose');
const { overpassUpdater } = require('../services/overpassService');

const DB = process.env.MONGO_URI;

async function runUpdate() {
  try {
    await mongoose.connect(DB);
    console.log('DB connection successful!');

    console.log('Manually starting Overpass Updater...');
    await overpassUpdater();
    console.log('Overpass Updater finished successfully.');
  } catch (error) {
    console.error('Error during manual Overpass Updater run:', error);
    process.exitCode = 1;
  } finally {
    try {
      await mongoose.disconnect();
      console.log('DB connection closed.');
    } catch (disconnectError) {
      console.error('Error disconnecting DB:', disconnectError);
    }
    process.exit();
  }
}

runUpdate();
