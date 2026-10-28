import { router } from "expo-router";
import type { RootStackParamList } from "./types";

const paths = {
  Login: "/Login",
  Register: "/Register",
  MainTabs: "/",
  Home: "/",
  Checkin: "/Checkin",
  Favorites: "/Favorites",
  MyTickets: "/MyTickets",
  Profile: "/Profile",
  PassengerInfo: "/PassengerInfo",
  FlightDetail: "/FlightDetail",
  FareSelection: "/FareSelection",
  SearchFlightResult: "/SearchFlightResult",
  TicketDetail: "/TicketDetail",
  EditProfile: "/EditProfile",
  ChangePassword: "/ChangePassword",
} as const;

// URL parameters must be strings on native and web. A single encoder keeps objects
// such as airport/passenger selections intact across reloads and deep links.
export function navigate<K extends keyof RootStackParamList>(
  name: K,
  ...args: RootStackParamList[K] extends undefined
    ? []
    : [params: RootStackParamList[K]]
) {
  const params = args[0];
  router.navigate(
    params === undefined
      ? paths[name]
      : {
          pathname: paths[name],
          params: { data: JSON.stringify(params) },
        },
  );
}

export function readRouteData(value: string | string[] | undefined): unknown {
  if (typeof value !== "string") return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace("/");
}
