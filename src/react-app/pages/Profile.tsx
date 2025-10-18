import { useParams } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import Navbar from '@/react-app/components/Navbar';
import UserProfile from '@/react-app/components/UserProfile';

export default function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();

  const profileUserId = userId || user?.id;
  const isOwnProfile = !userId || userId === user?.id;

  if (!profileUserId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
        <Navbar />
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-white mb-4">Profile not found</h2>
            <p className="text-gray-400">Please sign in to view profiles</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
      <Navbar />
      <UserProfile userId={profileUserId} isOwnProfile={isOwnProfile} />
    </div>
  );
}
