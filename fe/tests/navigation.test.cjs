/* global __dirname */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
function load(file, dependencies = {}) {
  const source = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    console,
    process: { env: {} },
    require: (id) => {
      if (id in dependencies) {
        const dependency = dependencies[id];
        return dependency && "default" in dependency
          ? { __esModule: true, ...dependency }
          : dependency;
      }
      throw new Error(`Unexpected dependency: ${id}`);
    },
  });
  return exports;
}
const validation = load("src/navigation/validation.ts");
const airport = (code) => ({
  id: code,
  code,
  city: code,
  name: code,
  country: "VN",
});
const search = {
  tripType: "khu-hoi",
  departure: airport("SGN"),
  arrival: airport("HAN"),
  departDate: "2026-11-01",
  returnDate: "2026-11-03",
  passengers: { adults: 2, children: 1, infants: 0 },
  seatClass: "Economy",
};
const flight = (id) => ({
  flightId: id,
  flightNumber: id,
  airline: { name: "Airline" },
  departure: { airportCode: "SGN", time: "08:00" },
  arrival: { airportCode: "HAN", time: "10:00" },
  ticket: { price: 100 },
});

test("round-trip navigation preserves both legs, dates and passengers through URL serialization", () => {
  let target;
  const routes = load("src/navigation/routes.ts", {
    "expo-router": {
      router: {
        navigate: (value) => {
          target = value;
        },
      },
    },
  });
  routes.navigate("FlightDetail", {
    flightId: "outbound",
    selection: {
      departureFlight: flight("outbound"),
      returnFlight: flight("inbound"),
      search,
    },
  });
  assert.equal(target.pathname, "/FlightDetail");
  const parsed = validation.parseFlightDetail(
    routes.readRouteData(target.params.data),
  );
  assert.equal(parsed.selection.departureFlight.flightId, "outbound");
  assert.equal(parsed.selection.returnFlight.flightId, "inbound");
  assert.equal(parsed.selection.search.passengers.adults, 2);
  assert.equal(parsed.selection.search.returnDate, "2026-11-03");
});

test("invalid and incomplete deep-link data cannot become a booking selection", () => {
  for (const invalid of [
    null,
    [],
    {},
    { ...search, departure: search.arrival },
    { ...search, returnDate: "2026-10-01" },
    { ...search, departDate: "2026-02-31" },
    { ...search, passengers: { adults: 0, children: 1, infants: 0 } },
  ]) {
    assert.equal(validation.parseSearchParams(invalid), undefined);
  }
  assert.equal(
    validation.parseFlightDetail({
      flightId: "outbound",
      selection: { departureFlight: flight("outbound"), search },
    }),
    undefined,
  );
  assert.equal(
    validation.parseFlightDetail({
      flightId: "other",
      selection: {
        departureFlight: flight("outbound"),
        returnFlight: flight("inbound"),
        search,
      },
    }),
    undefined,
  );
});

test("one-way selection has no return flight and malformed JSON is handled safely", () => {
  const routes = load("src/navigation/routes.ts", {
    "expo-router": { router: {} },
  });
  assert.equal(routes.readRouteData("{bad"), undefined);
  assert.equal(routes.readRouteData(["{}", "{}"]), undefined);
  const parsed = validation.parseFlightDetail({
    flightId: "outbound",
    selection: {
      departureFlight: flight("outbound"),
      search: { ...search, tripType: "mot-chieu", returnDate: null },
    },
  });
  assert.equal(parsed.selection.returnFlight, undefined);
});

test("Back falls back to Home when a deep link has no previous screen", () => {
  const actions = [];
  let hasHistory = false;
  const routes = load("src/navigation/routes.ts", {
    "expo-router": {
      router: {
        canGoBack: () => hasHistory,
        back: () => actions.push("back"),
        replace: (path) => actions.push(path),
      },
    },
  });
  routes.goBack();
  hasHistory = true;
  routes.goBack();
  assert.deepEqual(actions, ["/", "back"]);
});

