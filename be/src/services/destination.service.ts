import { getAllDestinations } from "../models/destination.model";
import { publicCache } from "../redis/publicCache";

const getDestinationsService = async () => {
    try {
        const destinations = await publicCache.remember("destinations", [], 300, getAllDestinations);
        return destinations;
    } catch (error) {
        throw new Error("Error fetching destinations");
    }
}

export { getDestinationsService };
