import { useEffect, useState } from "react";
import airportApi from "../api/airport.api";
import { Airport } from "../api/airport.api";

const useAirport = () => {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAirports = async () => {
      setLoading(true);
      try {
        const result = await airportApi.getAirportList();
        setAirports(result.data);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAirports();
  }, []);

  return { airports, loading };
};

export default useAirport;
