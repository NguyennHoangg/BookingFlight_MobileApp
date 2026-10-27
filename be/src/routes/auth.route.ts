import { Router } from "express";
import authController from "../controllers/auth.controller";
import { validateRegister, validateLogin } from "../middlewares/validate.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  getUserProfileController,
  updateUserProfileController,
  changePasswordController,
} from "../controllers/user.controller";

const router = Router();

// Dang nhap tai khoan
router.post("/login", validateLogin, authController.loginController);

// Dang ky tai khoan
router.post("/register", validateRegister, authController.registerController);

// Dang xuat tai khoan (khong chan boi authMiddleware de cho phep logout ngay ca khi token het han)
router.post("/logout", authController.logoutController);

// Xem thong tin ho so
router.get("/profile", authMiddleware, getUserProfileController);

// Cap nhat thong tin ho so
router.put("/profile", authMiddleware, updateUserProfileController);

// Doi mat khau
router.put("/change-password", authMiddleware, changePasswordController);

export default router;
