import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn.js'
import { useState } from 'react'

/** Fictional examples for message modes. */
const MESSAGE_EXAMPLES = [
  {
    id: 1,
    text: 'Your bank account will be blocked today. Complete KYC immediately using this link.',
    label: 'Bank KYC scam',
  },
  {
    id: 2,
    text: 'Congratulations! You have won a ₹5,000 cashback reward. Pay a small processing fee to claim it.',
    label: 'Fake cashback reward',
  },
  {
    id: 3,
    text: 'Your UPI payment is pending. Share your OTP with our support agent to complete verification.',
    label: 'OTP phishing attempt',
  },
]

/** Illustrative examples for URL mode. */
const URL_EXAMPLES = [
  {
    id: 4,
    text: 'https://example.com/upi-kyc-verify',
    label: 'Fake KYC portal',
  },
  {
    id: 5,
    text: 'http://bank-security-alert.com/verify',
    label: 'Impersonation site',
  },
]

export function ExampleMessages({
  contentType = 'sms',
  inputValue,
  onInputChange,
  onExampleSelect,
  isLoading = false,
}) {
  const handleExampleClick = (text) => {
    onInputChange(text)
    onExampleSelect?.(text)
  }

  return (
    <>
      {contentType !== 'url' && (
        <div>
          <p className="type-caption text-slate-500">Example messages</p>
          <div className="grid grid-cols-2 gap-3">
            {MESSAGE_EXAMPLES.map((example) => (
              <button
                key={example.id}
                type="button"
                className={cn(
                  'flex items-center rounded-lg border border-navy-700 bg-navy-900/50 px-3 py-2 text-xs font-medium text-slate-400 hover:bg-white/5 transition-colors duration-200',
                  isLoading && 'pointer-events-none cursor-not-allowed opacity-50',
                )}
                onClick={() => handleExampleClick(example.text)}
                aria-label={example.label}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="size-3.5 me-2" aria-hidden="true" />
                ) : (
                  <span className="sr-only">Example</span>
                )}
                <span className="truncate w-exceed max-wcharly">{example.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {contentType === 'url' && (
        <div>
          <p className="type-caption text-slate-500">Example URLs</p>
          <div className="grid grid-cols-2 gap-3">
            {URL_EXAMPLES.map((example) => (
              <button
                key={example.id}
                type="button"
                className={cn(
                  'flex items-center rounded-lg border border-navy-700 bg-navy-900/50 px-3 py-2 text-xs font-medium text-slate-400 hover:bg-white/5 transition-colors duration-200',
                  isLoading && 'pointer-events-none cursor-not-allowed opacity-50',
                )}
                onClick={() => handleExampleClick(example.text)}
                aria-label={example.label}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="size-3.5 me-2" aria-hidden="true" />
                ) : (
                  <span className="sr-only">Example</span>
                )}
                <span className="truncate w-exceed max-w-60">{example.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}