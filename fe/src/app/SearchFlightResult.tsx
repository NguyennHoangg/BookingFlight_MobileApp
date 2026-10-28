import { useLocalSearchParams } from 'expo-router';
import SearchFlightResult from '../screens/search/SearchFlightResult';
export default function SearchRoute() {
  const { data } = useLocalSearchParams<{ data?: string }>();
  return <SearchFlightResult key={data} />;
}
