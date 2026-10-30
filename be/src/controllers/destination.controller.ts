import { getDestinationsService } from "../services/destination.service";
import { Request, Response } from "express";

export const getDestinationsController = async (req: any, res: any) => {
    try {
        const destinations = await getDestinationsService();
        return res.status(200).json({
            success: true,
            message: "Destinations fetched successfully",
            data: destinations,
        });
    }  catch (error) {
        res.status(500).json({ message: "Error fetching destinations" });
    }
}