function authModule(api, storage) {
  return load("src/store/slices/authSlice.ts", {
    "@reduxjs/toolkit": require("@reduxjs/toolkit"),
    "../../api/auth.api": { default: api },
    "../../utils/storage": { default: storage },
  });
}

test("login and restored sessions authenticate; logout removes access before the server responds", async () => {
  const { configureStore } = require("@reduxjs/toolkit");
  let resolveLogout;
  let cleared = false;
  const user = { id: "user-1", fullName: "Test", email: "test@example.com" };
  const auth = authModule(
    {
      logout: () =>
        new Promise((resolve) => {
          resolveLogout = resolve;
        }),
    },
    {
      clearAuth: async () => {
        cleared = true;
      },
      getToken: async () => "saved",
      getRefreshToken: async () => "refresh",
      getUser: async () => user,
    },
  );
  const store = configureStore({ reducer: { auth: auth.default } });
  await store.dispatch(auth.initAuth());
  assert.equal(store.getState().auth.isInitialized, true);
  assert.equal(store.getState().auth.isAuthenticated, true);
  const logout = store.dispatch(auth.logoutUser());
  assert.equal(store.getState().auth.isAuthenticated, false);
  assert.equal(store.getState().auth.token, null);
  assert.equal(cleared, true);
  // A late logout response must never wipe a newly authenticated session.
  store.dispatch(
    auth.loginUser.fulfilled(
      { user, token: { accessToken: "new-session" } },
      "login",
      {},
    ),
  );
  resolveLogout();
  await logout;
  assert.equal(store.getState().auth.isAuthenticated, true);
  assert.equal(store.getState().auth.token, "new-session");
});

test("403 and stale 401 responses preserve the session; current-token 401 resets it", async () => {
  let responseError;
  let token = "current";
  let resets = 0;
  let clears = 0;
  const client = {
    interceptors: {
      response: {
        use: (_, handler) => {
          responseError = handler;
        },
      },
      request: { use() {} },
    },
  };
  load("src/api/clientApi.ts", {
    axios: { default: { create: () => client } },
    "react-native": { Platform: { OS: "web" } },
    "expo-constants": { default: {} },
    "../store": {
      store: {
        getState: () => ({ auth: { token } }),
        dispatch: () => {
          resets++;
          token = null;
        },
      },
    },
    "../store/slices/authSlice": {
      resetAuth: () => ({ type: "auth/resetAuth" }),
    },
    "../utils/storage": {
      default: {
        clearAuth: async () => {
          clears++;
        },
      },
    },
  });
  const fail = async (status, requestToken, url = "/auth/profile") => {
    const error = {
      response: { status },
      config: { url, headers: { Authorization: `Bearer ${requestToken}` } },
    };
    await assert.rejects(responseError(error));
  };
  await fail(403, "current");
  await fail(401, "old-session");
  await fail(401, "current", "/auth/login");
  assert.equal(resets, 0);
  await fail(401, "current");
  assert.equal(resets, 1);
  assert.equal(clears, 1);
});

test("flight API uses backend endpoints and propagates failures instead of returning mock data", async () => {
  const calls = [];
  const api = load("src/api/flight.api.ts", {
    "./clientApi": {
      clientApi: {
        post: async (url, body, options) => {
          calls.push({ url, body, options });
          return { data: { status: "success", data: [] } };
        },
      },
    },
  });
  const signal = new AbortController().signal;
  const body = {
    departureCode: "SGN",
    arrivalCode: "HAN",
    departDate: "2026-11-01",
    passengers: 2,
    seatClass: "Phổ thông",
  };
  assert.equal((await api.searchFlights(body, signal)).length, 0);
  assert.equal(calls[0].url, "/flights/conditions");
  assert.equal(calls[0].body, body);
  assert.equal(calls[0].options.signal, signal);
  await api.getFlightCalendar(
    { ...body, startDate: body.departDate, endDate: "2026-11-07" },
    signal,
  );
  assert.equal(calls[1].url, "/flights/calendar");
  const failing = load("src/api/flight.api.ts", {
    "./clientApi": {
      clientApi: {
        post: async () => {
          throw new Error("offline");
        },
      },
    },
  });
  await assert.rejects(failing.searchFlights(body), /offline/);
  const malformed = load("src/api/flight.api.ts", {
    "./clientApi": { clientApi: { post: async () => ({ data: {} }) } },
  });
  await assert.rejects(malformed.searchFlights(body));
  const base = flight("same-flight");
  assert.notEqual(
    api.getFlightKey({
      ...base,
      ticket: { ...base.ticket, fareClassId: "eco" },
    }),
    api.getFlightKey({
      ...base,
      ticket: { ...base.ticket, fareClassId: "business" },
    }),
  );
});

