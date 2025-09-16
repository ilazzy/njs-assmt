import models from "../models/index.js";
import { Op } from "sequelize"; // Import Op for complex queries
// import Log from '../models/log'; // Removed incorrect import

// Controller to search and filter accounts
export const searchAccounts = async (req, res) => {
  const {
    name,
    website,
    created_by,
    updated_by,
    createdAtFrom,
    createdAtTo,
    updatedAtFrom,
    updatedAtTo,
  } = req.query;

  const whereClause = {};

  // Filter by account_name
  if (name) {
    whereClause.account_name = { [Op.like]: `%${name}%` };
  }

  // Filter by website
  if (website) {
    whereClause.website = { [Op.like]: `%${website}%` };
  }

  // Filter by created_by
  if (created_by) {
    whereClause.created_by = parseInt(created_by, 10);
  }

  // Filter by updated_by
  if (updated_by) {
    whereClause.updated_by = parseInt(updated_by, 10);
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

  // Filter by updatedAt range
  if (updatedAtFrom) {
    whereClause.updatedAt = {
      ...whereClause.updatedAt,
      [Op.gte]: new Date(updatedAtFrom),
    };
  }
  if (updatedAtTo) {
    whereClause.updatedAt = {
      ...whereClause.updatedAt,
      [Op.lte]: new Date(updatedAtTo),
    };
  }

  try {
    const accounts = await models.Account.findAll({
      where: whereClause,
      include: [
        { model: models.User, as: "creator", attributes: ["id", "email"] }, // Include creator's email
        { model: models.User, as: "updater", attributes: ["id", "email"] }, // Include updater's email
      ],
    });

    // Log successful account search
    await models.Log.create({
      level: 'info',
      message: 'Accounts searched successfully',
      details: JSON.stringify({ query: req.query, count: accounts.length }),
      userId: req.user ? req.user.id : null, // Assuming user ID is available from auth middleware
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "Accounts retrieved successfully",
      data: accounts,
    });
  } catch (error) {
    // Log the error during account search
    await models.Log.create({
      level: 'error',
      message: 'Error searching accounts',
      details: JSON.stringify({ query: req.query, error: error.message }),
      userId: req.user ? req.user.id : null,
      timestamp: new Date().toISOString(),
    });
    console.error("Error searching accounts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve accounts",
      error: error.message,
    });
  }
};
