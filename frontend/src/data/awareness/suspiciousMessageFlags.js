import {
  AlertTriangle,
  Banknote,
  Clock,
  EyeOff,
  Gift,
  Link2,
  LockKeyhole,
  MessageSquareWarning,
  MonitorSmartphone,
  Smartphone,
  UserRoundX,
} from 'lucide-react'

/** Red flags that help users spot a suspicious message before acting. */
export const SUSPICIOUS_MESSAGE_FLAGS = [
  {
    id: 'urgency',
    icon: Clock,
    title: 'A deadline measured in minutes',
    description:
      'Countdowns, "today only" warnings, and threats of immediate blocking are designed to stop you from checking.',
  },
  {
    id: 'credentials',
    icon: LockKeyhole,
    title: 'Any request for a PIN, OTP, or password',
    description:
      'Genuine organizations never ask for these to verify, refund, or protect your account.',
  },
  {
    id: 'links',
    icon: Link2,
    title: 'Unexpected links and shortened URLs',
    description:
      'Look-alike domains and hidden destinations are common in phishing. Navigate to the official app instead.',
  },
  {
    id: 'sender',
    icon: UserRoundX,
    title: 'An unfamiliar sender or mismatched identity',
    description:
      'A bank message from a personal number, or a brand name spelled slightly differently, is a warning sign.',
  },
  {
    id: 'receive-payment',
    icon: Banknote,
    title: 'A request to pay in order to receive',
    description:
      'Fees, PIN entries, or collect approvals are never required to receive a genuine refund or reward.',
  },
  {
    id: 'secrecy',
    icon: EyeOff,
    title: 'Requests for secrecy or isolation',
    description:
      'Being told not to tell family, or to stay on a call, is a manipulation tactic used to prevent a second opinion.',
  },
  {
    id: 'remote',
    icon: MonitorSmartphone,
    title: 'A request to install a screen-sharing app',
    description:
      'Remote access lets a stranger see your notifications and banking screens. Legitimate support does not need it.',
  },
  {
    id: 'too-good',
    icon: Gift,
    title: 'Rewards far larger than the effort involved',
    description:
      'Lottery wins, huge cashback, and high daily earnings for simple tasks are common bait.',
  },
  {
    id: 'payment-channel',
    icon: Smartphone,
    title: 'Pressure to leave the official app',
    description:
      'Being pushed to pay on a website, share a QR code, or use a personal UPI ID bypasses the protections you know.',
  },
  {
    id: 'threats',
    icon: AlertTriangle,
    title: 'Threats, emotional appeals, or fake authority',
    description:
      'Fear of arrest, account closure, or losing a parcel is used to override careful thinking.',
  },
  {
    id: 'language',
    icon: MessageSquareWarning,
    title: 'Odd formatting or generic greetings',
    description:
      'Spelling errors, mismatched logos, and greetings like "Dear customer" can indicate a bulk scam message.',
  },
]
