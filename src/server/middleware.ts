import express from 'express';

// Export the configured middleware
export const rawBodyMiddleware = express.raw({ type: 'application/json' }); 
