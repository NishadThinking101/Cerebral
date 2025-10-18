import { useState } from 'react';
import { X, Crown, HardDrive, AlertTriangle, Zap, CheckCircle } from 'lucide-react';
import SubscriptionModal from './SubscriptionModal';

interface StorageUpgradeModalProps {
  onClose: () => void;
  currentUsage: number;
  storageLimit: number;
  fileSize?: number;
}

export default function StorageUpgradeModal({ 
  onClose, 
  currentUsage, 
  storageLimit,
  fileSize 
}: StorageUpgradeModalProps) {
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const usagePercentage = (currentUsage / storageLimit) * 100;
  const availableSpace = storageLimit - currentUsage;

  const premiumBenefits = [
    'Increase storage from 500 GB to 4 TB',
    'Advanced plugins and effects',
    'Priority customer support',
    'Marketplace seller tools',
    'Advanced analytics and insights',
    'Enhanced collaboration features',
  ];

  const handleSubscriptionSuccess = () => {
    setShowSubscriptionModal(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-gray-900 rounded-xl max-w-lg w-full shadow-2xl border border-gray-700">
          {/* Header */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-red-500 to-red-600 p-3 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Storage Limit Reached</h2>
                  <p className="text-gray-400">Upgrade to continue creating</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Storage Status */}
            <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3 mb-3">
                <HardDrive className="w-5 h-5 text-red-400" />
                <h3 className="text-white font-medium">Current Storage Usage</h3>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-300">
                  <span>Used: {formatBytes(currentUsage)}</span>
                  <span>Limit: {formatBytes(storageLimit)}</span>
                </div>
                
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full"
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  />
                </div>
                
                <div className="text-xs text-gray-400">
                  {usagePercentage.toFixed(1)}% used • {formatBytes(availableSpace)} remaining
                </div>

                {fileSize && (
                  <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-red-400">
                      <strong>Upload blocked:</strong> Your file ({formatBytes(fileSize)}) exceeds available space.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Upgrade Option */}
            <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-lg p-6 mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-2 rounded-lg">
                  <Crown className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Upgrade to Premium</h3>
                  <p className="text-yellow-400 font-medium">$9.99/month • 4TB Storage</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 mb-6">
                {premiumBenefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-sm text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center space-x-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg mb-4">
                <Zap className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400">
                  <strong>8x more storage:</strong> Go from 500 GB to 4 TB instantly
                </span>
              </div>

              <button
                onClick={() => setShowSubscriptionModal(true)}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Crown className="w-5 h-5" />
                <span>Upgrade Now - $9.99/month</span>
              </button>
            </div>

            {/* Alternative Actions */}
            <div className="text-center">
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Maybe later, I'll manage my storage manually
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <SubscriptionModal
          currentPlan="basic"
          onClose={() => setShowSubscriptionModal(false)}
          onSuccess={handleSubscriptionSuccess}
        />
      )}
    </>
  );
}
