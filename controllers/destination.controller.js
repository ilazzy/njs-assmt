import models from "../models/index.js";
import { Op } from "sequelize";
import { validationResult, body } from "express-validator";

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
      level: "info",
      message: "Destinations searched successfully",
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
      level: "error",
      message: "Error searching destinations",
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

// Validation rules for creating a destination
export const createDestinationValidationRules = () => {
  return [
    body("URL")
      .notEmpty()
      .isURL()
      .withMessage("URL is required and must be a valid URL"),
    body("HTTP_method")
      .notEmpty()
      .isIn(["GET", "POST", "DELETE", "PUT"])
      .withMessage(
        "HTTP method is required and must be one of GET, POST, DELETE, PUT"
      ),
    body("headers")
      .optional()
      .isJSON()
      .withMessage("Headers must be a valid JSON string"),
  ];
};

// Controller to create a new destination
export const createDestination = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { URL, HTTP_method, headers } = req.body;

  try {
    const newDestination = await models.Destination.create({
      URL,
      HTTP_method,
      headers,
    });

    // Log successful destination creation
    await models.Log.create({
      level: "info",
      message: "Destination created successfully",
      details: JSON.stringify({
        destinationId: newDestination.id,
        url: newDestination.URL,
      }),
      userId: req.user ? req.user.id : null,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      message: "Destination created successfully",
      data: newDestination,
    });
  } catch (error) {
    // Log the error during destination creation
    await models.Log.create({
      level: "error",
      message: "Error creating destination",
      details: JSON.stringify({ url: URL, error: error.message }),
      userId: req.user ? req.user.id : null,
      timestamp: new Date().toISOString(),
    });
    console.error("Error creating destination:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create destination",
      error: error.message,
    });
  }
};

// Validation rules for updating a destination
export const updateDestinationValidationRules = () => {
  return [
    body("URL").optional().isURL().withMessage("Invalid website URL"),
    body("HTTP_method")
      .optional()
      .isIn(["GET", "POST", "DELETE", "PUT"])
      .withMessage("HTTP method must be one of GET, POST, DELETE, PUT"),
    body("headers")
      .optional()
      .isJSON()
      .withMessage("Headers must be a valid JSON string"),
  ];
};

// Controller to update an existing destination
export const updateDestination = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { URL, HTTP_method, headers } = req.body;

  try {
    const destination = await models.Destination.findByPk(id);

    if (!destination) {
      // Log failed update attempt
      await models.Log.create({
        level: "warn",
        message: "Destination update failed: Destination not found",
        details: JSON.stringify({ destinationId: id }),
        userId: req.user ? req.user.id : null,
        timestamp: new Date().toISOString(),
      });
      return res
        .status(404)
        .json({ success: false, message: "Destination not found" });
    }

    // Update fields
    destination.URL = URL || destination.URL;
    destination.HTTP_method = HTTP_method || destination.HTTP_method;
    destination.headers = headers || destination.headers;

    await destination.save();

    // Log successful destination update
    await models.Log.create({
      level: "info",
      message: "Destination updated successfully",
      details: JSON.JSON.stringify({
        destinationId: destination.id,
        url: destination.URL,
      }),
      userId: req.user ? req.user.id : null,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "Destination updated successfully",
      data: destination,
    });
  } catch (error) {
    // Log the error during destination update
    await models.Log.create({
      level: "error",
      message: "Error updating destination",
      details: JSON.stringify({ destinationId: id, error: error.message }),
      userId: req.user ? req.user.id : null,
      timestamp: new Date().toISOString(),
    });
    console.error("Error updating destination:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update destination",
      error: error.message,
    });
  }
};

// Controller to delete a destination
export const deleteDestination = async (req, res) => {
  const { id } = req.params;

  try {
    const destination = await models.Destination.findByPk(id);

    if (!destination) {
      // Log failed delete attempt
      await models.Log.create({
        level: "warn",
        message: "Destination deletion failed: Destination not found",
        details: JSON.stringify({ destinationId: id }),
        userId: req.user ? req.user.id : null,
        timestamp: new Date().toISOString(),
      });
      return res
        .status(404)
        .json({ success: false, message: "Destination not found" });
    }

    await destination.destroy();

    // Log successful destination deletion
    await models.Log.create({
      level: "info",
      message: "Destination deleted successfully",
      details: JSON.stringify({
        destinationId: id,
        deletedBy: req.user ? req.user.id : null,
      }),
      userId: req.user ? req.user.id : null,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "Destination deleted successfully",
    });
  } catch (error) {
    // Log the error during destination deletion
    await models.Log.create({
      level: "error",
      message: "Error deleting destination",
      details: JSON.stringify({ destinationId: id, error: error.message }),
      userId: req.user ? req.user.id : null,
      timestamp: new Date().toISOString(),
    });
    console.error("Error deleting destination:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete destination",
      error: error.message,
    });
  }
};

// Controller to get destinations by account ID
export const getDestinationsByAccountId = async (req, res) => {
  const { account_id } = req.params; // Assuming account_id is passed as a URL parameter

  try {
    const accountMembers = await models.AccountMember.findAll({
      where: { account_id: account_id },
      include: [{ model: models.User, include: [models.Destination] }],
    });

    const destinations = await models.Destination.findAll({
      where: { account_id: account_id }, // This assumes account_id exists in Destination model
      include: [
        { model: models.Log, attributes: ["id", "level", "message"] }, // Example include
      ],
    });

    // Log successful retrieval of destinations by account ID
    await models.Log.create({
      level: "info",
      message: "Destinations retrieved by account ID successfully",
      details: JSON.stringify({
        accountId: account_id,
        count: destinations.length,
      }),
      userId: req.user ? req.user.id : null,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "Destinations retrieved successfully",
      data: destinations,
    });
  } catch (error) {
    // Log the error during retrieval
    await models.Log.create({
      level: "error",
      message: "Error retrieving destinations by account ID",
      details: JSON.stringify({ accountId: account_id, error: error.message }),
      userId: req.user ? req.user.id : null,
      timestamp: new Date().toISOString(),
    });
    console.error("Error retrieving destinations by account ID:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve destinations by account ID",
      error: error.message,
    });
  }
};
