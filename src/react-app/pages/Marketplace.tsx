import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '@getmocha/users-service/react';
import { Search, Filter, Play, ShoppingCart, Star, TrendingUp, Music, Plus, Crown, Shield, Zap } from 'lucide-react';
import Navbar from '@/react-app/components/Navbar';
import PaymentModal from '@/react-app/components/PaymentModal';
import BeatDetailsModal from '@/react-app/components/BeatDetailsModal';
import BeatListingModal from '@/react-app/components/BeatListingModal';
import SellerDashboard from '@/react-app/components/SellerDashboard';
import type { MarketplaceItem } from '@/shared/types';

export default function Marketplace() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [selectedLicenseType, setSelectedLicenseType] = useState<'basic' | 'lease' | 'exclusive'>('basic');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBeatDetails, setShowBeatDetails] = useState(false);
  const [showBeatListing, setShowBeatListing] = useState(false);
  const [selectedBeatId, setSelectedBeatId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'marketplace' | 'seller'>('marketplace');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['marketplace', selectedCategory, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetch(`/api/marketplace?${params}`);
      if (!response.ok) throw new Error('Failed to fetch marketplace items');
      return response.json() as Promise<MarketplaceItem[]>;
    },
  });

  const categories = [
    { id: '', label: 'All', icon: Music },
    { id: 'beat', label: 'Beats', icon: Music },
    { id: 'song', label: 'Songs', icon: Music },
    { id: 'sample', label: 'Samples', icon: Music },
    { id: 'loop', label: 'Loops', icon: Music },
    { id: 'vocal', label: 'Vocals', icon: Music },
  ];

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatBPM = (bpm?: number) => {
    return bpm ? `${bpm} BPM` : '';
  };

  const handleBeatClick = (beatId: string) => {
    setSelectedBeatId(beatId);
    setShowBeatDetails(true);
  };

  const handlePurchase = (item: MarketplaceItem, licenseType: 'basic' | 'lease' | 'exclusive' = 'basic') => {
    setSelectedItem(item);
    setSelectedLicenseType(licenseType);
    setShowPaymentModal(true);
    setShowBeatDetails(false);
  };

  const getLowestPrice = (item: MarketplaceItem) => {
    let lowestPrice = item.price_cents;
    
    if (item.has_lease_option && item.lease_price_cents < lowestPrice) {
      lowestPrice = item.lease_price_cents;
    }
    
    return lowestPrice;
  };

  const hasMultipleLicenses = (item: MarketplaceItem) => {
    return item.has_lease_option || item.has_exclusive_option;
  };

  const getLicenseIcon = (item: MarketplaceItem) => {
    if (item.has_exclusive_option) return Crown;
    if (item.has_lease_option) return Shield;
    return Zap;
  };

  const handlePaymentSuccess = () => {
    // Refresh marketplace items or show success message
    setShowPaymentModal(false);
    setSelectedItem(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Beat Store</h1>
            <p className="text-gray-300">Buy, sell, and lease high-quality beats with flexible licensing</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center space-x-4">
            {user && (
              <>
                <div className="flex bg-gray-800 rounded-lg p-1 mr-2">
                  <button
                    onClick={() => setActiveTab('marketplace')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === 'marketplace'
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    Marketplace
                  </button>
                  <button
                    onClick={() => setActiveTab('seller')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === 'seller'
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    Seller Dashboard
                  </button>
                </div>
              </>
            )}
            
            {activeTab === 'marketplace' && (
              <>
                {user && (
                  <button
                    onClick={() => setShowBeatListing(true)}
                    className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Sell Your Beat</span>
                  </button>
                )}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search beats, samples..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent w-64"
                  />
                </div>
                
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="p-2 bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                  <Filter className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Seller Dashboard */}
        {activeTab === 'seller' && user && (
          <div className="mb-8">
            <SellerDashboard />
          </div>
        )}
        
        {/* Categories */}
        {activeTab === 'marketplace' && (
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isActive
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{category.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Featured Section */}
        {activeTab === 'marketplace' && (
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="w-5 h-5 text-yellow-400" />
              <h2 className="text-xl font-semibold text-white">Trending Now</h2>
            </div>
            
            {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-800/50 rounded-lg p-4 animate-pulse">
                  <div className="w-full h-32 bg-gray-700 rounded-lg mb-3" />
                  <div className="h-4 bg-gray-700 rounded mb-2" />
                  <div className="h-3 bg-gray-700 rounded w-2/3" />
                </div>
              );}))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {items.slice(0, 4).map((item) => {
                const LicenseIcon = getLicenseIcon(item);
                return (
                <div
                  key={item.id}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 hover:border-yellow-500/50 transition-all duration-200 overflow-hidden group cursor-pointer"
                  onClick={() => handleBeatClick(item.id)}
                >
                  <div className="relative">
                    {item.cover_image_url ? (
                      <img
                        src={item.cover_image_url}
                        alt={item.title}
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center">
                        <img 
                          src="https://mocha-cdn.com/0199f788-8c7c-76ff-9653-8d77884ee60e/cerebral.jpg" 
                          alt="Cerebral" 
                          className="w-8 h-8 object-contain opacity-80"
                        />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <button className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black p-3 rounded-full transition-colors">
                        <Play className="w-5 h-5 ml-0.5" />
                      </button>
                    </div>
                    
                    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
                      <span className="text-white text-sm font-medium">
                        {hasMultipleLicenses(item) ? 'from ' : ''}{formatPrice(getLowestPrice(item))}
                      </span>
                    </div>
                    
                    {hasMultipleLicenses(item) && (
                      <div className="absolute top-2 left-2 bg-yellow-500/90 backdrop-blur-sm rounded-full p-1">
                        <LicenseIcon className="w-3 h-3 text-black" />
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-white font-medium mb-1 truncate">{item.title}</h3>
                    <p className="text-gray-400 text-sm mb-2 line-clamp-2">{item.description}</p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span className="capitalize">{item.category}</span>
                      {item.bpm && <span>{formatBPM(item.bpm)}</span>}
                      {item.key_signature && <span>{item.key_signature}</span>}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-400" />
                        <span className="text-gray-400 text-xs">4.8</span>
                        <span className="text-gray-600 text-xs">({item.download_count})</span>
                      </div>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBeatClick(item.id);
                        }}
                        className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black p-2 rounded-lg transition-colors"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}}
        </div>

        {/* All Items */}
        {activeTab === 'marketplace' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">All Items</h2>
            
            {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="bg-gray-800/50 rounded-lg p-4 animate-pulse">
                  <div className="w-full h-32 bg-gray-700 rounded-lg mb-3" />
                  <div className="h-4 bg-gray-700 rounded mb-2" />
                  <div className="h-3 bg-gray-700 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <img 
                src="https://mocha-cdn.com/0199f788-8c7c-76ff-9653-8d77884ee60e/cerebral.jpg" 
                alt="Cerebral" 
                className="w-16 h-16 object-contain opacity-60 mx-auto mb-4"
              />
              <h3 className="text-xl font-semibold text-white mb-2">No items found</h3>
              <p className="text-gray-400 max-w-md mx-auto">
                {searchQuery || selectedCategory
                  ? 'Try adjusting your search terms or filters'
                  : 'The marketplace is being populated with amazing content. Check back soon!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item) => {
                const LicenseIcon = getLicenseIcon(item);
                return (
                <div
                  key={item.id}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 hover:border-yellow-500/50 transition-all duration-200 overflow-hidden group cursor-pointer"
                  onClick={() => handleBeatClick(item.id)}
                >
                  <div className="relative">
                    {item.cover_image_url ? (
                      <img
                        src={item.cover_image_url}
                        alt={item.title}
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center">
                        <img 
                          src="https://mocha-cdn.com/0199f788-8c7c-76ff-9653-8d77884ee60e/cerebral.jpg" 
                          alt="Cerebral" 
                          className="w-8 h-8 object-contain opacity-80"
                        />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <button className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black p-3 rounded-full transition-colors">
                        <Play className="w-5 h-5 ml-0.5" />
                      </button>
                    </div>
                    
                    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
                      <span className="text-white text-sm font-medium">
                        {hasMultipleLicenses(item) ? 'from ' : ''}{formatPrice(getLowestPrice(item))}
                      </span>
                    </div>
                    
                    {hasMultipleLicenses(item) && (
                      <div className="absolute top-2 left-2 bg-yellow-500/90 backdrop-blur-sm rounded-full p-1">
                        <LicenseIcon className="w-3 h-3 text-black" />
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-white font-medium mb-1 truncate">{item.title}</h3>
                    <p className="text-gray-400 text-sm mb-2 line-clamp-2">{item.description}</p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span className="capitalize">{item.category}</span>
                      <div className="flex items-center space-x-2">
                        {item.bpm && <span>{formatBPM(item.bpm)}</span>}
                        {item.key_signature && <span>{item.key_signature}</span>}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-400" />
                        <span className="text-gray-400 text-xs">4.8</span>
                        <span className="text-gray-600 text-xs">({item.download_count})</span>
                      </div>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBeatClick(item.id);
                        }}
                        className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black p-2 rounded-lg transition-colors"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Beat Details Modal */}
      {showBeatDetails && selectedBeatId && (
        <BeatDetailsModal
          beatId={selectedBeatId}
          onClose={() => {
            setShowBeatDetails(false);
            setSelectedBeatId(null);
          }}
          onPurchase={handlePurchase}
        />
      )}

      {/* Beat Listing Modal */}
      {showBeatListing && (
        <BeatListingModal
          onClose={() => setShowBeatListing(false)}
          onSuccess={() => {
            setShowBeatListing(false);
            // Optionally show success message
          }}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedItem && (
        <PaymentModal
          item={selectedItem}
          licenseType={selectedLicenseType}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedItem(null);
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
