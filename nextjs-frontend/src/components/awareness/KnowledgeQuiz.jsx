"use client";

import { useMemo, useState } from 'react'
import {
  CheckCircle2,
  RotateCcw,
  Trophy,
  XCircle,
} from 'lucide-react'

import { QUIZ_QUESTIONS } from '../../data/awareness/quiz.js'
import { Button } from '../ui/index.js'

function scoreMessage(score, total) {
  const ratio = score / total
  if (ratio === 1) return 'Excellent — every answer is correct. Keep verifying before you pay.'
  if (ratio >= 0.7) return 'Good awareness. Review the questions you missed and the safety rules above.'
  return 'Keep learning. Read the scam guides and safety checklist, then try the quiz again.'
}

/** Self-check knowledge quiz with immediate feedback, review, and restart. */
export function KnowledgeQuiz() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [answers, setAnswers] = useState([])
  const [finished, setFinished] = useState(false)

  const total = QUIZ_QUESTIONS.length
  const question = QUIZ_QUESTIONS[currentIndex]
  const score = useMemo(
    () =>
      answers.reduce(
        (sum, answer, index) =>
          sum + (answer === QUIZ_QUESTIONS[index].correctIndex ? 1 : 0),
        0,
      ),
    [answers],
  )
  const isAnswered = selectedIndex !== null
  const isLast = currentIndex === total - 1

  const selectOption = (optionIndex) => {
    if (isAnswered) return
    setSelectedIndex(optionIndex)
    setAnswers((previous) => {
      const next = [...previous]
      next[currentIndex] = optionIndex
      return next
    })
  }

  const goNext = () => {
    if (isLast) {
      setFinished(true)
      return
    }
    setCurrentIndex((index) => index + 1)
    setSelectedIndex(null)
  }

  const restart = () => {
    setCurrentIndex(0)
    setSelectedIndex(null)
    setAnswers([])
    setFinished(false)
  }

  if (finished) {
    return (
      <div className="animate-fade-in rounded-card border border-white/8 bg-navy-800 p-5 sm:p-6">
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-300 ring-1 ring-brand-500/25">
            <Trophy className="size-7" aria-hidden="true" />
          </span>
          <h3 className="type-h2 mt-4">
            Your score: {score} / {total}
          </h3>
          <p className="type-body mt-2 max-w-md text-slate-400">
            {scoreMessage(score, total)}
          </p>
          <p className="type-body-sm mt-2 max-w-md text-slate-500">
            This is a self-check exercise, not a certification. No personal
            information was collected, and no result is stored.
          </p>
          <Button
            className="mt-5"
            leftIcon={<RotateCcw className="size-4" aria-hidden="true" />}
            onClick={restart}
          >
            Restart quiz
          </Button>
        </div>

        <div className="mt-8 border-t border-white/5 pt-6">
          <h4 className="type-h3">Correct-answer review</h4>
          <ol className="mt-4 space-y-4">
            {QUIZ_QUESTIONS.map((item, index) => {
              const chosen = answers[index]
              const isCorrect = chosen === item.correctIndex
              return (
                <li
                  key={item.id}
                  className="rounded-xl border border-white/8 bg-navy-900/50 p-4"
                >
                  <p className="flex items-start gap-2 text-sm font-medium text-ink">
                    {isCorrect ? (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success-400" aria-hidden="true" />
                    ) : (
                      <XCircle className="mt-0.5 size-4 shrink-0 text-danger-400" aria-hidden="true" />
                    )}
                    <span>
                      {index + 1}. {item.question}
                    </span>
                  </p>
                  <div className="type-body-sm mt-2 space-y-1.5 pl-6">
                    <p className={isCorrect ? 'text-success-400' : 'text-danger-400'}>
                      Your answer: {item.options[chosen] ?? 'Not answered'}
                    </p>
                    {!isCorrect && (
                      <p className="text-success-400">
                        Correct answer: {item.options[item.correctIndex]}
                      </p>
                    )}
                    <p className="text-slate-400">{item.explanation}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-card border border-white/8 bg-navy-800 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="type-label text-brand-300">
          Question {currentIndex + 1} of {total}
        </p>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-muted">
          {question.topic}
        </span>
      </div>

      <div
        className="mt-3 h-1 overflow-hidden rounded-full bg-white/5"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={currentIndex + (isAnswered ? 1 : 0)}
        aria-label="Quiz progress"
      >
        <div
          className="h-full rounded-full bg-brand-500 transition-[width] duration-300"
          style={{ width: `${((currentIndex + (isAnswered ? 1 : 0)) / total) * 100}%` }}
        />
      </div>

      <h3 className="type-h3 mt-5 text-[0.95rem] leading-relaxed sm:text-base">
        {question.question}
      </h3>

      <div className="mt-4 space-y-2">
        {question.options.map((option, optionIndex) => {
          const isChosen = selectedIndex === optionIndex
          const isCorrectOption = optionIndex === question.correctIndex
          let style =
            'border-white/10 bg-navy-900/50 text-slate-300 hover:border-brand-500/40 hover:text-ink'
          if (isAnswered && isCorrectOption) {
            style = 'border-success-500/50 bg-success-500/10 text-success-400'
          } else if (isAnswered && isChosen) {
            style = 'border-danger-500/50 bg-danger-500/10 text-danger-400'
          } else if (isAnswered) {
            style = 'border-white/5 bg-navy-900/30 text-slate-500'
          }

          return (
            <button
              key={option}
              type="button"
              onClick={() => selectOption(optionIndex)}
              disabled={isAnswered}
              aria-pressed={isChosen}
              className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors disabled:cursor-default ${style}`}
            >
              <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-current font-mono text-[11px]">
                {String.fromCharCode(65 + optionIndex)}
              </span>
              <span>{option}</span>
            </button>
          )
        })}
      </div>

      {isAnswered && (
        <div
          className={`mt-4 rounded-xl border p-4 ${
            selectedIndex === question.correctIndex
              ? 'border-success-500/30 bg-success-500/[0.07]'
              : 'border-danger-500/30 bg-danger-500/[0.07]'
          }`}
          role="status"
          aria-live="polite"
        >
          <p
            className={`flex items-center gap-1.5 text-sm font-medium ${
              selectedIndex === question.correctIndex ? 'text-success-400' : 'text-danger-400'
            }`}
          >
            {selectedIndex === question.correctIndex ? (
              <CheckCircle2 className="size-4" aria-hidden="true" />
            ) : (
              <XCircle className="size-4" aria-hidden="true" />
            )}
            {selectedIndex === question.correctIndex ? 'Correct' : 'Not quite'}
          </p>
          <p className="type-body-sm mt-1.5 text-slate-300">{question.explanation}</p>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="type-body-sm">
          Correct so far: <span className="font-mono text-slate-300">{score}</span>
        </p>
        <Button onClick={goNext} disabled={!isAnswered}>
          {isLast ? 'See results' : 'Next question'}
        </Button>
      </div>
    </div>
  )
}
