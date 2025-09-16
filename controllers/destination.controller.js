import models from "../models/index.js";
import { Op } from "sequelize";
// import Log from '../models/log'; // Removed incorrect import

// Controller to search and filter destinations
export const searchDestinations = async (req, res) => {
  const { url, method, createdAtFrom, createdAtTo } = req.query;

  const whereClause = {};

  // Filter by URL
  if (url) {
    whereClause.URL = { [Op.like]: `%${url}%` };
  }

  // Filter by HTTP_method
  if (method) {
    whereClause.HTTP_method = method;
  }

  // Filter by createdAt range
  if (createdAtFrom) {
    whereClause.createdAt = {
      ...whereClause.createdAt,
      [Op.gte]: new Date(createdAtFrom),
    };
  }
  if (createdAtTo) {
    whereClause.createdAt = {
      ...whereClause.createdAt,
      [Op.lte]: new Date(createdAtTo),
    };
  }

  try {
    const destinations = await models.Destination.findAll({
      where: whereClause,
      // Add any necessary includes here, e.g., if you want to include logs associated with destinations
    });

    // Log successful destination search
    await models.Log.create({
      level: 'info',
      message: 'Destinations searched successfully',
      details: JSON.stringify({ query: req.query, count: destinations.length }),
      userId: req.user ? req.user.id : null, // Assuming user ID is available from auth middleware
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "Destinations retrieved successfully",
      data: destinations,
    });
  } catch (error) {
    // Log the error during destination search
    await models.Log.create({
      level: 'error',
      message: 'Error searching destinations',
      details: JSON.stringify({ query: req.query, error: error.message }),
      userId: req.user ? req.user.id : null,
      timestamp: new Date().toISOString(),
    });
    console.error("Error searching destinations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve destinations",
      error: error.message,
    });
  }
};
