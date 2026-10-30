import { useEffect, useState } from "react";
import { getAirportList, type Airport } from "../api/airport.api";
import { getDestinations } from "../api/destination.api";
import { useAppDispatch, useAppSelector } from "../store";
import { setDestinations } from "../store/slices/destination";

const useAirport = () => {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [destinationsLoading, setDestinationsLoading] = useState(true);
  const [destinationsError, setDestinationsError] = useState<string | null>(null);
  const destinations = useAppSelector((state) => state.destination);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const fetchAirports = async () => {
      setLoading(true);
      try {
        const result = await getAirportList();
        setAirports(result.data);
      } catch (error) {
        setError(error as Error);
      } finally {
        setLoading(false);
      }
    };

    const fetchDestinations = async () => {
      setDestinationsLoading(true);
      setDestinationsError(null);
      try {
        const data = await getDestinations();
        dispatch(setDestinations(data.data));
      } catch {
        setDestinationsError("Không thể tải điểm đến. Vui lòng thử lại sau.");
      } finally {
        setDestinationsLoading(false);
      }
    };

    fetchAirports();
    fetchDestinations();
  }, [dispatch]);

  return { airports, loading, error, destinations, destinationsLoading, destinationsError };
};

export default useAirport;