test("fare selection preserves an available choice and cannot produce a partial round-trip total", () => {
  const fares = load("src/utils/fare.ts");
  const makeFare = (id, price, seats) => ({
    ...flight("test-flight"),
    ticket: {
      ...flight("test-flight").ticket,
      fareClassId: id,
      price,
      availableSeats: seats,
    },
  });
  const cheap = makeFare("eco", 100, 2);
  const flexible = makeFare("flex", 150, 3);
  const soldOut = makeFare("sold-out", 1, 0);
  assert.equal(
    fares.resolveSelectedFare([cheap, flexible, soldOut], "flex", 2),
    flexible,
  );
  assert.equal(
    fares.resolveSelectedFare([cheap, flexible, soldOut], "missing", 2),
    cheap,
  );
  assert.equal(
    fares.resolveSelectedFare([cheap, soldOut], "eco", 3),
    undefined,
  );
  assert.equal(fares.calculateFareTotal([cheap, flexible], 2), 500);
  assert.equal(fares.calculateFareTotal([cheap, undefined], 2), null);
});

test("passenger form validates birthdays at travel date, contact details and route counts", () => {
  const forms = load("src/utils/passengerForm.ts");
  assert.equal(forms.parseBirthday("31/02/2026"), undefined);
  assert.equal(forms.parseBirthday("29/02/2024"), "2024-02-29");
  assert.equal(forms.ageOnDate("2014-11-02", "2026-11-01"), 11);
  const drafts = forms.createPassengerDrafts({
    adults: 1,
    children: 1,
    infants: 1,
  });
  assert.deepEqual(
    Array.from(drafts, (draft) => draft.kind),
    ["adult", "child", "infant"],
  );
  const validPassengers = [
    {
      ...drafts[0],
      name: "Test Adult",
      surname: "TEST",
      givenName: "ADULT",
      gender: "male",
      identity: "TEST12345",
      birthday: "01/01/1990",
    },
    {
      ...drafts[1],
      name: "Test Child",
      surname: "TEST",
      givenName: "CHILD",
      gender: "female",
      identity: "",
      birthday: "01/01/2020",
    },
    {
      ...drafts[2],
      name: "Test Infant",
      surname: "TEST",
      givenName: "INFANT",
      gender: "male",
      identity: "",
      birthday: "01/01/2026",
    },
  ];
  const contact = {
    name: "Test Contact",
    email: "test@example.com",
    phone: "+84901234567",
  };
  assert.equal(
    Object.keys(
      forms.validatePassengerForm(validPassengers, contact, "2026-11-01"),
    ).length,
    0,
  );
  const errors = forms.validatePassengerForm(
    [{ ...validPassengers[0], birthday: "01/01/2030" }],
    { ...contact, email: "bad", phone: "bad" },
    "2026-11-01",
  );
  assert.ok(errors["passengers.0.birthday"]);
  assert.ok(errors["contact.email"]);
  assert.ok(errors["contact.phone"]);
  assert.equal(
    validation.parsePassengerInfo({
      flights: [{ flightId: "f1", fareClassId: "fare1" }],
      passengers: { adults: 1, children: 0, infants: 0 },
    }).flights[0].fareClassId,
    "fare1",
  );
  assert.equal(
    validation.parsePassengerInfo({
      flights: [
        { flightId: "f1", fareClassId: "fare1" },
        { flightId: "f1", fareClassId: "fare2" },
      ],
      passengers: { adults: 1, children: 0, infants: 0 },
    }),
    undefined,
  );
});

