const dotenv = require('dotenv');
dotenv.config();

const { connectDB } = require('../config/db');
const { User, Driver } = require('../models/index');

const seed = async () => {
  await connectDB();

  // Clear all rows
  await Driver.destroy({ where: {}, truncate: true });
  await User.destroy({ where: {}, truncate: true });
  console.log('🧹 Cleared existing data');

  // Admin
  await User.create({
    name:     'Admin User',
    email:    'admin@cabgo.com',
    phone:    '9999999999',
    password: 'admin123',
    role:     'admin',
  });

  // Riders
  await User.create({
    name:     'Ayush Tiwari',
    email:    'rider1@cabgo.com',
    phone:    '9876543210',
    password: 'rider123',
  });

  await User.create({
    name:     'Priya Sharma',
    email:    'rider2@cabgo.com',
    phone:    '9876543211',
    password: 'rider123',
  });

  // Drivers
  await Driver.create({
    name:          'Ramesh Kumar',
    email:         'driver1@cabgo.com',
    phone:         '9876500001',
    password:      'driver123',
    vehicleType:   'sedan',
    vehicleModel:  'Honda City',
    vehicleColor:  'White',
    plateNumber:   'MP09AB1234',
    licenseNumber: 'DL123456',
    licenseExpiry: new Date('2027-01-01'),
    isApproved:    true,
    currentLat:    23.1765,
    currentLng:    79.8830,
  });

  await Driver.create({
    name:          'Suresh Yadav',
    email:         'driver2@cabgo.com',
    phone:         '9876500002',
    password:      'driver123',
    vehicleType:   'mini',
    vehicleModel:  'Maruti Swift',
    vehicleColor:  'Red',
    plateNumber:   'MP09CD5678',
    licenseNumber: 'DL654321',
    licenseExpiry: new Date('2026-06-01'),
    isApproved:    true,
    currentLat:    23.1855,
    currentLng:    79.9010,
  });

  console.log('\n✅ Seed data inserted:');
  console.log('   Admin    → admin@cabgo.com   / admin123');
  console.log('   Rider 1  → rider1@cabgo.com  / rider123');
  console.log('   Rider 2  → rider2@cabgo.com  / rider123');
  console.log('   Driver 1 → driver1@cabgo.com / driver123');
  console.log('   Driver 2 → driver2@cabgo.com / driver123');

  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
