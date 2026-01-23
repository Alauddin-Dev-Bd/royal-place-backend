import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sanitize from "mongo-sanitize";

import { logger } from "../utils/logger";
import { AppError } from "../error/appError";
import { redisClient } from "../config/redis";
import { envVariable } from "../config";
import {
  IUpdateUserInput,
  IUser,
  IUserQuery,
} from "../interfaces/user.interfaces";
import UserModel from "../mongoSchema/user.schema";
import { genericQuery } from "../utils/queryUtils";

// Helper to clear related caches
const clearUserCache = async (userId?: string) => {
  // Clear all users list caches
  const keys = await redisClient.keys("users:*");
  for (const key of keys) {
    await redisClient.del(key);
  }

  // Clear single user cache if userId provided
  if (userId) {
    await redisClient.del(`user:${userId}`);
  }

  console.log("🧹 Cleared related Redis caches");
};

// ================================= Registration =================================
const registerUserIntoDb = async (body: IUser) => {
  const cleanBody = sanitize(body);

  const isUserExist = await UserModel.findOne({ email: cleanBody.email });
  if (isUserExist) {
    logger.warn("⚠️ Registration failed: User already exists");
    throw new AppError("User already exists!", 400);
  }

  const newUser = await UserModel.create(cleanBody);

  // Clear related cache
  await clearUserCache();

  logger.info(`✅ New user registered: ${newUser.email}`);
  return newUser;
};

// ================================= Login user =================================
const loginUserByEmail = async (email: string, password: string) => {
  const user = await UserModel.findOne({ email });

  if (!user) throw new AppError("User does not exist!", 404);

  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) throw new AppError("Incorrect password!", 401);

  const { password: _, ...userWithoutPassword } = user.toObject();
  return userWithoutPassword;
};

// ================================= Find single user =================================
const findUserById = async (id: string) => {
  const cleanId = sanitize(id);
  const cacheKey = `user:${cleanId}`;

  const cachedUser = await redisClient.get(cacheKey);
  if (cachedUser) {
    console.log("✅ Returning user from Redis cache");
    return JSON.parse(cachedUser);
  }

  console.log("🟡 Data from MongoDB (Cache miss)");
  const user = await UserModel.findById(cleanId);
  if (!user) throw new AppError("User not found!", 404);

  await redisClient.setEx(cacheKey, 3600, JSON.stringify(user));
  console.log("💾 Cached user data in Redis");

  return user;
};

// ================================= Find all users =================================
const getAllUsers = async (query: IUserQuery) => {
  const cacheKey = `users:${JSON.stringify(query)}`;

  const cached = await redisClient.get(cacheKey);
  if (cached) {
    console.log("✅ Returning users from Redis cache");
    return JSON.parse(cached);
  }

  const result = await genericQuery({
    model: UserModel,
    query: { ...query },
    searchFields: ["name", "email", "phone"],
    // select: "name email phone",
  });

  await redisClient.setEx(cacheKey, 1800, JSON.stringify(result));
  console.log("💾 Saved users to Redis cache");

  return result;
};

// ================================= Delete user (soft delete) =================================
const deleteUserById = async (id: string) => {
  const cleanId = sanitize(id);

  const user = await UserModel.findById(cleanId);
  if (!user) throw new AppError("Failed to delete user. User not found!", 404);

  user.isDeleted = true;
  await user.save();

  // Clear related cache
  await clearUserCache(cleanId);

  return user;
};

// ================================= Update user =================================
const updateUserById = async (id: string, updateData: IUpdateUserInput) => {
  const cleanId = sanitize(id);
  const cleanUpdateData = sanitize(updateData);

  const updatedUser = await UserModel.findOneAndUpdate(
    { _id: cleanId, isDeleted: false },
    cleanUpdateData,
    { new: true, runValidators: true }
  );

  if (!updatedUser)
    throw new AppError("User not found or has been deleted!", 404);

  // Clear related cache
  await clearUserCache(cleanId);

  return updatedUser;
};

// ================================= Refresh token =================================
interface JwtDecodedPayload {
  id: string;
  role?: string;
  iat?: number;
  exp?: number;
}

const requestRefreshToken = async (refreshToken: string) => {
  try {
    const decoded = jwt.verify(
      refreshToken,
      envVariable.JWT_REFRESH_TOKEN_SECRET as string
    ) as JwtDecodedPayload;

    const user = await UserModel.findById(decoded.id);
    if (!user) throw new AppError("User not found", 404);

    return user;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError)
      throw new AppError("Refresh token expired", 401);
    else if (err instanceof jwt.JsonWebTokenError)
      throw new AppError("Invalid refresh token", 401);
    throw err;
  }
};

// ============================== Export Services ==============================
export const userServices = {
  registerUserIntoDb,
  loginUserByEmail,
  findUserById,
  getAllUsers,
  deleteUserById,
  updateUserById,
  requestRefreshToken,
};
