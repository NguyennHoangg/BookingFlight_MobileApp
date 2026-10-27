import { query } from "../config/db.config";
import { AppError } from "../errors/AppError";
import { User } from "../types/User";

// Lay thong tin ho so nguoi dung kem so luong chuyen bay sap toi
const getProfile = async (id: string) => {
  try {
    const sql = `
      SELECT 
        u.id, 
        u.email, 
        u."fullName", 
        u.phone, 
        u."avatarUrl", 
        u."loyaltyPoints", 
        u."membershipTier", 
        u.gender, 
        u."dateOfBirth",
        COUNT(DISTINCT f.id)::int AS "upcomingFlights"
      FROM "User" u
      LEFT JOIN "Booking" b ON b."userId" = u.id AND b.status = 'CONFIRMED' AND b."isActive" = true
      LEFT JOIN "Ticket" t ON t."bookingId" = b.id AND t.status != 'CANCELLED' AND t."isActive" = true
      LEFT JOIN "Flight" f ON f.id = t."flightId" AND f."departureTime" > NOW() AND f.status != 'CANCELLED' AND f."isActive" = true
      WHERE u.id = $1
      GROUP BY u.id
    `;
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  } catch (error) {
    throw new AppError("Không tìm thấy thông tin hồ sơ", 404);
  }
};

// Cap nhat thong tin ho so nguoi dung
const updateProfile = async (
  id: string,
  data: {
    fullName?: string;
    phone?: string;
    avatarUrl?: string;
    gender?: boolean | null;
    dateOfBirth?: string | Date | null;
  }
) => {
  try {
    const sql = `
      UPDATE "User"
      SET 
        "fullName" = COALESCE($1, "fullName"),
        phone = COALESCE($2, phone),
        "avatarUrl" = COALESCE($3, "avatarUrl"),
        gender = COALESCE($4::boolean, gender),
        "dateOfBirth" = COALESCE($5::date, "dateOfBirth"),
        "updatedAt" = NOW()
      WHERE id = $6
      RETURNING id, email, "fullName", phone, "avatarUrl", "loyaltyPoints", "membershipTier", gender, "dateOfBirth"
    `;
    const values = [
      data.fullName ?? null,
      data.phone ?? null,
      data.avatarUrl ?? null,
      data.gender !== undefined ? data.gender : null,
      data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      id,
    ];
    const result = await query(sql, values);
    if (!result.rows[0]) {
      throw new AppError("Người dùng không tồn tại", 404);
    }
    return result.rows[0];
  } catch (error: any) {
    if (error.code === "23505") {
      throw new AppError("Số điện thoại này đã được sử dụng bởi tài khoản khác", 400);
    }
    throw error;
  }
};

// Lay mat khau ma hoa cua nguoi dung
const getPasswordHashById = async (id: string): Promise<string | null> => {
  const sql = `SELECT "passwordHash" FROM "User" WHERE id = $1`;
  const result = await query(sql, [id]);
  return result.rows[0]?.passwordHash || null;
};

// Cap nhat mat khau moi
const updatePassword = async (id: string, newPasswordHash: string) => {
  const sql = `UPDATE "User" SET "passwordHash" = $1, "updatedAt" = NOW() WHERE id = $2`;
  await query(sql, [newPasswordHash, id]);
};

export { 
  getProfile, 
  updateProfile, 
  getPasswordHashById, 
  updatePassword 
};

