'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { callsApi } from '@/api/calls';
import { contactsApi } from '@/api/contacts';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Plus, Search, Phone, X, Play, Eye, Sparkles } from 'lucide-react';
import { Call, CreateCallDto } from '@/types';
import toast from 'react-hot-toast';
import { formatRelativeTime, formatDate } from '@/lib/utils';

export default function CallsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  const observerTarget = useRef<HTMLDivElement>(null);

  // Infinite query for calls
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['calls', search],
    queryFn: ({ pageParam = 1 }) => callsApi.getAll(pageParam, 20, search),
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.page + 1;
      const totalPages = Math.ceil(lastPage.total / 20);
      return nextPage <= totalPages ? nextPage : undefined;
    },
    initialPageParam: 1,
    refetchInterval: 5000, // Poll every 5 seconds for status updates
  });

  // Intersection observer for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  // Setup intersection observer
  React.useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    });

    observer.observe(element);
    return () => observer.unobserve(element);
  }, [handleObserver]);

  // Launch call mutation
  const launchMutation = useMutation({
    mutationFn: (id: string) => callsApi.launch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calls'] });
      toast.success('Call launched successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to launch call');
    },
  });

  const handleLaunch = (call: Call) => {
    if (call.status !== 'queued') {
      toast.error('Only queued calls can be launched');
      return;
    }
    if (window.confirm(`Launch call to ${call.contact.name}?`)) {
      launchMutation.mutate(call.id);
    }
  };

  const handleViewDetails = (call: Call) => {
    setSelectedCall(call);
    setIsDetailsModalOpen(true);
  };

  // Flatten pages data
  const calls = data?.pages.flatMap((page) => page.calls) || [];
  const totalCalls = data?.pages[0]?.total || 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Calls
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Manage and monitor your AI calls ({totalCalls} total)
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Call
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search calls by contact name, phone, or outcome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Calls List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : isError ? (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400">Failed to load calls</p>
          </div>
        ) : calls.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <Phone className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No calls yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first AI-powered call
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Call
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {calls.map((call) => (
              <div
                key={call.id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Call Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {call.contact.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                          <Phone className="h-4 w-4 mr-1" />
                          {call.contact.formattedPhoneNumber}
                        </p>
                      </div>
                      <StatusBadge status={call.status} />
                    </div>

                    {call.outcome && (
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Outcome:
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {call.outcome}
                        </span>
                      </div>
                    )}

                    {call.summary && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {call.summary}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                      <span>Created {formatRelativeTime(call.createdAt)}</span>
                      {call.updatedAt !== call.createdAt && (
                        <span>Updated {formatRelativeTime(call.updatedAt)}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {call.status === 'queued' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleLaunch(call)}
                        isLoading={launchMutation.isPending}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Launch
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleViewDetails(call)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Infinite scroll trigger */}
        {hasNextPage && (
          <div ref={observerTarget} className="flex justify-center py-4">
            {isFetchingNextPage && <LoadingSpinner />}
          </div>
        )}
      </div>

      {/* Create Call Modal */}
      <CreateCallModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Call Details Modal */}
      {selectedCall && (
        <CallDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedCall(null);
          }}
          call={selectedCall}
        />
      )}
    </AppLayout>
  );
}

// Create Call Modal Component
function CreateCallModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [contactId, setContactId] = useState('');
  const [agentPrompt, setAgentPrompt] = useState('');
  const [callGoals, setCallGoals] = useState('');
  const [errors, setErrors] = useState<{ contactId?: string; agentPrompt?: string; callGoals?: string }>({});

  // Fetch contacts for dropdown
  const { data: contactsData } = useQuery({
    queryKey: ['contacts-all'],
    queryFn: () => contactsApi.getAll(1, 100),
  });

  const createMutation = useMutation({
    mutationFn: callsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calls'] });
      toast.success('Call created successfully');
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create call');
    },
  });

  const resetForm = () => {
    setContactId('');
    setAgentPrompt('');
    setCallGoals('');
    setErrors({});
  };

  const generatePrompt = () => {
    const prompt = `You are a friendly and professional AI assistant calling on behalf of [Company Name]. 

Your objective is to have a natural conversation with the contact and achieve the following goals:
- Introduce yourself and the purpose of the call
- Build rapport and listen actively to their responses
- Address any questions or concerns they may have
- Collect key information about their interest and needs

Important guidelines:
- Be conversational and empathetic
- Don't sound scripted or robotic
- Adapt to the flow of the conversation
- If they're not interested or unavailable, politely offer to call back later
- Always be respectful of their time

At the end of the call, provide:
1. A brief summary of the conversation
2. A structured JSON output with key data points collected`;

    setAgentPrompt(prompt);
  };

  const validateForm = () => {
    const newErrors: { contactId?: string; agentPrompt?: string; callGoals?: string } = {};
    
    if (!contactId) {
      newErrors.contactId = 'Contact is required';
    }
    
    if (!agentPrompt.trim()) {
      newErrors.agentPrompt = 'Agent prompt is required';
    }
    
    if (!callGoals.trim()) {
      newErrors.callGoals = 'Call goals are required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      createMutation.mutate({
        contactId,
        agentPrompt: agentPrompt.trim(),
        callGoals: callGoals.trim(),
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Call" size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Contact Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Contact
          </label>
          <select
            value={contactId}
            onChange={(e) => {
              setContactId(e.target.value);
              setErrors({ ...errors, contactId: undefined });
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">Select a contact</option>
            {contactsData?.contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name} - {contact.formattedPhoneNumber}
              </option>
            ))}
          </select>
          {errors.contactId && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.contactId}</p>
          )}
        </div>

        {/* Agent Prompt */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Agent Prompt
            </label>
            <button
              type="button"
              onClick={generatePrompt}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
            >
              <Sparkles className="h-4 w-4" />
              Generate Template
            </button>
          </div>
          <Textarea
            value={agentPrompt}
            onChange={(e) => {
              setAgentPrompt(e.target.value);
              setErrors({ ...errors, agentPrompt: undefined });
            }}
            error={errors.agentPrompt}
            placeholder="Enter the AI agent instructions and conversation flow..."
            className="min-h-[200px]"
          />
        </div>

        {/* Call Goals */}
        <Textarea
          label="Call Goals"
          value={callGoals}
          onChange={(e) => {
            setCallGoals(e.target.value);
            setErrors({ ...errors, callGoals: undefined });
          }}
          error={errors.callGoals}
          placeholder="e.g., Determine interest level, identify objections, schedule callback if needed"
          className="min-h-[100px]"
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            isLoading={createMutation.isPending}
          >
            Create Call
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Call Details Modal Component
function CallDetailsModal({
  isOpen,
  onClose,
  call,
}: {
  isOpen: boolean;
  onClose: () => void;
  call: Call;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Call Details" size="xl">
      <div className="space-y-6">
        {/* Contact Info */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Contact Information
          </h3>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Name:</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">{call.contact.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone:</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">{call.contact.formattedPhoneNumber}</span>
            </div>
          </div>
        </div>

        {/* Call Status */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Call Status
          </h3>
          <div className="flex items-center gap-4">
            <StatusBadge status={call.status} />
            {call.outcome && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Outcome: {call.outcome}
              </span>
            )}
          </div>
        </div>

        {/* Agent Prompt */}
        {call.agentPrompt && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Agent Prompt
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {call.agentPrompt}
              </p>
            </div>
          </div>
        )}

        {/* Call Goals */}
        {call.callGoals && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Call Goals
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {call.callGoals}
              </p>
            </div>
          </div>
        )}

        {/* Summary */}
        {call.summary && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Call Summary
            </h3>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {call.summary}
              </p>
            </div>
          </div>
        )}

        {/* Transcript */}
        {call.transcript && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Transcript
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {call.transcript}
              </p>
            </div>
          </div>
        )}

        {/* Structured Output */}
        {call.structuredOutput && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Structured Data
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <pre className="text-sm text-gray-600 dark:text-gray-400 overflow-x-auto">
                {JSON.stringify(call.structuredOutput, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Timeline
          </h3>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">Created:</span>
              <span className="text-gray-600 dark:text-gray-400">{formatDate(call.createdAt)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">Last Updated:</span>
              <span className="text-gray-600 dark:text-gray-400">{formatDate(call.updatedAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
