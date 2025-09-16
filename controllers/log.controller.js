import models from "../models/index.js";
import { Op } from "sequelize";

// Controller to search and filter logs
export const searchLogs = async (req, res) => {
  const {
    eventId,
    status,
    accountId,
    destinationId,
    receivedFrom,
    receivedTo,
    processedFrom,
    processedTo,
  } = req.query;

  const whereClause = {};

  // Filter by event_id
  if (eventId) {
    whereClause.event_id = parseInt(eventId, 10);
  }

  // Filter by status
  if (status) {
    whereClause.status = status;
  }

  // Filter by account_id
  if (accountId) {
    whereClause.account_id = parseInt(accountId, 10);
  }

  // Filter by destination_id
  if (destinationId) {
    whereClause.destination_id = parseInt(destinationId, 10);
  }

  // Filter by received_timestamp range
  if (receivedFrom) {
    whereClause.received_timestamp = {
      ...whereClause.received_timestamp,
      [Op.gte]: new Date(receivedFrom),
    };
  }
  if (receivedTo) {
    whereClause.received_timestamp = {
      ...whereClause.received_timestamp,
      [Op.lte]: new Date(receivedTo),
    };
  }

  // Filter by processed_timestamp range
  if (processedFrom) {
    whereClause.processed_timestamp = {
      ...whereClause.processed_timestamp,
      [Op.gte]: new Date(processedFrom),
    };
  }
  if (processedTo) {
    whereClause.processed_timestamp = {
      ...whereClause.processed_timestamp,
      [Op.lte]: new Date(processedTo),
    };
  }

  try {
    const logs = await models.Log.findAll({
      where: whereClause,
      include: [
        { model: models.Account, as: "Account", attributes: ["id", "account_name"] }, // Include Account details
        { model: models.Destination, as: "Destination", attributes: ["id", "URL", "HTTP_method"] }, // Include Destination details
      ],
    });

    // Log successful log search
    await models.Log.create({
      level: 'info',
      message: 'Logs searched successfully',
      details: JSON.stringify({ query: req.query, count: logs.length }),
      userId: req.user ? req.user.id : null, // Assuming user ID is available from auth middleware
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "Logs retrieved successfully",
      data: logs,
    });
  } catch (error) {
    // Log the error during log search
    await models.Log.create({
      level: 'error',
      message: 'Error searching logs',
      details: JSON.stringify({ query: req.query, error: error.message }),
      userId: req.user ? req.user.id : null,
      timestamp: new Date().toISOString(),
    });
    console.error("Error searching logs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve logs",
      error: error.message,
    });
  }
};
