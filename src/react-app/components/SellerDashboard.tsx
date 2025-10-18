import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  DollarSign, TrendingUp, Music, ShoppingCart, 
  Calendar, Eye, Download, Star, Edit, Trash2,
  BarChart3, PieChart, Plus
} from 'lucide-react';
import type { SellerAnalytics, MarketplaceItem } from '@/shared/types';
import BeatEditModal from './BeatEditModal';

interface SellerDashboardProps {
  onCreateBeat: () => void;
}

export default function SellerDashboard({ onCreateBeat }: SellerDashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [editingBeatId, setEditingBeatId] = useState<string | null>(null);

  const { data: stats } = useQuery({
    queryKey: ['seller-stats'],
    queryFn: async () => {
      const response = await fetch('/api/seller/stats');
      if (!response.ok) throw new Error('Failed to fetch seller stats');
      return response.json();
    },
  });

  const { data: analytics = [] } = useQuery({
    queryKey: ['seller-analytics'],
    queryFn: async () => {
      const response = await fetch('/api/seller/analytics');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json() as Promise<SellerAnalytics[]>;
    },
  });

  const { data: myBeats = [] } = useQuery({
    queryKey: ['my-beats'],
    queryFn: async () => {
      const response = await fetch('/api/seller/beats');
      if (!response.ok) throw new Error('Failed to fetch my beats');
      return response.json() as Promise<MarketplaceItem[]>;
    },
  });

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRecentSales = () => {
    return analytics.slice(0, 5);
  };

  const getSalesChartData = () => {
    const salesByDay = analytics.reduce((acc, sale) => {
      const date = sale.sale_date.split('T')[0];
      acc[date] = (acc[date] || 0) + sale.net_earnings_cents;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(salesByDay)
      .slice(-7)
      .map(([date, earnings]) => ({
        date,
        earnings: earnings / 100,
      }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Seller Dashboard</h1>
          <p className="text-gray-400">Manage your beats and track your earnings</p>
        </div>
        
        <button
          onClick={onCreateBeat}
          className="mt-4 md:mt-0 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>List New Beat</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Earnings</p>
              <p className="text-2xl font-bold text-white">
                {stats ? formatPrice(stats.total_earnings_cents) : '$0.00'}
              </p>
            </div>
            <div className="bg-green-500/20 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Sales</p>
              <p className="text-2xl font-bold text-white">
                {stats?.total_sales || 0}
              </p>
            </div>
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Listings</p>
              <p className="text-2xl font-bold text-white">
                {stats?.active_listings || 0}
              </p>
            </div>
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <Music className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">This Month</p>
              <p className="text-2xl font-bold text-white">
                {stats ? formatPrice(stats.monthly_earnings_cents) : '$0.00'}
              </p>
            </div>
            <div className="bg-yellow-500/20 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales */}
        <div className="lg:col-span-2 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Recent Sales</span>
              </h2>
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                className="bg-gray-700 border border-gray-600 rounded-lg text-white text-sm px-3 py-1"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="year">Last Year</option>
              </select>
            </div>
          </div>
          
          <div className="p-6">
            {analytics.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No sales yet</p>
                <p className="text-gray-500 text-sm">Start selling beats to see analytics here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getRecentSales().map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <Music className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{sale.title}</p>
                        <p className="text-gray-400 text-sm capitalize">
                          {sale.sale_type} license • {formatDate(sale.sale_date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{formatPrice(sale.net_earnings_cents)}</p>
                      <p className="text-gray-400 text-xs">Net earnings</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
              <PieChart className="w-5 h-5" />
              <span>License Breakdown</span>
            </h2>
          </div>
          
          <div className="p-6">
            {analytics.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-400">No data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {['basic', 'lease', 'exclusive'].map((licenseType) => {
                  const salesOfType = analytics.filter(sale => sale.sale_type === licenseType);
                  const count = salesOfType.length;
                  const earnings = salesOfType.reduce((sum, sale) => sum + sale.net_earnings_cents, 0);
                  const percentage = analytics.length > 0 ? (count / analytics.length) * 100 : 0;
                  
                  return (
                    <div key={licenseType} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300 capitalize">{licenseType}</span>
                        <span className="text-white">{count} sales</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            licenseType === 'basic' ? 'bg-blue-500' :
                            licenseType === 'lease' ? 'bg-green-500' :
                            'bg-purple-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-right">
                        <span className="text-gray-400 text-xs">{formatPrice(earnings)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* My Beats */}
      <div className="bg-gray-800/50 rounded-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
            <Music className="w-5 h-5" />
            <span>My Beats</span>
          </h2>
        </div>
        
        <div className="p-6">
          {myBeats.length === 0 ? (
            <div className="text-center py-12">
              <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No beats listed yet</h3>
              <p className="text-gray-400 mb-6">Start earning by uploading your first beat</p>
              <button
                onClick={onCreateBeat}
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Upload Your First Beat
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myBeats.map((beat) => (
                <div key={beat.id} className="bg-gray-700/30 rounded-lg p-4 group">
                  <div className="relative mb-3">
                    {beat.cover_image_url ? (
                      <img
                        src={beat.cover_image_url}
                        alt={beat.title}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-24 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-lg flex items-center justify-center">
                        <Music className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="absolute top-2 right-2 flex space-x-1">
                      <button className="bg-black/70 backdrop-blur-sm p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit className="w-3 h-3 text-white" />
                      </button>
                      <button className="bg-black/70 backdrop-blur-sm p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="text-white font-medium mb-1 truncate">{beat.title}</h3>
                  <p className="text-gray-400 text-sm mb-2 line-clamp-2">{beat.description}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>{beat.download_count} downloads</span>
                    <span className={`px-2 py-1 rounded ${beat.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {beat.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-white font-bold">
                      from {formatPrice(beat.price_cents)}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-400 text-xs">View</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* My Beats Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">My Beats</h2>
          <button
            onClick={onCreateBeat}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>List New Beat</span>
          </button>
        </div>
        
        {myBeats.length === 0 ? (
          <div className="bg-gray-800/50 rounded-lg p-8 text-center">
            <Music className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No beats listed yet</h3>
            <p className="text-gray-400 mb-4">Start selling your beats on the marketplace</p>
            <button
              onClick={onCreateBeat}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>List Your First Beat</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myBeats.map((beat) => (
              <div key={beat.id} className="bg-gray-800/50 rounded-lg overflow-hidden flex flex-col">
                {beat.cover_image_url ? (
                  <img 
                    src={beat.cover_image_url} 
                    alt={beat.title} 
                    className="w-full h-40 object-cover"
                  />
                ) : (
                  <div className="w-full h-40 bg-gray-700 flex items-center justify-center">
                    <Music className="w-12 h-12 text-gray-500" />
                  </div>
                )}
                
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-lg font-medium text-white mb-1 truncate">{beat.title}</h3>
                  <p className="text-gray-400 text-sm mb-2 line-clamp-2">{beat.description}</p>
                  
                  <div className="flex items-center text-sm text-gray-400 mb-2">
                    <span className="bg-gray-700 px-2 py-1 rounded mr-2">{beat.category}</span>
                    {beat.bpm && <span className="bg-gray-700 px-2 py-1 rounded mr-2">{beat.bpm} BPM</span>}
                    {beat.key_signature && <span className="bg-gray-700 px-2 py-1 rounded">{beat.key_signature}</span>}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-400 mb-4">
                    <DollarSign className="w-4 h-4 mr-1" />
                    <span>${(beat.price_cents / 100).toFixed(2)}</span>
                    {beat.download_count > 0 && (
                      <span className="ml-4 flex items-center">
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        {beat.download_count} sales
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-auto flex justify-end space-x-2">
                    <button
                      onClick={() => setEditingBeatId(beat.id)}
                      className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 hover:text-white transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Edit Modal */}
      {editingBeatId && (
        <BeatEditModal
          beatId={editingBeatId}
          onClose={() => setEditingBeatId(null)}
        />
      )}
    </div>
  );
}
