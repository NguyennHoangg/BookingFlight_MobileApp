import type { Airport } from "../components/flight/AirportSelectModal";
import type { PassengerCounts } from "../components/flight/PassengerSelectModal";
import type { FlightItem } from "../api/flight.api";

export type SearchFlightParams = {
  tripType?: "mot-chieu" | "khu-hoi";
  departure?: Airport;
  arrival?: Airport;
  departDate?: string;
  returnDate?: string | null;
  passengers?: PassengerCounts;
  passengerSummary?: string;
  seatClass?: string;
};

export type FlightDetailParams = {
  flightId: string;
  selection?: {
    departureFlight: FlightItem;
    returnFlight?: FlightItem;
    search: SearchFlightParams;
  };
};

/** Chỉ truyền mã gói và số khách qua URL; dữ liệu cá nhân nằm trong state của form. */
export type PassengerInfoParams = {
  flights: { flightId: string; fareClassId: string }[];
  passengers: PassengerCounts;
};

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  Home: undefined;
  Checkin: undefined;
  Favorites: undefined;
  MyTickets: undefined;
  Profile: undefined;
  FlightDetail: FlightDetailParams;
  FareSelection: FlightDetailParams;
  PassengerInfo: PassengerInfoParams;
  SearchFlightResult: SearchFlightParams;
  TicketDetail: { bookingId: string };
  EditProfile: undefined;
  ChangePassword: undefined;
};
