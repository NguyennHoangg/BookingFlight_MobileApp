import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { Destination } from "../../api/destination.api";

const initialState: Destination[] = [];

const destinationSlice = createSlice({
  name: "destination",
  initialState,
    reducers: {
    setDestinations: (state, action: PayloadAction<Destination[]>) => {
      return action.payload;
    }
    }
});

export const { setDestinations } = destinationSlice.actions;
export default destinationSlice.reducer;