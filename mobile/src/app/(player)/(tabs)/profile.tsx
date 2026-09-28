import { ProfileScreen } from '@/components/profile/ProfileScreen';
import { useAuth } from '@/hooks/useAuth';

export default function PlayerProfile() {
  const { logout } = useAuth();
  return <ProfileScreen onLogout={logout} />;
}
