import { validationResult } from "express-validator";
import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";
import {body} from 'express-validator';

//Regex password: Tối thiểu 8 ký tự, ít nhất 1 chữ thường, 1 chữ hoa, 1 số, 1 ký tự đặc biệt
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

//Regex phone: 10 số, bắt đầu bằng 03, 05, 07, 08, 09
const phoneRegex = /^(\+84|84|0)([3|5|7|8|9])[0-9]{8}$/;
//Regex email
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const identifierValueRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$|^(\+84|84|0)([3|5|7|8|9])[0-9]{8}$/;
//Regex fullName
const fullNameRegex = /^[A-Za-zÀ-ỹ]+(?:\s+[A-Za-zÀ-ỹ]+)*$/;

export const validateMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return next(new AppError(errors.array()[0].msg, 400));
    }
    next();
}

export const validateRegister = [
    body('email').matches(emailRegex).withMessage('Email không hợp lệ!'),
    body('password').matches(passwordRegex).withMessage('Mật khẩu không hợp lệ! (ít nhất 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt)'),
    body('fullName').matches(fullNameRegex).withMessage('Họ tên không hợp lệ!'),
    body('phone')
        .custom((value, { req }) => {
            const phoneVal = value || req.body.phoneNumber;
            if (!phoneVal || !phoneRegex.test(phoneVal)) {
                throw new Error('Số điện thoại không hợp lệ!');
            }
            req.body.phone = phoneVal;
            return true;
        }),
    validateMiddleware
]

export const validateLogin = [
    body('identifierValue').matches(identifierValueRegex).withMessage('Email hoặc số điện thoại không hợp lệ!'),
    body('password').matches(passwordRegex).withMessage('Mật khẩu không hợp lệ! (ít nhất 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt)'),
    validateMiddleware
]