/**
 * QVeue Token Generation Service
 * 
 * Creates standardized, unique sequential tokens per service per day.
 * Example: Q-001, Q-018, Q-024, C-005, P-012
 */

const Queue = require('../models/Queue');

async function generateNextToken(queue, service) {
  const prefix = (service && service.prefix ? service.prefix.toUpperCase() : 'Q');
  
  // Increment lastIssuedNumber
  const nextNumber = (queue.lastIssuedNumber || 0) + 1;
  const tokenString = `${prefix}-${String(nextNumber).padStart(3, '0')}`;

  // Update queue state
  await Queue.findByIdAndUpdate(queue._id || queue.id, {
    $set: {
      lastIssuedNumber: nextNumber
    }
  });

  return {
    tokenNumber: tokenString,
    sequenceNumber: nextNumber
  };
}

module.exports = {
  generateNextToken
};
