export type SearchFlightParams = {
  tripType?: 'mot-chieu' | 'khu-hoi';
  departure?: any;
  arrival?: any;
  departDate?: string;
  returnDate?: string | null;
  passengers?: any;
  seatClass?: string;
};

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  FlightDetail: { flightId: string };
  EditProfile: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Search: SearchFlightParams | undefined;
  Favorites: undefined;
  MyTickets: undefined;
  Profile: undefined;
};
