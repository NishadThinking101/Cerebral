import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Flag, AlertTriangle } from 'lucide-react';

interface ReportModalProps {
  suiteId: string;
  reportedUserId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReportModal({ 
  suiteId, 
  reportedUserId, 
  onClose, 
  onSuccess 
}: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [selectedReason, setSelectedReason] = useState('');

  const reportMutation = useMutation({
    mutationFn: async (data: { reason: string }) => {
      const response = await fetch(`/api/suites/${suiteId}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reported_user_id: reportedUserId,
          reason: data.reason,
        }),
      });
      if (!response.ok) throw new Error('Failed to submit report');
      return response.json();
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const reasonOptions = [
    'Inappropriate language or behavior',
    'Harassment or bullying',
    'Spam or unwanted content',
    'Hate speech or discrimination',
    'Impersonation',
    'Other (specify below)',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = selectedReason === 'Other (specify below)' 
      ? reason 
      : selectedReason + (reason ? `: ${reason}` : '');
    
    if (!finalReason.trim()) return;
    
    reportMutation.mutate({ reason: finalReason });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-500 rounded-lg">
              <Flag className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Report User</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <h4 className="text-yellow-400 font-medium">Before You Report</h4>
          </div>
          <p className="text-gray-300 text-sm">
            Reports are reviewed by our moderation team. False reports may result in restrictions on your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              What's the issue?
            </label>
            <div className="space-y-2">
              {reasonOptions.map((option) => (
                <label key={option} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value={option}
                    checked={selectedReason === option}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="mt-1 w-4 h-4 text-red-600 bg-gray-700 border-gray-600 focus:ring-red-500 focus:ring-2"
                  />
                  <span className="text-gray-300 text-sm">{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Additional Details {selectedReason === 'Other (specify below)' && '*'}
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide specific details about what happened..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
            <div className="text-xs text-gray-400 mt-1">
              {reason.length}/500 characters
            </div>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">What happens next?</h4>
            <ul className="text-gray-400 text-sm space-y-1">
              <li>• Your report will be reviewed within 24 hours</li>
              <li>• The user won't know who reported them</li>
              <li>• We may take action including warnings or bans</li>
              <li>• You'll receive an update on the outcome</li>
            </ul>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                !selectedReason || 
                (selectedReason === 'Other (specify below)' && !reason.trim()) ||
                reportMutation.isPending
              }
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {reportMutation.isPending ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
