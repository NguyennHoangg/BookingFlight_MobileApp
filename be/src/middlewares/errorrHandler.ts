import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";


const errorHandler = (err:AppError, req: Request, res: Response, next: NextFunction) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";

    //Nếu là môi trường phát triển thì trả về lỗi chi tiết
    if(process.env.NODE_ENV === "development"){
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack,
        });
    }
    //Nếu là môi trường production thì trả về lỗi chung để bảo mật
    else{
        if(err.isOperational){
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            });
        }
        //Nếu không phải lỗi operational thì trả về lỗi chung
        else{
            console.error("Error", err);
            return res.status(500).json({
                status: "error",
                message: "Something went very wrong!",
            });
        }
    }
}

export default errorHandler;
