import { query, transactionQuery } from "../config/db.config";
import { AppError } from "../errors/AppError";
import { NextFunction, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { User } from "../types/User";

/**
 * Tạo user mới
 * @param user thông tin user
 * @returns user vừa tạo
 */
const registerUser = async ({
  email,
  passwordHash,
  fullName,
  phone,
}: {
  email: string;
  passwordHash: string;
  fullName: string;
  phone: string;
}) => {
  try {
    //random id cho user
    const id = uuidv4();

    //tạo user
    const user: User = {
      id,
      email,
      passwordHash,
      fullName,
      phone,
      avatarUrl: "",
      loyaltyPoints: 0,
      membershipTier: "MEMBER",
      role: "USER",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      gender: null,
      dateOfBirth: null
    };
    // bắt đầu transaction
    await query("BEGIN");

    //thêm thông tin vào user
    const text = `INSERT INTO "User" (id, email, "passwordHash", "fullName", phone, "avatarUrl", "loyaltyPoints", "membershipTier", role, "isActive", "createdAt", "updatedAt") 
                  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
                  RETURNING id, email, "fullName", phone, "avatarUrl", "loyaltyPoints", "membershipTier", role, "isActive", "createdAt", "updatedAt"`;
    const values = [
      user.id,
      user.email,
      user.passwordHash,
      user.fullName,
      user.phone,
      user.avatarUrl || null,
      user.loyaltyPoints ?? 0,
      user.membershipTier || "MEMBER",
      user.role || "USER",
      user.isActive ?? true,
      user.createdAt || new Date(),
      user.updatedAt || new Date(),
    ];
    const result = await query(text, values);

    //commit transaction
    await query("COMMIT");
    return result.rows[0];
  } catch (error) {
    console.error("Error creating user:", error);
    //rollback transaction nếu có lỗi
    await query("ROLLBACK");
    throw new AppError("Internal Server Error", 500);
  }
};

/**
 * Kiểm tra tài khoản user có tồn tại hay không
 * @param email email của user
 * @returns user
 */
const checkUserExits = async (email: string) => {
  try {
    const text = `SELECT id, "passwordHash", role, "fullName" FROM "User" WHERE email = $1`;
    const values = [email];
    const result = await query(text, values);
    return result.rows[0];
  } catch (error) {
    console.error("Error checking user existence:", error);
    throw new AppError("Internal Server Error", 500);
  }
};

/**
 * Tìm kiếm user theo email
 * @param email email của user
 * @returns user
 */
const findByIdentifier = async (identifierValue: string, type: string) => {
  try {
    let text = "";
    if(type == "email"){
      text = `SELECT id, email, "fullName", phone, "avatarUrl", "loyaltyPoints", "membershipTier", role, "isActive", "createdAt", "updatedAt" FROM "User" WHERE email = $1`;
    }else if(type == "phone"){
      text = `SELECT id, email, "fullName", phone, "avatarUrl", "loyaltyPoints", "membershipTier", role, "isActive", "createdAt", "updatedAt" FROM "User" WHERE phone = $1`;
    }
    const values = [identifierValue];
    const result = await query(text, values);
    return result.rows[0];
  } catch (error) {
    console.error("Error finding user by identifier:", error);
    throw new AppError("Internal Server Error", 500);
  }
};

const checkUserExitsByPhone = async (phone: string) => {
  try {
    const text = `SELECT id, "passwordHash", role, "fullName", phone, email FROM "User" WHERE phone = $1`;
    const values = [phone];
    const result = await query(text, values);
    return result.rows[0];
  } catch (error) {
    console.error("Error finding user by phone:", error);
    throw new AppError("Internal Server Error", 500);
  }
};

export default {
  registerUser,
  checkUserExits,
  findByIdentifier,
  checkUserExitsByPhone,
};
