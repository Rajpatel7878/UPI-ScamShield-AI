import { useEffect, useRef, useState } from 'react'

import { AppLayout } from '../components/layout/AppLayout.jsx'
import {
  ContentTypeSelector,
  MessageInput,
  URLInput,
  ExampleMessages,
  PrivacyNotice,
  AnalyzeButton,
  AnalysisResult,
} from '../components/detection/index.js'

/** Demo result shown after a simulated analyze click. */
function DemoResult() {
  const demoResult = {
    riskScore: 78,
    severity: 'high',
    category: 'Phishing attempt',
    summary:
      'The submitted content contains patterns commonly associated with UPI phishing scams.',
    indicators: [
      'Urgent language prompting immediate action',
      'Suspicious external link included',
      'Request for verification via unfamiliar URL',
    ],
    recommendedActions: [
      'Do not click any included links',
      'Verify the request through your bank\'s official app',
      'Delete the message and block the sender',
    ],
    safetyWarning:
      'Never share your UPI PIN, OTP, or banking password. Legitimate banks never ask for these.',
  }

  return <AnalysisResult result={demoResult} hasResult={true} onDismiss={() => {}} />
}

/** Detection page. */
export default function Detection() {
  const [contentType, setContentType] = useState('sms')
  const [inputValue, setInputValue] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const inputRef = useRef(null)

  // Set example text when content type changes
  useEffect(() => {
    const examples = {
      sms: 'Your bank account will be blocked today. Complete KYC immediately using this link.',
      whatsapp: 'Congratulations! You have won a 5000 cashback reward. Pay a small processing fee to claim it.',
      payment: 'Your UPI payment is pending. Share your OTP with our support agent to complete verification.',
      url: 'https://example.com/upi-kyc-verify',
    }
    setInputValue(examples[contentType])
  }, [contentType])

  const handleContentTypeChange = (key) => {
    setContentType(key)
    setInputValue('')
  }

  const handleInputChange = (value) => {
    setInputValue(value)
  }

  const handleClear = () => {
    setInputValue('')
    setShowResult(false)
    inputRef.current?.focus()
  }

  const handleAnalyze = () => {
    const text = inputValue.trim()
    if (!text) return

    // Simulate analysis interaction - UI only, no real API
    setIsAnalyzing(true)
    setTimeout(() => {
      setIsAnalyzing(false)
      setShowResult(true)
    }, 1000)
  }

  return (
    <AppLayout>
      {/* Demo data label */}
      <p className="mt-3 text-xs text-slate-500">
        <span className="font-medium">Demo Data</span> — All values and
        demonstration results are illustrative and do not represent real
        analysis outcomes until backend integration.
      </p>

      {/* Demo result after analysis */}
      {showResult && <DemoResult />}

      {/* Detection Header */}
      <header className="pt-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="type-h2 mb-1">
            Analyze Suspicious Content
          </h2>
          <p className="type-body text-muted mb-4">
            Check suspicious UPI messages, payment requests, SMS, WhatsApp
            messages, and URLs to understand potential security risks.
          </p>
          <p className="type-caption text-slate-500">
            <strong>AI-assisted security analysis</strong> — This interface is
            prepared for future AI integration. Currently, analysis is a local
            demonstration.
          </p>
        </div>
      </header>

      {/* Content Type Selector */}
      <section className="mb-6">
        <ContentTypeSelector
          selectedKey={contentType}
          onSelect={handleContentTypeChange}
        />
      </section>

      {/* Input Area */}
      <section className="mb-6">
        {contentType === 'url' ? (
          <URLInput
            value={inputValue}
            onChange={handleInputChange}
            onClear={handleClear}
            disabled={isAnalyzing}
          />
        ) : (
          <MessageInput
            contentType={contentType}
            value={inputValue}
            onChange={handleInputChange}
            onClear={handleClear}
            disabled={isAnalyzing}
          />
        )}
      </section>

      {/* Example Content */}
      {contentType !== 'url' && (
        <section className="mb-6">
          <ExampleMessages
            contentType={contentType}
            inputValue={inputValue}
            onExampleSelect={() => {}}
          />
        </section>
      )}

      {/* Privacy Notice */}
      <PrivacyNotice />

      {/* Analyze Button */}
      <section className="mb-6">
        <AnalyzeButton
          isDisabled={!inputValue.trim() || isAnalyzing}
          onClick={handleAnalyze}
          showDemoNotice={!showResult}
        />
      </section>
    </AppLayout>
  )
}