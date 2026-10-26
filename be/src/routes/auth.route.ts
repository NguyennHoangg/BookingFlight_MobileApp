import { Router } from "express";
import authController from "../controllers/auth.controller";
import { validateRegister, validateLogin } from "../middlewares/validate.middleware";
import authMiddleware from "../middlewares/auth.middleware";

const router = Router();

router.post("/login", validateLogin, authController.loginController);

router.post("/register", validateRegister, authController.registerController);

router.post("/logout", authMiddleware, authController.logoutController);

export default router;
