"use client";

import { useState } from 'react'

import { FAQS } from '../../data/awareness/emergency.js'
import { AccordionItem } from '../ui/index.js'

/** Single-open FAQ accordion. */
export function FaqSection() {
  const [openId, setOpenId] = useState(FAQS[0]?.id ?? null)

  return (
    <div className="space-y-2">
      {FAQS.map((faq) => (
        <AccordionItem
          key={faq.id}
          id={`faq-${faq.id}`}
          title={faq.question}
          isOpen={openId === `faq-${faq.id}`}
          onToggle={() =>
            setOpenId((current) => (current === `faq-${faq.id}` ? null : `faq-${faq.id}`))
          }
        >
          <p className="type-body text-slate-300">{faq.answer}</p>
        </AccordionItem>
      ))}
    </div>
  )
}
