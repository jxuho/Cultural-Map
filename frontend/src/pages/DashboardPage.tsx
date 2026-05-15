import React from 'react';
import useAuthStore from '@/store/authStore';
import AdminView from '../components/Dashboard/AdminView';
import UserView from '../components/Dashboard/UserView';
import { Skeleton } from '../components/ui/skeleton';

const DashboardPage: React.FC = () => {
  const { user, loading, isAuthenticated } = useAuthStore();

  // 1. 로딩 중일 때 처리 (shadcn skeleton 활용)
  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-12 w-[250px]" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  // 2. 인증되지 않았을 경우 (보통은 Middleware나 PrivateRoute에서 처리하지만 2중 방어)
  if (!isAuthenticated || !user) {
    return <div className="p-8 text-center">Please sign in to access the dashboard.</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, <span className="font-medium text-foreground">{user.name}</span> ({user.role})
          </p>
        </div>
      </header>

      {/* 3. Role에 따른 분기 처리 */}
      {user.role === 'admin' ? (
        <AdminView />
      ) : (
        <UserView user={user}/>
      )}
    </div>
  );
};

export default DashboardPage;