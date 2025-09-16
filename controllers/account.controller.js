import models from "../models/index.js";
import { Op } from "sequelize";
import { validationResult, body } from 'express-validator';

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

  if (name) {
    whereClause.account_name = { [Op.like]: `%${name}%` };
  }

  if (website) {
    whereClause.website = { [Op.like]: `%${website}%` };
  }

  if (created_by) {
    whereClause.created_by = parseInt(created_by, 10);
  }

  if (updated_by) {
    whereClause.updated_by = parseInt(updated_by, 10);
  }

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
        { model: models.User, as: "creator", attributes: ["id", "email"] },
        { model: models.User, as: "updater", attributes: ["id", "email"] },
      ],
    });

    await models.Log.create({
      level: 'info',
      message: 'Accounts searched successfully',
      details: JSON.stringify({ query: req.query, count: accounts.length }),
      userId: req.user ? req.user.id : null,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "Accounts retrieved successfully",
      data: accounts,
    });
  } catch (error) {
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

// Validation rules for creating an account
export const createAccountValidationRules = () => {
  return [
    body('account_name').notEmpty().withMessage('Account name is required'),
    body('app_secret_token').notEmpty().withMessage('App secret token is required'),
    body('website').optional().isURL().withMessage('Invalid website URL'),
  ];
};

// Controller to create a new account
export const createAccount = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { account_name, app_secret_token, website } = req.body;
  const userId = req.user.id;

  try {
    const newAccount = await models.Account.create({
      account_name,
      app_secret_token,
      website,
      created_by: userId,
      updated_by: userId,
    });

    await models.Log.create({
      level: 'info',
      message: 'Account created successfully',
      details: JSON.stringify({ accountId: newAccount.id, accountName: newAccount.account_name, createdBy: userId }),
      userId: userId,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: newAccount,
    });
  } catch (error) {
    await models.Log.create({
      level: 'error',
      message: 'Error creating account',
      details: JSON.stringify({ accountName: account_name, error: error.message }),
      userId: userId,
      timestamp: new Date().toISOString(),
    });
    console.error("Error creating account:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create account",
      error: error.message,
    });
  }
};

// Validation rules for updating an account
export const updateAccountValidationRules = () => {
  return [
    body('account_name').optional().notEmpty().withMessage('Account name cannot be empty if provided'),
    body('app_secret_token').optional().notEmpty().withMessage('App secret token cannot be empty if provided'),
    body('website').optional().isURL().withMessage('Invalid website URL'),
  ];
};

// Controller to update an existing account
export const updateAccount = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { account_name, app_secret_token, website } = req.body;
  const userId = req.user.id;

  try {
    const account = await models.Account.findByPk(id);

    if (!account) {
      await models.Log.create({
        level: 'warn',
        message: 'Account update failed: Account not found',
        details: JSON.stringify({ accountId: id }),
        userId: userId,
        timestamp: new Date().toISOString(),
      });
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    account.account_name = account_name || account.account_name;
    account.app_secret_token = app_secret_token || account.app_secret_token;
    account.website = website || account.website;
    account.updated_by = userId;

    await account.save();

    await models.Log.create({
      level: 'info',
      message: 'Account updated successfully',
      details: JSON.stringify({ accountId: account.id, accountName: account.account_name, updatedBy: userId }),
      userId: userId,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "Account updated successfully",
      data: account,
    });
  } catch (error) {
    await models.Log.create({
      level: 'error',
      message: 'Error updating account',
      details: JSON.stringify({ accountId: id, error: error.message }),
      userId: userId,
      timestamp: new Date().toISOString(),
    });
    console.error("Error updating account:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update account",
      error: error.message,
    });
  }
};

// Controller to delete an account
export const deleteAccount = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const account = await models.Account.findByPk(id);

    if (!account) {
      await models.Log.create({
        level: 'warn',
        message: 'Account deletion failed: Account not found',
        details: JSON.stringify({ accountId: id }),
        userId: userId,
        timestamp: new Date().toISOString(),
      });
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    await account.destroy();

    await models.Log.create({
      level: 'info',
      message: 'Account deleted successfully',
      details: JSON.stringify({ accountId: id, deletedBy: userId }),
      userId: userId,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    await models.Log.create({
      level: 'error',
      message: 'Error deleting account',
      details: JSON.stringify({ accountId: id, error: error.message }),
      userId: userId,
      timestamp: new Date().toISOString(),
    });
    console.error("Error deleting account:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete account",
      error: error.message,
    });
  }
};