import models from "../models/index.js";
import { Op } from "sequelize";
import { validationResult, body } from "express-validator";

// Validation rules for creating an account member
export const createAccountMemberValidationRules = () => {
  return [
    body("account_id").notEmpty().withMessage("Account ID is required"),
    body("user_id").notEmpty().withMessage("User ID is required"),
    body("role_id").notEmpty().withMessage("Role ID is required"),
    // Add more validation if needed, e.g., checking if account_id, user_id, role_id exist in their respective tables
  ];
};

// Controller to create a new account member
export const createAccountMember = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { account_id, user_id, role_id } = req.body;
  const requestingUserId = req.user.id; // Get user ID from authenticated request

  try {
    const newAccountMember = await models.AccountMember.create({
      account_id,
      user_id,
      role_id,
    });

    // Log successful account member creation
    await models.Log.create({
      level: "info",
      message: "Account member created successfully",
      details: JSON.stringify({
        accountMemberId: newAccountMember.id,
        accountId: account_id,
        userId: user_id,
        addedBy: requestingUserId,
      }),
      userId: requestingUserId,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      message: "Account member added successfully",
      data: newAccountMember,
    });
  } catch (error) {
    // Log the error during account member creation
    await models.Log.create({
      level: "error",
      message: "Error creating account member",
      details: JSON.stringify({
        accountId: account_id,
        userId: user_id,
        error: error.message,
      }),
      userId: requestingUserId,
      timestamp: new Date().toISOString(),
    });
    console.error("Error creating account member:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add account member",
      error: error.message,
    });
  }
};

export const getAccountMembers = async (req, res) => {
  const { account_id } = req.query;

  const whereClause = {};
  if (account_id) {
    whereClause.account_id = parseInt(account_id, 10);
  }

  try {
    const accountMembers = await models.AccountMember.findAll({
      where: whereClause,
      include: [
        { model: models.User, attributes: ["id", "email"] }, // Include user details
        { model: models.Role, attributes: ["id", "role_name"] }, // Include role details
      ],
    });

    await models.Log.create({
      level: "info",
      message: "Account members retrieved successfully",
      details: JSON.stringify({
        query: req.query,
        count: accountMembers.length,
      }),
      userId: req.user ? req.user.id : null,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "Account members retrieved successfully",
      data: accountMembers,
    });
  } catch (error) {
    await models.Log.create({
      level: "error",
      message: "Error retrieving account members",
      details: JSON.stringify({ query: req.query, error: error.message }),
      userId: req.user ? req.user.id : null,
      timestamp: new Date().toISOString(),
    });
    console.error("Error retrieving account members:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve account members",
      error: error.message,
    });
  }
};

// Controller to update an existing account member
export const updateAccountMember = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params; // Assuming the ID of the account member is in the URL params
  const { role_id } = req.body;
  const requestingUserId = req.user.id;

  try {
    const accountMember = await models.AccountMember.findByPk(id);

    if (!accountMember) {
      // Log failed update attempt
      await models.Log.create({
        level: "warn",
        message: "Account member update failed: Account member not found",
        details: JSON.stringify({ accountMemberId: id }),
        userId: requestingUserId,
        timestamp: new Date().toISOString(),
      });
      return res
        .status(404)
        .json({ success: false, message: "Account member not found" });
    }

    // Update role_id
    accountMember.role_id = role_id || accountMember.role_id;

    await accountMember.save();

    // Log successful account member update
    await models.Log.create({
      level: "info",
      message: "Account member updated successfully",
      details: JSON.stringify({
        accountMemberId: accountMember.id,
        roleId: accountMember.role_id,
        updatedBy: requestingUserId,
      }),
      userId: requestingUserId,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "Account member updated successfully",
      data: accountMember,
    });
  } catch (error) {
    // Log the error during account member update
    await models.Log.create({
      level: "error",
      message: "Error updating account member",
      details: JSON.stringify({ accountMemberId: id, error: error.message }),
      userId: requestingUserId,
      timestamp: new Date().toISOString(),
    });
    console.error("Error updating account member:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update account member",
      error: error.message,
    });
  }
};

// Controller to delete an account member
export const deleteAccountMember = async (req, res) => {
  const { id } = req.params; // Assuming the ID of the account member is in the URL params
  const requestingUserId = req.user.id;

  try {
    const accountMember = await models.AccountMember.findByPk(id);

    if (!accountMember) {
      // Log failed delete attempt
      await models.Log.create({
        level: "warn",
        message: "Account member deletion failed: Account member not found",
        details: JSON.stringify({ accountMemberId: id }),
        userId: requestingUserId,
        timestamp: new Date().toISOString(),
      });
      return res
        .status(404)
        .json({ success: false, message: "Account member not found" });
    }

    await accountMember.destroy();

    // Log successful account member deletion
    await models.Log.create({
      level: "info",
      message: "Account member deleted successfully",
      details: JSON.stringify({
        accountMemberId: id,
        deletedBy: requestingUserId,
      }),
      userId: requestingUserId,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "Account member deleted successfully",
    });
  } catch (error) {
    // Log the error during account member deletion
    await models.Log.create({
      level: "error",
      message: "Error deleting account member",
      details: JSON.stringify({ accountMemberId: id, error: error.message }),
      userId: requestingUserId,
      timestamp: new Date().toISOString(),
    });
    console.error("Error deleting account member:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete account member",
      error: error.message,
    });
  }
};
