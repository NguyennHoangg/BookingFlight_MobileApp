import {Image, Text, TouchableOpacity} from "react-native";
import {Destination} from "../../api/destination.api";

interface DestinationCardProps {
  destination: Destination;
}

const DestinationCard: React.FC<DestinationCardProps> = ({destination}: DestinationCardProps) => {
  return (
    <TouchableOpacity
      className="bg-white rounded-2xl p-4 shadow-sm mb-4"
    >
      <Image
        source={{ uri: destination.imageUrl }}
        className="w-full h-40 rounded-2xl mb-3"
        resizeMode="cover"
      />
      <Text className="text-lg font-bold text-gray-900">{destination.city}</Text>
      <Text className="text-gray-500 text-sm mt-1">{destination.description}</Text>
    </TouchableOpacity>
  );
};

export default DestinationCard;