test("fare endpoint loads fresh inventory for the exact flight and passenger count", async () => {
  let request;
  const api = load("src/api/flight.api.ts", {
    "./clientApi": {
      clientApi: {
        get: async (url, options) => {
          request = { url, options };
          return { data: { status: "success", data: [] } };
        },
      },
    },
  });
  const signal = new AbortController().signal;
  await api.getFlightFares("flight/id", 3, signal);
  assert.equal(request.url, "/flights/flight%2Fid/fares");
  assert.equal(request.options.params.passengers, 3);
  assert.equal(request.options.signal, signal);
});

test("new passenger fields require separate names, gender and adult document", () => {
  const forms = load("src/utils/passengerForm.ts");
  const draft = forms.createPassengerDrafts({
    adults: 1,
    children: 0,
    infants: 0,
  })[0];
  const errors = forms.validatePassengerForm(
    [{ ...draft, birthday: "01/01/1990" }],
    { name: "Test Contact", email: "test@example.com", phone: "+84901234567" },
    "2026-11-01",
  );
  for (const key of ["surname", "givenName", "gender", "identity"])
    assert.ok(errors[`passengers.0.${key}`]);
  assert.equal(
    forms.fullPassengerName({
      ...draft,
      surname: "NGUYEN",
      givenName: "MINH ANH",
    }),
    "NGUYEN MINH ANH",
  );
});

test("booking option APIs use authenticated saved-passenger route and real seat endpoint", async () => {
  const calls = [];
  const api = load("src/api/bookingOptions.api.ts", {
    "./clientApi": {
      clientApi: {
        get: async (url, options) => {
          calls.push({ url, options });
          return { data: { status: "success", data: [] } };
        },
      },
    },
  });
  await api.getSavedPassengers();
  await api.getFlightSeats("flight-id");
  assert.equal(calls[0].url, "/auth/passengers");
  assert.equal(calls[1].url, "/flights/flight-id/seats");
});

const seatMap = load("src/utils/seatMap.ts");
const seat = (number, extra = {}) => ({ id: number, seatNumber: number, seatClass: "ECONOMY", seatType: "MIDDLE", priceModifier: 50000, available: true, ...extra });
const seatLegs = [{ flightId: "out", seatClass: "ECONOMY" }, { flightId: "back", seatClass: "BUSINESS" }];

test("seat rows sort numerically and preserve missing cells and two aisles", () => {
  const groups = [["A", "C"], ["D", "E", "F", "G"], ["H", "K"]];
  const rows = seatMap.buildSeatRows([seat("99B"), seat("12K"), seat("2D"), seat("12A"), seat("12D", { seatType: "EXIT_ROW" })], groups);
  assert.deepEqual(Array.from(rows, (row) => row.number), [2, 12]);
  assert.equal(rows[1].groups[0][1], null);
  assert.equal(rows[1].groups[2][1].seatNumber, "12K");
  assert.equal(rows[1].exit, true);
  assert.deepEqual(Array.from(rows[1].groups, (group) => group.length), [2, 4, 2]);
});

test("seat selection prevents duplicates, booked seats and wrong cabins; tapping again deselects", () => {
  let choices = seatMap.assignSeat([], seatLegs[0], 0, seat("12A"));
  assert.equal(choices.length, 1);
  assert.equal(seatMap.assignSeat(choices, seatLegs[0], 1, seat("12A")).length, 1);
  assert.equal(seatMap.assignSeat(choices, seatLegs[0], 0, seat("12B", { available: false }))[0].seatNumber, "12A");
  assert.equal(seatMap.assignSeat(choices, seatLegs[1], 0, seat("12B")).length, 1);
  choices = seatMap.assignSeat(choices, seatLegs[0], 0, seat("12B"));
  assert.equal(choices.length, 1);
  assert.equal(choices[0].seatNumber, "12B");
  assert.equal(seatMap.assignSeat(choices, seatLegs[0], 0, seat("12B")).length, 0);
});

