/**
 * Fare Service
 * Calculates distance (Haversine formula) and fare for different vehicle types
 */

// Fare config per vehicle type
const FARE_CONFIG = {
  auto: {
    baseFare: 20,
    farePerKm: 8,
    minFare: 30,
    label: 'Auto',
    capacity: 3,
  },
  mini: {
    baseFare: 40,
    farePerKm: 12,
    minFare: 60,
    label: 'Mini',
    capacity: 4,
  },
  sedan: {
    baseFare: 60,
    farePerKm: 16,
    minFare: 80,
    label: 'Sedan',
    capacity: 4,
  },
  suv: {
    baseFare: 100,
    farePerKm: 22,
    minFare: 120,
    label: 'SUV',
    capacity: 6,
  },
};

/**
 * Haversine formula — distance between two lat/lng points in km
 */
function haversineDistance(pickup, destination) {
  const R = 6371; // Earth radius in km
  const lat1 = pickup.coordinates.lat * (Math.PI / 180);
  const lat2 = destination.coordinates.lat * (Math.PI / 180);
  const deltaLat = (destination.coordinates.lat - pickup.coordinates.lat) * (Math.PI / 180);
  const deltaLng = (destination.coordinates.lng - pickup.coordinates.lng) * (Math.PI / 180);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

/**
 * Surge pricing logic — real apps use demand/supply data
 * Here we simulate surge based on time of day
 */
function getSurgeFactor() {
  const hour = new Date().getHours();
  // Peak hours: 8-10 AM and 5-8 PM
  if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20)) {
    return 1.3; // 30% surge
  }
  // Late night: 11 PM - 4 AM
  if (hour >= 23 || hour <= 4) {
    return 1.2; // 20% surge
  }
  return 1.0; // no surge
}

/**
 * Estimate duration in minutes (rough: distance / avg speed 30 km/h in city)
 */
function estimateDuration(distanceKm) {
  return Math.round((distanceKm / 30) * 60);
}

/**
 * Calculate fare for a specific vehicle type
 */
function calculateFare(pickup, destination, vehicleType = 'sedan') {
  const config = FARE_CONFIG[vehicleType] || FARE_CONFIG.sedan;
  const distance = haversineDistance(pickup, destination);
  const duration = estimateDuration(distance);
  const surgeFactor = getSurgeFactor();

  const rawFare = config.baseFare + distance * config.farePerKm;
  const totalFare = Math.max(
    Math.round(rawFare * surgeFactor),
    config.minFare
  );

  return {
    vehicleType,
    label: config.label,
    distance,
    duration,
    baseFare: config.baseFare,
    farePerKm: config.farePerKm,
    surgeFactor,
    totalFare,
    capacity: config.capacity,
    isSurge: surgeFactor > 1,
  };
}

/**
 * Calculate fares for ALL vehicle types (for the estimate screen)
 */
function calculateAllFares(pickup, destination) {
  return Object.keys(FARE_CONFIG).map((type) =>
    calculateFare(pickup, destination, type)
  );
}

module.exports = {
  calculateFare,
  calculateAllFares,
  haversineDistance,
  getSurgeFactor,
};
