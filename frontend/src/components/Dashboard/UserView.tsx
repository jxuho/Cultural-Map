import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, MessageSquare, PlusCircle, User } from 'lucide-react';

import FavoriteSites from '../MyAccount/FavoriteSites';
import MyReviews from '../MyAccount/MyReviews';
import useAuthStore from '../../store/authStore';
import { useMyFavorites } from '../../hooks/data/useFavoriteQueries';
import { useMyReviews } from '../../hooks/data/useReviewQueries';
import { useMyProposals } from '../../hooks/data/useProposalQueries';
import MyProposalsList from '../MyAccount/MyProposalsList';

const UserView = () => {
  const currentUser = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState('favorites');

  // 상단 통계 카드를 위한 데이터 fetch (각 컴포넌트와 캐시 공유)
  const { data: favorites = [] } = useMyFavorites(currentUser?._id);
  const { data: reviews = [] } = useMyReviews();
  const { data: proposals = [] } = useMyProposals();

  if (!currentUser) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Welcome!</h2>
            <p className="text-muted-foreground">Please sign in to access your personal dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 max-w-6xl">
      {/* 1. Header & Summary Stats */}
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-muted-foreground">Manage your favorite places and contributions.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Favorites</CardTitle>
              <Heart className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{favorites.length}</div>
              <p className="text-xs text-muted-foreground">Saved cultural sites</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Reviews</CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reviews.length}</div>
              <p className="text-xs text-muted-foreground">Experiences shared</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Proposals</CardTitle>
              <PlusCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{proposals.length}</div>
              <p className="text-xs text-muted-foreground">New site suggestions</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 2. Main Content Tabs */}
      <Card className="border-none shadow-none bg-transparent">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 max-w-md bg-gray-100 p-1">
            <TabsTrigger value="favorites" className="data-[state=active]:bg-white">Favorites</TabsTrigger>
            <TabsTrigger value="reviews" className="data-[state=active]:bg-white">Reviews</TabsTrigger>
            <TabsTrigger value="proposals" className="data-[state=active]:bg-white">Proposals</TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <TabsContent value="favorites" className="focus-visible:outline-none">
              <FavoriteSites />
            </TabsContent>
            
            <TabsContent value="reviews" className="focus-visible:outline-none">
              <MyReviews />
            </TabsContent>

            <TabsContent value="proposals" className="focus-visible:outline-none">
              {/* 제안 데이터가 있는 경우 별도 컴포넌트로 분리 추천 */}
              <MyProposalsList />
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
};

export default UserView;