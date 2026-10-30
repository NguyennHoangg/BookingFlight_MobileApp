import { getAllDestinations } from "../models/destination.model";

const getDestinationsService = async () => {
    try {
        const destinations = await getAllDestinations();
        return destinations;
    } catch (error) {
        throw new Error("Error fetching destinations");
    }
}

export { getDestinationsService };