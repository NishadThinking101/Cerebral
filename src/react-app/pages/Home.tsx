import { useAuth } from '@getmocha/users-service/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Music, Users, Zap, Globe, Play, ArrowRight, Star, CheckCircle } from 'lucide-react';
import LoginModal from '@/react-app/components/LoginModal';

export default function Home() {
  const { user, isPending } = useAuth();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/studio');
    }
  }, [user, navigate]);

  const features = [
    {
      icon: Music,
      title: 'Professional Studio',
      description: 'Full-featured DAW with professional-grade tools and effects',
    },
    {
      icon: Users,
      title: 'Real-time Collaboration',
      description: 'Work together with artists worldwide in real-time',
    },
    {
      icon: Globe,
      title: 'Cross-Platform',
      description: 'Desktop, mobile, and web - create music anywhere',
    },
    {
      icon: Zap,
      title: 'AI-Powered',
      description: 'Smart assistance for mixing, mastering, and composition',
    },
  ];

  const pricingPlans = [
    {
      name: 'Basic',
      price: 'Free',
      storage: '500 GB',
      features: [
        'Professional studio tools',
        'Real-time collaboration',
        'Basic marketplace access',
        'Community support',
        '500 GB storage included',
      ],
    },
    {
      name: 'Premium',
      price: '$9.99/month',
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
      name: 'Pro',
      price: '$19.99/month',
      storage: 'Unlimited',
      features: [
        'Everything in Premium',
        'Unlimited storage',
        'White-label options',
        'API access',
        '24/7 phone support',
        'Custom integrations',
      ],
    },
  ];

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <img 
          src="https://mocha-cdn.com/0199f788-8c7c-76ff-9653-8d77884ee60e/cerebral.jpg" 
          alt="Cerebral" 
          className="w-12 h-12 object-contain animate-pulse"
        />
        <p className="mt-4 text-white text-lg">Loading Cerebral...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
      {/* Navigation */}
      <nav className="bg-gray-900/50 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <img 
                src="https://mocha-cdn.com/0199f788-8c7c-76ff-9653-8d77884ee60e/cerebral.jpg" 
                alt="Cerebral" 
                className="w-8 h-8 object-contain"
              />
              <span className="text-xl font-bold text-white">Cerebral</span>
            </div>
            
            <button
              onClick={() => setShowLoginModal(true)}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-yellow-500/25"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Create Music
            <span className="block bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text text-transparent">
              Without Limits
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Professional music studio with real-time collaboration, AI assistance, and seamless DAW integration. 
            Connect with artists worldwide and bring your musical vision to life.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={() => setShowLoginModal(true)}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black px-8 py-4 rounded-lg font-semibold text-lg flex items-center justify-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-yellow-500/25"
            >
              <span>Start Creating Free</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="border border-gray-600 hover:border-gray-500 text-white px-8 py-4 rounded-lg font-semibold text-lg flex items-center justify-center space-x-2 transition-all duration-200 hover:bg-gray-800/50">
              <Play className="w-5 h-5" />
              <span>Watch Demo</span>
            </button>
          </div>

          <div className="flex items-center justify-center space-x-8 text-gray-400">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <span>Compatible with Logic Pro</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <span>FL Studio Integration</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <span>Ableton Live Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Everything You Need</h2>
            <p className="text-xl text-gray-300">Professional tools for every stage of music creation</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-yellow-500/50 transition-all duration-200"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-black" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Choose Your Plan</h2>
            <p className="text-xl text-gray-300">Start free and scale as you grow</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border transition-all duration-200 ${
                  plan.popular
                    ? 'border-yellow-500 ring-2 ring-yellow-500/20 scale-105'
                    : 'border-gray-700/50 hover:border-yellow-500/50'
                }`}
              >
                {plan.popular && (
                  <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black text-sm font-medium px-3 py-1 rounded-full w-fit mx-auto mb-4">
                    Most Popular
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold text-white mb-2">{plan.price}</div>
                  <div className="text-yellow-400 font-medium">{plan.storage} storage</div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => setShowLoginModal(true)}
                  className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black shadow-lg hover:shadow-yellow-500/25'
                      : 'border border-gray-600 hover:border-gray-500 text-white hover:bg-gray-800/50'
                  }`}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900/80 backdrop-blur-sm border-t border-gray-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <img 
              src="https://mocha-cdn.com/0199f788-8c7c-76ff-9653-8d77884ee60e/cerebral.jpg" 
              alt="Cerebral" 
              className="w-8 h-8 object-contain"
            />
            <span className="text-xl font-bold text-white">Cerebral</span>
          </div>
          <p className="text-gray-400 mb-4">
            Professional music studio with real-time collaboration
          </p>
          <p className="text-gray-500 text-sm">
            © 2024 Cerebral. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}
    </div>
  );
}
