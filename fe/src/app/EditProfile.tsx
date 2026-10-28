import EditProfile from '../screens/profile/EditProfileScreen';
import { useAppSelector } from '../store';
export default function EditProfileRoute() {
  const userId = useAppSelector(state => state.auth.user?.id);
  return <EditProfile key={userId} />;
}
