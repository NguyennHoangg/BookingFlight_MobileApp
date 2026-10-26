import jwt from "jsonwebtoken";

const generateToken = (user: any) => {
    return jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "1d" })
}

const verifyToken = (token: string) => {
    return jwt.verify(token, process.env.JWT_SECRET)
}

const decodeToken = (token: string) => {
    return jwt.decode(token)
}

export { generateToken, verifyToken, decodeToken }