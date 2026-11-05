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
      jsx: ts.JsxEmit.React,
    },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    console,
    AbortController,
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

test("assistant API sends conversation and confirmation separately, with cancellation and AI timeout", async () => {
  const calls = [];
  const expected = { status: "ready", message: "SGN → HAN", plan: { departureCode: "SGN" } };
  const api = load("src/api/assistant.api.ts", {
    "./clientApi": { clientApi: { post: async (...args) => { calls.push(args); return { data: { data: expected } }; } } },
  });
  const signal = new AbortController().signal;
  const messages = [{ role: "user", content: "Đi Hà Nội ngày mai" }];
  assert.equal(await api.interpretFlightRequest(messages, signal), expected);
  assert.equal(await api.searchAssistantFlights(expected.plan, signal), expected);
  assert.equal(calls[0][0], "/assistant/interpret");
  assert.equal(calls[0][1].messages, messages);
  assert.equal(calls[1][0], "/assistant/search");
  assert.equal(calls[1][1].plan, expected.plan);
  for (const call of calls) {
    assert.equal(call[2].signal, signal);
    assert.equal(call[2].timeout, 35000);
  }
});

test("assistant API propagates configuration and connection errors for the retry UI", async () => {
  const failure = new Error("AI unavailable");
  const api = load("src/api/assistant.api.ts", {
    "./clientApi": { clientApi: { post: async () => { throw failure; } } },
  });
  const signal = new AbortController().signal;
  await assert.rejects(api.interpretFlightRequest([], signal), error => error === failure);
  await assert.rejects(api.searchAssistantFlights({}, signal), error => error === failure);
});
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
  let logoutCredentials;
  let cleared = false;
  const user = { id: "user-1", fullName: "Test", email: "test@example.com" };
  const auth = authModule(
    {
      logout: (...credentials) => {
        logoutCredentials = credentials;
        return new Promise((resolve) => {
          resolveLogout = resolve;
        });
      },
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
  assert.deepEqual(logoutCredentials, ["saved", "refresh"]);
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

test("logout keeps its original credentials when a new session starts before the request is sent", async () => {
  let requestHandler;
  const client = { interceptors: {
    request: { use: handler => { requestHandler = handler; } },
    response: { use() {} },
  } };
  load("src/api/clientApi.ts", {
    axios: { default: { create: () => client } },
    "react-native": { Platform: { OS: "web" } },
    "expo-constants": { default: {} },
    "../store": { store: { getState: () => ({ auth: { token: "new-session" } }) } },
  });
  const outgoing = [];
  const api = load("src/api/auth.api.ts", {
    "./clientApi": { default: { post: async (url, body, config) => {
      const request = requestHandler({ url, ...config });
      outgoing.push({ request, body });
    } } },
  }).default;
  await api.logout("old-session", "old-refresh");
  assert.equal(outgoing[0].request.headers.Authorization, "Bearer old-session");
  assert.equal(outgoing[0].body.refreshToken, "old-refresh");
  assert.equal(requestHandler({ headers: {} }).headers.Authorization, "Bearer new-session");
});

test("profile logout confirmation opens on web, can be cancelled, and invokes logout on confirmation", () => {
  const React = require("react");
  const states = [];
  let cursor = 0;
  let logouts = 0;
  const screen = load("src/screens/profile/Profile.tsx", {
    react: { default: React, useEffect() {}, useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = initial;
      return [states[index], value => { states[index] = value; }];
    } },
    "../../navigation/routes": { navigate() {} },
    "react-native": Object.fromEntries(["View", "Text", "ScrollView", "Image", "TouchableOpacity", "Modal", "RefreshControl"].map(name => [name, name])),
    "react-native-safe-area-context": { SafeAreaView: "SafeAreaView" },
    "@expo/vector-icons": { Ionicons: "Icon", MaterialCommunityIcons: "Icon" },
    "../../hook/useAuth": { useAuth: () => ({ user: { avatarUrl: "https://example.com/avatar.png" },
      isAuthenticated: true, token: "session", profile() {}, logout() { logouts++; } }) },
  });
  const render = () => { cursor = 0; return screen.default(); };
  const find = (node, predicate) => {
    if (!node || typeof node !== "object") return undefined;
    if (Array.isArray(node)) {
      for (const child of node) { const match = find(child, predicate); if (match) return match; }
      return undefined;
    }
    return predicate(node) ? node : find(node.props?.children, predicate);
  };
  const modal = tree => find(tree, node => node.type === "Modal");
  const open = tree => find(tree, node => node.props?.accessibilityLabel === "Đăng xuất").props.onPress();
  const button = (tree, label) => find(tree, node => node.type === "TouchableOpacity" && node.props.children?.props?.children === label);
  let tree = render();
  assert.equal(modal(tree).props.visible, false);
  open(tree);
  tree = render();
  assert.equal(modal(tree).props.visible, true);
  button(modal(tree), "Hủy").props.onPress();
  tree = render();
  assert.equal(modal(tree).props.visible, false);
  assert.equal(logouts, 0);
  open(tree);
  tree = render();
  button(modal(tree), "Đăng xuất").props.onPress();
  assert.equal(logouts, 1);
  assert.equal(modal(render()).props.visible, false);
});

test("profile requests stop after logout and late responses cannot restore another session's user", async () => {
  const { configureStore } = require("@reduxjs/toolkit");
  let calls = 0;
  let resolveProfile;
  let writes = 0;
  const auth = authModule({ getProfileApi: () => {
    calls++;
    return new Promise(resolve => { resolveProfile = resolve; });
  } }, { setUser: async () => { writes++; } });
  const store = configureStore({ reducer: { auth: auth.default } });
  await store.dispatch(auth.fetchProfile());
  assert.equal(calls, 0);
  store.dispatch(auth.setCredentials({ user: { id: "old-user" }, token: "old-token" }));
  const pending = store.dispatch(auth.fetchProfile());
  assert.equal(calls, 1);
  store.dispatch(auth.resetAuth());
  await store.dispatch(auth.fetchProfile());
  assert.equal(calls, 1);
  store.dispatch(auth.setCredentials({ user: { id: "new-user" }, token: "new-token" }));
  resolveProfile({ data: { id: "old-user", fullName: "Stale profile" } });
  await pending;
  assert.equal(store.getState().auth.user.id, "new-user");
  assert.equal(writes, 0);
});

test("permission errors and stale credentials preserve the session; current-token auth failures reset it", async () => {
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
  const fail = async (status, requestToken, url = "/auth/profile", message) => {
    const error = {
      response: { status, data: { message } },
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
  token = "new-session";
  const expiredMessage = "Token không hợp lệ hoặc đã hết hạn";
  await fail(403, "old-session", "/flights/flight/favorite", expiredMessage);
  await fail(403, "new-session", "/auth/login", expiredMessage);
  await fail(403, "new-session", "/auth/passengers", "Bạn không có quyền truy cập");
  assert.equal(resets, 1);
  await fail(403, "new-session", "/auth/passengers", expiredMessage);
  assert.equal(resets, 2);
  assert.equal(clears, 2);
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

const booking = load("src/utils/booking.ts");
const bookingState = load("src/store/slices/bookingSlice.ts", {
  "@reduxjs/toolkit": require("@reduxjs/toolkit"),
  "../../utils/booking": booking,
});
function bookingInput() {
  return {
    params: { flights: [{ flightId: "out", fareClassId: "eco" }], passengers: { adults: 1, children: 1, infants: 1 } },
    fares: [{ ...flight("out"), ticket: { price: 1000000 } }, { ...flight("back"), ticket: { price: 900000 } }],
    passengers: [{ kind: "adult", name: "Adult" }, { kind: "child", name: "Child" }, { kind: "infant", name: "Infant" }],
    contact: { name: "Adult", phone: "+84912345678", email: "test@example.com" },
    seats: [{ flightId: "out", passengerIndex: 0, price: 120000 }],
  };
}
test("booking total counts each leg and passenger once, excludes infant and stale service keys", () => {
  const selection = { baggageKg: 20, insurance: true, priority: false, meal: false };
  const draft = { ...bookingInput(), services: { "out:0": selection, "back:1": selection, "out:2": selection, "missing:0": selection } };
  const totals = booking.bookingTotals(draft);
  assert.equal(totals.fare, 5700000);
  assert.equal(totals.seats, 120000);
  assert.equal(totals.services, 750000);
  assert.equal(totals.total, 6570000);
});
test("services remain independent per passenger/leg and survive editing the same booking", () => {
  const reducer = bookingState.default;
  let state = reducer(undefined, bookingState.startBooking(bookingInput()));
  state = reducer(state, bookingState.updateServices({ flightId: "out", passengerIndex: 0, changes: { baggageKg: 15 } }));
  state = reducer(state, bookingState.updateServices({ flightId: "back", passengerIndex: 1, changes: { meal: true } }));
  state = reducer(state, bookingState.startBooking({ ...bookingInput(), contact: { name: "Edited" } }));
  assert.equal(state.draft.services["out:0"].baggageKg, 15);
  assert.equal(state.draft.services["back:1"].meal, true);
  assert.equal(state.draft.contact.name, "Edited");
  assert.equal(booking.bookingTotals(state.draft).services, 295000);
});
test("skip clears purchased extras; changed itinerary resets extras; logout removes booking PII", () => {
  const reducer = bookingState.default;
  let state = reducer(undefined, bookingState.startBooking(bookingInput()));
  const add = bookingState.updateServices({ flightId: "out", passengerIndex: 0, changes: { insurance: true } });
  state = reducer(state, add);
  state = reducer(state, bookingState.skipServices());
  assert.equal(booking.bookingTotals(state.draft).services, 0);
  state = reducer(state, add);
  state = reducer(state, bookingState.startBooking({ ...bookingInput(), params: { ...bookingInput().params, flights: [{ flightId: "new", fareClassId: "eco" }] } }));
  assert.equal(Object.keys(state.draft.services).length, 0);
  state = reducer(state, { type: "auth/resetAuth" });
  assert.equal(state.draft, null);
});
test("infants and unknown flight/passenger cannot receive supplementary services", () => {
  const reducer = bookingState.default;
  let state = reducer(undefined, bookingState.startBooking(bookingInput()));
  for (const target of [{ flightId: "out", passengerIndex: 2 }, { flightId: "missing", passengerIndex: 0 }, { flightId: "out", passengerIndex: 99 }]) {
    state = reducer(state, bookingState.updateServices({ ...target, changes: { meal: true } }));
  }
  assert.equal(Object.keys(state.draft.services).length, 0);
});

const taxUtils = load("src/utils/taxAndFee.ts");
const taxConfig = (airlineId, extra = {}) => ({
  id: `tax-${airlineId}`, airline_id: airlineId,
  admin_fee: 50000, airport_fee: 100000, security_fee: 20000,
  fuel_surcharge: 30000, vat_percent: 8, currency: "VND", ...extra,
});
const taxedFare = (id, airlineId, price = 1000000) => ({
  ...flight(id), airline: { id: airlineId, name: airlineId }, ticket: { price },
});

test("tax includes four fees and VAT on ticket price, rounded per passenger and per leg", () => {
  const out = taxUtils.calculateLegTaxAndFee(taxedFare("out", "vn", 1000007), 3, taxConfig("vn"));
  const back = taxUtils.calculateLegTaxAndFee(taxedFare("back", "vj", 900000), 3, taxConfig("vj", { vat_percent: 10 }));
  assert.equal(out.fixedPerPassenger, 200000);
  assert.equal(out.vatPerPassenger, 80001);
  assert.equal(out.total, 840003);
  assert.equal(back.total, 870000);
  const draft = { ...bookingInput(), services: { "out:0": { ...booking.emptyServices(), meal: true } } };
  const totals = booking.bookingTotals(draft, out.total + back.total);
  assert.equal(totals.taxAndFees, 1710003);
  assert.equal(totals.total, 5700000 + 120000 + 75000 + 1710003);
  assert.equal(booking.bookingTotals(draft, null).total, null);
});

test("zero tax is valid; missing fields, wrong airline/currency and invalid amounts block calculation", () => {
  const fare = taxedFare("out", "vn");
  const zero = taxConfig("vn", { admin_fee: 0, airport_fee: 0, security_fee: 0, fuel_surcharge: 0, vat_percent: 0 });
  assert.equal(taxUtils.calculateLegTaxAndFee(fare, 3, zero).total, 0);
  for (const config of [undefined, taxConfig("vj"), taxConfig("vn", { currency: "USD" }), taxConfig("vn", { currency: null }), taxConfig("vn", { security_fee: null }), taxConfig("vn", { admin_fee: -1 }), taxConfig("vn", { vat_percent: 101 }), taxConfig("vn", { vat_percent: 8.5 }), taxConfig("vn", { admin_fee: Number.MAX_SAFE_INTEGER })]) {
    assert.throws(() => taxUtils.calculateLegTaxAndFee(fare, 3, config));
  }
});

test("tax API encodes airline ID, passes cancellation and rejects mismatched responses", async () => {
  const calls = [];
  const signal = {};
  let data = { status: 200, data: taxConfig("airline/id") };
  const api = load("src/api/airport.api.ts", {
    "./clientApi": { clientApi: { get: async (...args) => { calls.push(args); return { data }; } } },
  });
  await api.getTaxAndFee("airline/id", signal);
  assert.equal(calls[0][0], "/airlines/airline%2Fid/tax-and-fee");
  assert.equal(calls[0][1].signal, signal);
  data = { status: 200, data: taxConfig("another-airline") };
  await assert.rejects(api.getTaxAndFee("airline/id"));
  data = { status: 404 };
  await assert.rejects(api.getTaxAndFee("airline/id"));
});

test("saved passengers and favorites use persistent API endpoints and propagate write failures", async () => {
  const calls = [];
  const profile = { id: "saved/id", fullName: "Nguyễn Văn An", passengerType: "ADULT", dateOfBirth: "1990-01-01", identityNumber: null };
  const client = Object.fromEntries(["get", "post", "put", "delete"].map(method => [method, async (...args) => {
    calls.push({ method, args });
    return { data: { status: "success", data: method === "get" ? [] : profile } };
  }]));
  const api = load("src/api/bookingOptions.api.ts", { "./clientApi": { clientApi: client } });
  const signal = new AbortController().signal;
  assert.equal((await api.savePassenger(profile)).id, profile.id);
  await api.savePassenger(profile, profile.id);
  await api.deleteSavedPassenger(profile.id);
  await api.getFavoriteFlights(signal);
  await api.setFavorite("flight/id", false);
  assert.deepEqual(calls.map(call => [call.method, call.args[0]]), [
    ["post", "/auth/passengers"], ["put", "/auth/passengers/saved%2Fid"],
    ["delete", "/auth/passengers/saved%2Fid"], ["get", "/flights/favorites"], ["delete", "/flights/flight%2Fid/favorite"],
  ]);
  assert.equal(calls[3].args[1].signal, signal);
  client.post = async () => { throw new Error("offline"); };
  await assert.rejects(api.savePassenger(profile), /offline/);
});

test("favorite hook blocks duplicate taps, ignores stale legs and retries after a read failure", async () => {
  const slots = [];
  let cursor = 0;
  let focusedCallback;
  let cleanup;
  const reads = [];
  const writes = [];
  const memo = (factory, deps) => {
    const index = cursor++;
    if (!slots[index] || deps.some((value, i) => value !== slots[index].deps[i])) slots[index] = { deps, value: factory() };
    return slots[index].value;
  };
  const hook = load("src/hook/useFlightFavorite.ts", {
    react: {
      useState(initial) {
        const index = cursor++;
        if (!(index in slots)) slots[index] = initial;
        return [slots[index], value => { slots[index] = typeof value === "function" ? value(slots[index]) : value; }];
      },
      useRef(value) { const index = cursor++; return slots[index] ??= { current: value }; },
      useMemo: memo,
      useCallback: (callback, deps) => memo(() => callback, deps),
    },
    "expo-router": { useFocusEffect(callback) { if (callback !== focusedCallback) { cleanup?.(); focusedCallback = callback; cleanup = callback(); } } },
    "../api/bookingOptions.api": {
      getFavorite: (id, signal) => new Promise((resolve, reject) => reads.push({ id, signal, resolve, reject })),
      setFavorite: (id, favorite) => new Promise((resolve, reject) => writes.push({ id, favorite, resolve, reject })),
    },
  });
  const render = id => { cursor = 0; return hook.useFlightFavorite(id, true); };
  const settle = () => new Promise(resolve => setImmediate(resolve));
  assert.equal(render("out").busy, true);
  await render("out").toggle();
  assert.equal(writes.length, 0);
  reads[0].resolve(true); await settle();
  const current = render("out");
  assert.equal(current.favorite, true);
  const firstTap = current.toggle();
  await current.toggle();
  assert.equal(writes.length, 1);
  assert.equal(writes[0].favorite, false);
  render("back");
  assert.equal(reads[0].signal.aborted, true);
  reads[1].resolve(false); await settle();
  writes[0].resolve(false); await firstTap;
  assert.equal(render("back").favorite, false);
  cleanup?.(); cleanup = focusedCallback();
  reads[2].reject(new Error("offline")); await settle();
  const failed = render("back");
  assert.ok(failed.error);
  const retry = failed.toggle();
  reads[3].resolve(true); await settle();
  assert.equal(writes[1].favorite, false);
  writes[1].resolve(false); await retry;
  assert.equal(render("back").error, undefined);
  const pendingSave = render("back").toggle();
  render("out");
  render("back");
  assert.equal(reads.length, 5, "refocusing waits for the pending write before reading");
  writes[2].resolve(true); await pendingSave; await settle();
  reads[5].resolve(true); await settle();
  assert.equal(render("back").favorite, true);
  cleanup?.();
});

test("passenger address book writes require consent; declining still continues and failed saves can retry", async () => {
  const formUtils = load("src/utils/passengerForm.ts");
  const fare = { flightId: "flight", airline: { name: "Airline" }, ticket: { fareClassId: "fare", price: 100 }, departure: { time: "2026-12-01", airportCode: "SGN" }, arrival: { airportCode: "HAN" } };
  const params = { flights: [{ flightId: "flight", fareClassId: "fare" }], passengers: { adults: 1, children: 0, infants: 0 } };
  const passenger = { kind: "adult", name: "Nguyen Van An", birthday: "01/01/1990", identity: "123456789" };
  const state = { auth: { isAuthenticated: true, user: {} }, booking: { draft: {
    params, passengers: [passenger], contact: { name: passenger.name, email: "an@example.com", phone: "+84901234567" }, seats: [],
  } } };
  let cursor = 0;
  const slots = [];
  const writes = [];
  let failSave = false;
  const react = {
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    useMemo: factory => factory(),
    useRef(value) { const i = cursor++; return slots[i] ??= { current: value }; },
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = typeof initial === "function" ? initial() : initial;
      return [slots[i], value => { slots[i] = typeof value === "function" ? value(slots[i]) : value; }];
    },
  };
  const dependencies = {
    react: { default: react, ...react },
    "react-native": { ActivityIndicator: "ActivityIndicator", KeyboardAvoidingView: "KeyboardAvoidingView", Platform: { OS: "web" }, Pressable: "Pressable", ScrollView: "ScrollView", Text: "Text", View: "View" },
    "react-native-safe-area-context": { SafeAreaView: "SafeAreaView" },
    "expo-router": { useLocalSearchParams: () => ({ data: "test" }) },
    "@expo/vector-icons": { Ionicons: "Ionicons" },
    "../../navigation/routes": { readRouteData: () => params },
    "../../navigation/validation": { parsePassengerInfo: value => value },
    "../../hook/useFareSelection": { useFareSelection: () => ({ status: "ready", selected: [fare], total: 100 }) },
    "../../hook/useTaxAndFee": { useTaxAndFee: () => ({ status: "ready", total: 0 }) },
    "../../store": { useAppDispatch: () => () => {}, useAppSelector: selector => selector(state) },
    "../../store/slices/bookingSlice": {},
    "../../api/bookingOptions.api": { savePassenger: async input => {
      writes.push(input);
      if (failSave) throw new Error("offline");
      return { ...input, id: "saved" };
    } },
    "../../utils/fare": { passengerCount: () => 1, formatFareMoney: String, flightDate: String, flightTime: String, flightDuration: String },
    "../../utils/passengerForm": formUtils,
  };
  for (const [file, name] of [
    ["common/AppHeader", "default"], ["booking/TaxAndFeeCard", "TaxAndFeeCard"],
    ["flight/fares/FareCheckoutBar", "FareCheckoutBar"], ["flight/fares/FareSheet", "FareSheet"],
    ["booking/BookingProgress", "BookingProgress"], ["booking/FlightSeatPicker", "FlightSeatPicker"],
  ]) dependencies[`../../components/${file}`] = { [name]: file };
  dependencies["../../components/booking/PassengerFields"] = { PassengerCard: "PassengerCard", PassengerField: "PassengerField" };
  const screen = load("src/screens/booking/PassengerInfo.tsx", dependencies);
  const form = screen.default();
  const render = () => { cursor = 0; return form.type(form.props); };
  const nodes = tree => !tree || typeof tree !== "object" ? [] : [tree, ...(tree.props?.children ?? []).flat(Infinity).flatMap(nodes)];
  const find = (tree, type) => nodes(tree).find(node => node.type === type);
  const prompt = tree => nodes(tree).find(node => node.type === "flight/fares/FareSheet" && node.props.title === "Lưu thông tin hành khách?");
  const button = (tree, label) => nodes(tree).find(node => node.type === "Pressable" && nodes(node).some(child => child.type === "Text" && child.props.children.includes(label)));
  let tree = render();
  button(tree, "Lưu hành khách vào danh bạ").props.onPress();
  tree = render();
  assert.equal(prompt(tree).props.visible, true);
  assert.equal(writes.length, 0, "the individual save button also requires consent");
  prompt(tree).props.onClose();
  tree = render();
  assert.equal(prompt(tree).props.visible, false);
  assert.equal(writes.length, 0, "dismissing confirmation never saves");
  find(tree, "flight/fares/FareCheckoutBar").props.onContinue();
  tree = render();
  assert.equal(prompt(tree).props.visible, true);
  assert.equal(writes.length, 0, "opening confirmation does not save");
  button(prompt(tree), "Không lưu, tiếp tục").props.onPress();
  tree = render();
  assert.ok(find(tree, "booking/FlightSeatPicker"));
  assert.equal(writes.length, 0, "declining never writes to the address book");
  find(tree, "booking/FlightSeatPicker").props.onClose();
  tree = render();
  find(tree, "flight/fares/FareCheckoutBar").props.onContinue();
  tree = render();
  failSave = true;
  await button(prompt(tree), "Lưu thông tin").props.onPress();
  await new Promise(resolve => setImmediate(resolve));
  tree = render();
  assert.equal(prompt(tree).props.visible, true, "failed save keeps confirmation open");
  assert.equal(find(tree, "booking/FlightSeatPicker"), undefined);
  failSave = false;
  button(prompt(tree), "Lưu thông tin").props.onPress();
  await new Promise(resolve => setImmediate(resolve));
  tree = render();
  assert.equal(writes.length, 2);
  assert.equal(writes[1].fullName, passenger.name);
  assert.equal(prompt(tree).props.visible, false);
  assert.ok(find(tree, "booking/FlightSeatPicker"));
  find(tree, "booking/FlightSeatPicker").props.onClose();
  tree = render();
  find(tree, "flight/fares/FareCheckoutBar").props.onContinue();
  assert.equal(prompt(render()).props.visible, false, "unchanged saved passengers need no new consent");
});

test("tax loading deduplicates airlines, cancels stale requests and retries failures", async () => {
  // Minimal hook runner: requests remain pending so itinerary changes can race responses.
  const states = [];
  let cursor = 0;
  let deps;
  let cleanup;
  const requests = [];
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = initial;
      return [states[index], value => { states[index] = typeof value === "function" ? value(states[index]) : value; }];
    },
    useCallback: callback => callback,
    useEffect(effect, nextDeps) {
      if (!deps || nextDeps.some((value, index) => value !== deps[index])) {
        cleanup?.();
        deps = nextDeps;
        cleanup = effect();
      }
    },
  };
  const hook = load("src/hook/useTaxAndFee.ts", {
    react,
    axios: { isAxiosError: () => false },
    "../utils/taxAndFee": taxUtils,
    "../api/airport.api": { getTaxAndFee: (id, signal) => new Promise((resolve, reject) => requests.push({ id, signal, resolve, reject })) },
  });
  const render = (fares, count = 3) => { cursor = 0; return hook.useTaxAndFee(fares, count); };
  const settle = () => new Promise(resolve => setImmediate(resolve));
  const original = [taxedFare("out", "vn"), taxedFare("back", "vn")];
  assert.equal(render(original).total, null);
  assert.equal(requests.length, 1);
  const changed = [taxedFare("out", "vj")];
  assert.equal(render(changed).total, null);
  assert.equal(requests[0].signal.aborted, true);
  requests[0].resolve({ data: taxConfig("vn") });
  requests[1].resolve({ data: taxConfig("vj") });
  await settle();
  let result = render(changed);
  assert.equal(result.status, "ready");
  assert.equal(result.total, 840000);
  assert.equal(render(changed, 1).total, 280000);
  assert.equal(requests.length, 2);
  result.reload();
  assert.equal(render(changed).total, null);
  requests[2].reject(new Error("Cannot load fees"));
  await settle();
  result = render(changed);
  assert.equal(result.status, "error");
  assert.equal(result.total, null);
  result.reload();
  render(changed);
  requests[3].resolve({ data: taxConfig("vj", { security_fee: null }) });
  await settle();
  assert.equal(render(changed).status, "error");
  assert.equal(render(changed).total, null);
  assert.equal(render([flight("missing-airline-id")]).status, "error");
  assert.equal(requests.length, 4);
  cleanup?.();
});
