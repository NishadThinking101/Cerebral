import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Crown, CheckCircle, AlertCircle, Loader2, CreditCard, Lock } from 'lucide-react';

interface SubscriptionModalProps {
  onClose: () => void;
  onSuccess: () => void;
  currentPlan: 'basic' | 'premium' | 'pro';
}

const plans = [
  {
    id: 'premium',
    name: 'Premium',
    price: 999, // $9.99 in cents
    originalPrice: 999,
    storage: '4 TB',
    features: [
      'Everything in Basic',
      'Advanced plugins',
      'Priority support',
      'Marketplace seller tools',
      'Advanced analytics',
      '4 TB storage included',
    ],
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 1999, // $19.99 in cents
    originalPrice: 1999,
    storage: 'Unlimited',
    features: [
      'Everything in Premium',
      'Unlimited storage',
      'White-label options',
      'API access',
      '24/7 phone support',
      'Custom integrations',
    ],
    popular: false,
  },
];

export default function SubscriptionModal({ onClose, onSuccess, currentPlan }: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState(currentPlan === 'basic' ? 'premium' : 'pro');
  const [step, setStep] = useState<'plans' | 'payment' | 'processing' | 'success' | 'error'>('plans');
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: '',
  });
  const [error, setError] = useState('');

  const upgradeMutation = useMutation({
    mutationFn: async (data: { plan: string; payment_method: any }) => {
      const response = await fetch('/api/payments/upgrade-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Subscription upgrade failed');
      return response.json();
    },
    onSuccess: () => {
      setStep('success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Upgrade failed');
      setStep('error');
    },
  });

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    }
    return v;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + (v.length > 2 ? '/' + v.substring(2, 4) : '');
    }
    return v;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.length <= 19) {
      setCardData({ ...cardData, number: formatted });
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiry(e.target.value);
    if (formatted.length <= 5) {
      setCardData({ ...cardData, expiry: formatted });
    }
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 4) {
      setCardData({ ...cardData, cvc: value });
    }
  };

  const validateCard = () => {
    if (!cardData.number || cardData.number.replace(/\s/g, '').length < 13) {
      return 'Please enter a valid card number';
    }
    if (!cardData.expiry || cardData.expiry.length !== 5) {
      return 'Please enter a valid expiry date';
    }
    if (!cardData.cvc || cardData.cvc.length < 3) {
      return 'Please enter a valid CVC';
    }
    if (!cardData.name.trim()) {
      return 'Please enter the cardholder name';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateCard();
    if (validationError) {
      setError(validationError);
      setStep('error');
      return;
    }

    setStep('processing');
    setError('');

    upgradeMutation.mutate({
      plan: selectedPlan,
      payment_method: {
        card: {
          number: cardData.number.replace(/\s/g, ''),
          exp_month: parseInt(cardData.expiry.split('/')[0]),
          exp_year: parseInt('20' + cardData.expiry.split('/')[1]),
          cvc: cardData.cvc,
        },
        billing_details: {
          name: cardData.name,
        },
      },
    });
  };

  const renderStepContent = () => {
    switch (step) {
      case 'plans':
        return (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Choose Your Plan</h3>
              <p className="text-gray-400">Upgrade to unlock premium features and expanded storage</p>
            </div>

            <div className="space-y-4 mb-6">
              {plans.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                const isUpgrade = (currentPlan === 'basic' && plan.id === 'premium') || 
                                 (currentPlan === 'basic' && plan.id === 'pro') ||
                                 (currentPlan === 'premium' && plan.id === 'pro');
                
                if (!isUpgrade) return null;

                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {plan.popular && (
                          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black text-xs font-medium px-2 py-1 rounded-full">
                            Most Popular
                          </div>
                        )}
                        <h4 className="text-lg font-semibold text-white">{plan.name}</h4>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">
                          {formatPrice(plan.price)}<span className="text-sm font-normal text-gray-400">/month</span>
                        </div>
                        <div className="text-yellow-400 text-sm font-medium">{plan.storage} storage</div>
                      </div>
                    </div>
                    
                    <ul className="space-y-1">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center space-x-2 text-sm text-gray-300">
                          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setStep('payment')}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <Crown className="w-5 h-5" />
              <span>Continue to Payment</span>
            </button>
          </>
        );

      case 'payment':
        const plan = plans.find(p => p.id === selectedPlan);
        return (
          <>
            {/* Plan Summary */}
            <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">{plan?.name} Plan</h3>
                  <p className="text-gray-400 text-sm">{plan?.storage} storage</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {formatPrice(plan?.price || 0)}<span className="text-sm font-normal text-gray-400">/month</span>
                  </div>
                  <div className="text-xs text-gray-400">Billed monthly</div>
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-300 mb-2">
                  Card Number
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    id="cardNumber"
                    required
                    value={cardData.number}
                    onChange={handleCardNumberChange}
                    placeholder="1234 5678 9012 3456"
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="expiry" className="block text-sm font-medium text-gray-300 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    id="expiry"
                    required
                    value={cardData.expiry}
                    onChange={handleExpiryChange}
                    placeholder="MM/YY"
                    className="w-full px-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="cvc" className="block text-sm font-medium text-gray-300 mb-2">
                    CVC
                  </label>
                  <input
                    type="text"
                    id="cvc"
                    required
                    value={cardData.cvc}
                    onChange={handleCvcChange}
                    placeholder="123"
                    className="w-full px-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={cardData.name}
                  onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>

              {/* Security Notice */}
              <div className="bg-gray-800/30 rounded-lg p-3 flex items-center space-x-2">
                <Lock className="w-4 h-4 text-green-400 flex-shrink-0" />
                <p className="text-xs text-gray-400">
                  Your payment information is securely encrypted and processed by Stripe.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep('plans')}
                  className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={upgradeMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-black py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <Lock className="w-5 h-5" />
                  <span>Upgrade Now</span>
                </button>
              </div>
            </form>
          </>
        );

      case 'processing':
        return (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-yellow-400 animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Processing Upgrade</h3>
            <p className="text-gray-400">Please wait while we upgrade your subscription...</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-yellow-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Welcome to {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}!</h3>
            <p className="text-gray-400">Your subscription has been upgraded successfully.</p>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Upgrade Failed</h3>
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => setStep('payment')}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl max-w-lg w-full shadow-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 sticky top-0 bg-gray-900 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-3 rounded-lg">
                <Crown className="w-6 h-6 text-black" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Upgrade Subscription</h2>
                <p className="text-gray-400">Unlock premium features</p>
              </div>
            </div>
            {(step === 'plans' || step === 'payment') && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
}
