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
      // AI-assisted analysis is bounded server-side to ~35 s, so the client
      // waits longer than the default request timeout instead of failing early.
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
    <div className="space-y-5">
      <div className="rounded-card border border-brand-500/20 bg-brand-500/5 p-4">
        <p className="type-body-sm flex items-start gap-2 text-slate-300">
          <Info className="mt-0.5 size-4 shrink-0 text-brand-300" aria-hidden="true" />
          <span>
            Rule-based analysis runs on this server. URL analysis is passive and
            never opens links. If a Gemini API key is configured, the message text
            is also sent to Google Gemini; otherwise only local analysis is used.
          </span>
        </p>
      </div>

      <section aria-labelledby="content-type-heading">
        <h2 id="content-type-heading" className="type-label mb-2">
          Content type
        </h2>
        <ContentTypeSelector
          selectedKey={contentType}
          onSelect={handleContentTypeChange}
        />
      </section>

      <section aria-label="Content to analyze">
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
          />
        )}
      </section>

      <ExampleMessages
        contentType={contentType}
        onInputChange={setInputValue}
        onExampleSelect={() => {
          setResult(null)
          setError('')
        }}
        isLoading={isAnalyzing}
      />

      <PrivacyNotice />

      <AnalyzeButton
        isDisabled={!inputValue.trim()}
        isLoading={isAnalyzing}
        onClick={handleAnalyze}
      />

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-danger-500/30 bg-danger-500/10 p-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger-400" aria-hidden="true" />
          <p className="text-sm text-danger-400">{error}</p>
        </div>
      )}

      {isAnalyzing && (
        <div role="status" aria-live="polite" className="rounded-card border border-white/10 bg-navy-800 p-6">
          <p className="type-body">Analyzing message and links…</p>
          <div className="mt-3 h-2 w-2/3 animate-pulse rounded bg-white/10" />
          <div className="mt-2 h-2 w-1/2 animate-pulse rounded bg-white/5" />
        </div>
      )}

      <div ref={resultRef} tabIndex={-1} className="outline-none">
        <AnalysisResult
          result={result}
          hasResult={Boolean(result)}
          onDismiss={() => setResult(null)}
        />
      </div>
    </div>
  )
}
