import cors from "cors";

const corsOptions = {
    origin: "http://localhost:5173", // URL front-end
    methods: ["GET", "POST", "PUT", "DELETE"], // cho phép các method
    credentials: true, // cho phép gửi cookie
}

export default cors(corsOptions);