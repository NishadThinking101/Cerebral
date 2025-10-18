import { useState } from 'react';
import { AlertCircle, Crown, X, HardDrive } from 'lucide-react';
import SubscriptionModal from './SubscriptionModal';

interface StorageWarningProps {
  storageUsed: number;
  storageLimit: number;
  onClose?: () => void;
  showUpgrade?: boolean;
}

export default function StorageWarning({ 
  storageUsed, 
  storageLimit, 
  onClose, 
  showUpgrade = true 
}: StorageWarningProps) {
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  
  const usagePercentage = (storageUsed / storageLimit) * 100;
  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = usagePercentage >= 95;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getWarningLevel = () => {
    if (isAtLimit) return 'critical';
    if (isNearLimit) return 'warning';
    return 'info';
  };

  const getWarningColor = () => {
    const level = getWarningLevel();
    if (level === 'critical') return 'bg-red-500/10 border-red-500/20 text-red-400';
    if (level === 'warning') return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
    return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
  };

  const getProgressColor = () => {
    const level = getWarningLevel();
    if (level === 'critical') return 'from-red-500 to-red-600';
    if (level === 'warning') return 'from-yellow-500 to-yellow-600';
    return 'from-blue-500 to-blue-600';
  };

  const getTitle = () => {
    if (isAtLimit) return 'Storage Almost Full';
    if (isNearLimit) return 'Storage Running Low';
    return 'Storage Usage';
  };

  const getMessage = () => {
    if (isAtLimit) {
      return 'You\'re using over 95% of your storage. Upgrade to Premium for 4TB of space to keep creating without limits.';
    }
    if (isNearLimit) {
      return 'You\'re using over 80% of your storage. Consider upgrading to Premium for 4TB of additional space.';
    }
    return 'Monitor your storage usage to ensure you have enough space for your projects.';
  };

  // Don't show if usage is below 80% and not forcing display
  if (!isNearLimit && !showUpgrade) {
    return null;
  }

  const handleSubscriptionSuccess = () => {
    setShowSubscriptionModal(false);
    onClose?.();
  };

  return (
    <>
      <div className={`rounded-lg border p-4 ${getWarningColor()}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="flex-shrink-0">
              {isAtLimit ? (
                <AlertCircle className="w-5 h-5 text-red-400" />
              ) : isNearLimit ? (
                <AlertCircle className="w-5 h-5 text-yellow-400" />
              ) : (
                <HardDrive className="w-5 h-5 text-blue-400" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-white">
                {getTitle()}
              </h3>
              <p className="text-sm text-gray-300 mt-1">
                {getMessage()}
              </p>
              
              {/* Storage Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{formatBytes(storageUsed)} used</span>
                  <span>{formatBytes(storageLimit)} total</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`bg-gradient-to-r ${getProgressColor()} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {usagePercentage.toFixed(1)}% used
                </div>
              </div>

              {/* Upgrade Button */}
              {showUpgrade && (isAtLimit || isNearLimit) && (
                <button
                  onClick={() => setShowSubscriptionModal(true)}
                  className="mt-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black px-4 py-2 rounded-lg font-medium text-sm flex items-center space-x-2 transition-all duration-200"
                >
                  <Crown className="w-4 h-4" />
                  <span>Upgrade to Premium - 4TB for $9.99/month</span>
                </button>
              )}
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors ml-4"
            >
              <X className="w-4 h-4" />
            </button>
          )}
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
