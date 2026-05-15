import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'; 
import {
  ShieldCheck,
  UserCircle,
  Heart,
  MessageSquare,
  FileText,
  Users,
  BarChart3,
  MapPin,
} from 'lucide-react';

import Proposals from '../MyAccount/Proposals';
import UsersManagementPage from '../MyAccount/UsersManagementPage';
import FavoriteSites from '../MyAccount/FavoriteSites';
import MyReviews from '../MyAccount/MyReviews';

// 데이터 훅 (실제 경로에 맞춰 수정)
import { useAllCulturalSites } from '../../hooks/data/useCulturalSitesQueries';
import { useProposals } from '../../hooks/data/useProposalQueries';
import { useAllUsers } from '../../hooks/data/useUserQueries';

const AdminView = () => {
  const [viewMode, setViewMode] = useState('management');

  // 데이터 로딩
  const { data: sites = [] } = useAllCulturalSites();
  const { data: proposals = [] } = useProposals();
  const { data: users = [] } = useAllUsers();

  // 1. 카테고리별 통계 데이터 가공
  const categoryData = useMemo(() => {
    const stats: Record<string, number> = {};
    sites.forEach((site) => {
      const cat = site.category || 'Unknown';
      stats[cat] = (stats[cat] || 0) + 1;
    });
    return Object.entries(stats).map(([name, value]) => ({ name, value }));
  }, [sites]);

  const COLORS = [
    '#0088FE',
    '#00C49F',
    '#FFBB28',
    '#FF8042',
    '#8884d8',
    '#82ca9d',
  ];

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 max-w-7xl">
      {/* 상단 헤더 & 전환 스위치 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
            <span className="text-sm font-bold text-indigo-600 uppercase tracking-wider">
              Admin Control Tower
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            System Dashboard
          </h1>
        </div>

        <Tabs value={viewMode} onValueChange={setViewMode} className="w-fit">
          <TabsList className="bg-gray-100 p-1 border">
            <TabsTrigger
              value="management"
              className="gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600"
            >
              <ShieldCheck className="h-4 w-4" /> Management
            </TabsTrigger>
            <TabsTrigger
              value="personal"
              className="gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600"
            >
              <UserCircle className="h-4 w-4" /> My Activity
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {viewMode === 'management' && (
        <Tabs defaultValue="stats" className="space-y-6">
          <TabsList className="bg-transparent border-b w-full justify-start rounded-none h-auto p-0 gap-8">
            <TabsTrigger value="stats" className="admin-tab-trigger">
              <BarChart3 className="h-4 w-4 mr-2" /> Stats Insight
            </TabsTrigger>
            <TabsTrigger value="proposals" className="admin-tab-trigger">
              <FileText className="h-4 w-4 mr-2" /> Proposals (
              {proposals.filter((p) => p.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="users" className="admin-tab-trigger">
              <Users className="h-4 w-4 mr-2" /> Users
            </TabsTrigger>
          </TabsList>

          {/* --- 통계 시각화 탭 --- */}
          <TabsContent value="stats" className="space-y-6 outline-none">
            {/* 요약 카드 세트 */}
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard
                title="Total Sites"
                value={sites.length}
                icon={<MapPin className="text-blue-500" />}
                subtitle="Registered locations"
              />
              <StatCard
                title="Total Users"
                value={users.length}
                icon={<Users className="text-green-500" />}
                subtitle="Active accounts"
              />
              <StatCard
                title="Pending Proposals"
                value={proposals.filter((p) => p.status === 'pending').length}
                icon={<FileText className="text-orange-500" />}
                subtitle="Needs review"
              />
              <StatCard
                title="Total Reviews"
                value="1,284"
                icon={<MessageSquare className="text-purple-500" />}
                subtitle="User feedback"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* 카테고리 분포 차트 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">
                    Sites by Category
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* 월별 활동/제안 추이 (예시 데이터 기반) */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">
                    Activity Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip cursor={{ fill: '#f3f4f6' }} />
                      <Bar
                        dataKey="value"
                        fill="#6366f1"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="proposals" className="outline-none">
            <Proposals />
          </TabsContent>
          <TabsContent value="users" className="outline-none">
            <UsersManagementPage />
          </TabsContent>
        </Tabs>
      )}

      {viewMode === 'personal' && (
        <Tabs defaultValue="favorites" className="space-y-6">
          <TabsList className="bg-transparent border-b w-full justify-start rounded-none h-auto p-0 gap-8">
            <TabsTrigger value="favorites" className="admin-tab-trigger-red">
              <Heart className="h-4 w-4 mr-2" /> My Favorites
            </TabsTrigger>
            <TabsTrigger value="reviews" className="admin-tab-trigger-blue">
              <MessageSquare className="h-4 w-4 mr-2" /> My Reviews
            </TabsTrigger>
          </TabsList>
          <TabsContent value="favorites" className="outline-none">
            <FavoriteSites />
          </TabsContent>
          <TabsContent value="reviews" className="outline-none">
            <MyReviews />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

// 재사용 가능한 통계 카드 컴포넌트
const StatCard = ({
  title,
  value,
  icon,
  subtitle,
}: {
  title: string;
  value: any;
  icon: React.ReactNode;
  subtitle: string;
}) => (
  <Card className="hover:shadow-md transition-all">
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
    </CardContent>
  </Card>
);

export default AdminView;
