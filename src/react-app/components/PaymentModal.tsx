import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, CreditCard, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import type { MarketplaceItem } from '@/shared/types';

interface PaymentModalProps {
  item: MarketplaceItem;
  licenseType?: 'basic' | 'lease' | 'exclusive';
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({ item, licenseType = 'basic', onClose, onSuccess }: PaymentModalProps) {
  const [step, setStep] = useState<'details' | 'processing' | 'success' | 'error'>('details');
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: '',
  });
  const [error, setError] = useState('');

  const paymentMutation = useMutation({
    mutationFn: async (data: { item_id: string; license_type: string; payment_method: any }) => {
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Payment failed');
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
      setError(error instanceof Error ? error.message : 'Payment failed');
      setStep('error');
    },
  });

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getPurchasePrice = () => {
    switch (licenseType) {
      case 'lease':
        return item.lease_price_cents || item.price_cents;
      case 'exclusive':
        return item.exclusive_price_cents || item.price_cents;
      default:
        return item.price_cents;
    }
  };

  const formatCardNumber = (value: string) => {
    // Remove all non-digit characters
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    // Add spaces every 4 digits
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
    if (formatted.length <= 19) { // Max length with spaces
      setCardData({ ...cardData, number: formatted });
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiry(e.target.value);
    if (formatted.length <= 5) { // MM/YY
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

    // Simulate payment processing
    // In a real implementation, you would use Stripe.js here
    paymentMutation.mutate({
      item_id: item.id,
      license_type: licenseType,
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
      case 'processing':
        return (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-yellow-400 animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Processing Payment</h3>
            <p className="text-gray-400">Please wait while we process your payment...</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Payment Successful!</h3>
            <p className="text-gray-400">Your purchase has been completed successfully.</p>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Payment Failed</h3>
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => setStep('details')}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        );

      default:
        return (
          <>
            {/* Item Details */}
            <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-4">
                {item.cover_image_url ? (
                  <img
                    src={item.cover_image_url}
                    alt={item.title}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-lg flex items-center justify-center">
                    <img 
                      src="https://mocha-cdn.com/0199f788-8c7c-76ff-9653-8d77884ee60e/cerebral.jpg" 
                      alt="Cerebral" 
                      className="w-6 h-6 object-contain opacity-80"
                    />
                  </div>
                )}
                
                <div className="flex-1">
                  <h3 className="text-white font-medium">{item.title}</h3>
                  <p className="text-gray-400 text-sm line-clamp-1">{item.description}</p>
                  <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                    <span className="capitalize">{item.category}</span>
                    {item.bpm && <span>{item.bpm} BPM</span>}
                    {item.key_signature && <span>{item.key_signature}</span>}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {formatPrice(getPurchasePrice())}
                  </div>
                  <div className="text-xs text-gray-400">
                    {licenseType === 'lease' ? 'Lease license' : 
                     licenseType === 'exclusive' ? 'Exclusive license' : 
                     'Basic license'}
                  </div>
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={paymentMutation.isPending}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-black py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Lock className="w-5 h-5" />
                <span>Pay {formatPrice(getPurchasePrice())}</span>
              </button>
            </form>
          </>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl max-w-md w-full shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-3 rounded-lg">
                <CreditCard className="w-6 h-6 text-black" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Complete Purchase</h2>
                <p className="text-gray-400">Secure payment via Stripe</p>
              </div>
            </div>
            {step === 'details' && (
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