test("fresh inventory removes locks, wrong flights, missing columns and reprices surviving seats", () => {
  const first = seatMap.assignSeat([], seatLegs[0], 0, seat("12A"));
  const choices = seatMap.assignSeat(first, seatLegs[0], 1, seat("12B"));
  const maps = [{ columnGroups: [["A", "B"], ["C", "D"]], seats: [seat("12A", { priceModifier: 120000 }), seat("12B", { available: false, status: "LOCKED" })] }, { columnGroups: [["A"], ["D"]], seats: [seat("12A", { seatClass: "BUSINESS" })] }];
  const valid = seatMap.reconcileSeatChoices(choices, maps, seatLegs, [0, 1]);
  assert.equal(valid.length, 1);
  assert.equal(valid[0].price, 120000);
  assert.equal(seatMap.reconcileSeatChoices([{ ...first[0], flightId: "back" }], maps, seatLegs, [0]).length, 1);
  assert.equal(seatMap.reconcileSeatChoices([{ ...first[0], flightId: "missing" }], maps, seatLegs, [0]).length, 0);
  assert.equal(seatMap.reconcileSeatChoices(first, [{ ...maps[0], columnGroups: [["C"], ["D"]] }], seatLegs, [0]).length, 0);
  assert.equal(seatMap.reconcileSeatChoices(first, maps, seatLegs, [1]).length, 0);
});

test("all passengers need a seat on each leg; duplicate initial assignments cannot pass reconciliation", () => {
  const choices = seatMap.assignSeat([], seatLegs[0], 0, seat("12A"));
  assert.equal(seatMap.seatSelectionComplete(choices, seatLegs, [0]), false);
  const complete = seatMap.assignSeat(choices, seatLegs[1], 0, seat("1A", { seatClass: "BUSINESS" }));
  assert.equal(seatMap.seatSelectionComplete(complete, seatLegs, [0]), true);
  assert.equal(seatMap.seatSelectionComplete(complete, seatLegs, [0, 1]), false);
  const map = { columnGroups: [["A"], ["B"]], seats: [seat("12A")] };
  assert.equal(seatMap.reconcileSeatChoices([choices[0], { ...choices[0], passengerIndex: 1 }], [map], [seatLegs[0]], [0, 1]).length, 1);
});

test("seat-map endpoint returns explicit geometry and rejects an unconfigured aircraft", async () => {
  let url;
  let result = { aircraft: { id: "ac", model: "Aircraft", seatLayout: "2-4-2", totalSeats: 8 }, columnGroups: [["A", "C"], ["D", "E", "F", "G"], ["H", "K"]], seats: [seat("12A")] };
  const api = load("src/api/bookingOptions.api.ts", { "./clientApi": { clientApi: { get: async (path) => { url = path; return { data: { status: "success", data: result } }; } } } });
  const response = await api.getFlightSeatMap("flight/id");
  assert.equal(url, "/flights/flight%2Fid/seat-map");
  assert.equal(response.columnGroups.length, 3);
  result = { ...result, columnGroups: [] };
  await assert.rejects(api.getFlightSeatMap("flight/id"));
});

test("window and aisle descriptions follow geometry even with legacy seat-type metadata", () => {
  const groups = [["A", "C"], ["D", "E", "F", "G"], ["H", "K"]];
  assert.equal(seatMap.seatLocation(seat("12F", { seatType: "WINDOW" }), groups), "Ghế giữa");
  assert.equal(seatMap.seatLocation(seat("12G"), groups), "Lối đi");
  assert.equal(seatMap.seatLocation(seat("12K"), groups), "Cửa sổ");
  assert.equal(seatMap.seatLocation(seat("12K", { seatType: "EXIT_ROW" }), groups), "Hàng thoát hiểm");
});
