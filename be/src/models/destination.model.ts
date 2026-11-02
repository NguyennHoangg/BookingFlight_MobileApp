import {query} from "../config/db.config";
import { AppError } from "../errors/AppError";

const getAllDestinations = async () => {
    try {
        const sql = `SELECT * FROM "Destination" WHERE "isPopular" = true`;
        const result = await query(sql);
        return result.rows;
    } catch (error) {
        throw new AppError("Error fetching destinations", 500);
    }

}

export { getAllDestinations };