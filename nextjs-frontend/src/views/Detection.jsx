"use client";

import { useRef, useState } from 'react'
import { AlertTriangle, Info } from 'lucide-react'

import {
  AnalyzeButton,
  AnalysisResult,
  ContentTypeSelector,
  ExampleMessages,
  MessageInput,
  PrivacyNotice,
  URLInput,
} from '../components/detection/index.js'
import { apiClient } from '../services/apiClient.js'
import { GlassCard } from '../components/ui/index.js'

const CONTENT_TYPE_MAP = {
  sms: 'sms',
  whatsapp: 'whatsapp',
  payment: 'payment_request',
  url: 'url',
}

const SAFETY_WARNING =
  'Never share your UPI PIN, OTP, or banking password. Legitimate banks and ' +
  'support agents never ask for these to "verify" or "unlock" an account.'

function toResult(data) {
  return {
    riskScore: Number(data.risk_score || 0),
    severity: String(data.risk_level || 'Low').toLowerCase(),
    category: data.category || 'General Scam',
    summary: data.summary || '',
    indicators: Array.isArray(data.indicators) ? data.indicators : [],
    recommendedActions: Array.isArray(data.recommendations) ? data.recommendations : [],
    safetyWarning: SAFETY_WARNING,
    analysisType: data.analysis_type,
    aiStatus: data.ai_analysis?.status,
    aiProvider: data.ai_analysis?.provider,
    aiModel: data.ai_analysis?.model,
  }
}

export default function Detection() {
  const [contentType, setContentType] = useState('sms')
  const [inputValue, setInputValue] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const resultRef = useRef(null)

  const handleContentTypeChange = (key) => {
    setContentType(key)
    setInputValue('')
    setResult(null)
    setError('')
  }

  const handleAnalyze = async () => {
    const text = inputValue.trim()
    if (!text || isAnalyzing) return

    setIsAnalyzing(true)
    setError('')
    setResult(null)

    try {
      const { data } = await apiClient.post(
        '/detect/analyze',
        {
          content: text,
          content_type: CONTENT_TYPE_MAP[contentType] || 'general',
        },
        { timeout: 45000 },
      )
      setResult(toResult(data))
      requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        resultRef.current?.focus?.()
      })
    } catch (requestError) {
      setError(requestError?.message || 'Analysis failed. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="relative">
      <GlassCard
        className="max-w-3xl mx-auto neon-border-red animate-fade-up entrance-1"
        padding="xl"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
          <div>
            <p className="type-label text-red-300 flex items-center gap-2">
              <Info className="size-3.5" aria-hidden="true" />
              Analyze suspicious content
            </p>
            <h1 className="type-h2 mt-1 font-display">Scam Scanner</h1>
          </div>
          <div className="flex items-end gap-3">
            <p className="hidden sm:block type-caption text-slate-500">
              Paste a message or URL to analyze it for fraud indicators.
            </p>
          </div>
        </div>

        {/* Privacy notice */}
        <PrivacyNotice />

        {/* Content type selector */}
        <section aria-labelledby="content-type-heading" className="mb-6">
          <h2 id="content-type-heading" className="type-label mb-3">
            Content type
          </h2>
          <ContentTypeSelector
            selectedKey={contentType}
            onSelect={handleContentTypeChange}
          />
        </section>

        {/* Input area */}
        <section aria-label="Content to analyze" className="mb-6">
          {contentType === 'url' ? (
            <URLInput
              value={inputValue}
              onChange={setInputValue}
              onClear={() => setInputValue('')}
              disabled={isAnalyzing}
            />
          ) : (
            <MessageInput
              contentType={contentType}
              value={inputValue}
              onChange={setInputValue}
              onClear={() => setInputValue('')}
              disabled={isAnalyzing}
              placeholder="Paste a suspicious SMS, WhatsApp message, or UPI payment request here…"
            />
          )}
        </section>

        {/* Example messages */}
        <ExampleMessages
          contentType={contentType}
          onInputChange={setInputValue}
          onExampleSelect={() => {
            setResult(null)
            setError('')
          }}
          isLoading={isAnalyzing}
        />

        {/* Analyze button */}
        <div className="mt-8">
          <AnalyzeButton
            isDisabled={!inputValue.trim()}
            isLoading={isAnalyzing}
            onClick={handleAnalyze}
            className="w-full lg:w-auto"
          />
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-4 neon-border-red"
          >
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-red-400"
              aria-hidden="true"
            />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Analyzing state */}
        {isAnalyzing && (
          <div
            role="status"
            aria-live="polite"
            className="mt-6 rounded-xl border border-white/10 bg-navy-800/50 p-6 glass"
          >
            <p className="type-body text-slate-300">
              Analyzing message and links…
            </p>
            <div className="mt-4 h-1 w-full rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 via-blue-500 to-magenta-500 animate-[ds-shimmer_2s_linear_infinite]"
                style={{ width: '70%' }}
              />
            </div>
          </div>
        )}

        {/* Results */}
        <div ref={resultRef} tabIndex={-1} className="outline-none mt-6">
          <AnalysisResult
            result={result}
            hasResult={Boolean(result)}
            onDismiss={() => setResult(null)}
          />
        </div>
      </GlassCard>
    </div>
  )
}
