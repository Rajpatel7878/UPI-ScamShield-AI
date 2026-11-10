import {
  ArrowDownToLine,
  Gift,
  ImageOff,
  Inbox,
  KeyRound,
  Link2,
  MonitorSmartphone,
  PhoneCall,
  RefreshCw,
  ShieldAlert,
  Smartphone,
  UserCheck,
} from 'lucide-react'

/** Non-negotiable UPI safety rules, shown as an interactive checklist. */
export const SAFETY_RULES = [
  {
    id: 'never-share-pin',
    icon: KeyRound,
    title: 'Never share your UPI PIN',
    summary:
      'Your UPI PIN authorizes payments from your account. No bank, payment app, or support agent needs it.',
    example:
      'A caller says they need your PIN to reverse a wrong debit. A genuine bank will never ask for it.',
  },
  {
    id: 'protect-otp',
    icon: ShieldAlert,
    title: 'Never share OTPs or banking passwords',
    summary:
      'One-time passwords and banking passwords are for your eyes only. Sharing them can give someone full access.',
    example:
      'A "delivery agent" asks for the OTP sent to your phone. Do not share it; the parcel does not need it.',
  },
  {
    id: 'pin-only-in-app',
    icon: Smartphone,
    title: 'Enter your UPI PIN only in your trusted payment app',
    summary:
      'Enter the PIN only when you are intentionally authorizing a transaction inside the app you installed from an official source.',
    example:
      'If a web page or a stranger on a call asks for the PIN, stop. The PIN belongs in your app, not in a conversation.',
  },
  {
    id: 'receiving-no-pin',
    icon: ArrowDownToLine,
    title: 'Receiving money never requires your UPI PIN',
    summary:
      'Money can arrive without any action from you. A PIN prompt always authorizes a debit, not a credit.',
    example:
      'A "buyer" asks you to enter your PIN to receive a payment. Declining the request is the safe choice.',
  },
  {
    id: 'verify-recipient',
    icon: UserCheck,
    title: 'Verify the recipient before sending money',
    summary:
      'Check the payee name shown by your app and confirm it matches the person or business you intend to pay.',
    example:
      'A shop asks you to pay a personal UPI ID instead of its business account. Ask why before approving.',
  },
  {
    id: 'decline-collect',
    icon: Inbox,
    title: 'Do not approve unknown collect requests',
    summary:
      'Approving a collect request pays the requester. Decline any request you did not expect or initiate.',
    example:
      'A request labelled "refund" appears from an unknown UPI ID. Approving it would debit your account.',
  },
  {
    id: 'avoid-links',
    icon: Link2,
    title: 'Avoid clicking suspicious SMS and WhatsApp links',
    summary:
      'Links can lead to look-alike bank pages or malicious downloads. Reach services through official apps instead.',
    example:
      'An SMS says your KYC will expire and includes a link. Open your bank\'s official app instead of the link.',
  },
  {
    id: 'no-remote-access',
    icon: MonitorSmartphone,
    title: 'Never install remote-access apps for an unknown caller',
    summary:
      'Screen-sharing gives a stranger visibility and control. Genuine support does not need to control your phone.',
    example:
      'A "bank agent" asks you to install a support app and share an access code. End the call.',
  },
  {
    id: 'check-screenshots',
    icon: ImageOff,
    title: 'Do not trust payment screenshots',
    summary:
      'Screenshots can be edited or faked. Confirm a payment only in your own account transaction history.',
    example:
      'A buyer sends a "payment successful" image. Check your app; if there is no credit, the payment has not arrived.',
  },
  {
    id: 'official-care',
    icon: PhoneCall,
    title: 'Verify customer-care numbers through official sources',
    summary:
      'Search ads and social media comments often contain fake helpline numbers. Use the number on your card or official app.',
    example:
      'A search result gives a support number for your bank. Confirm it on the bank\'s official website before calling.',
  },
  {
    id: 'beware-rewards',
    icon: Gift,
    title: 'Be suspicious of unexpected rewards and urgent payment requests',
    summary:
      'Unexpected prizes, cashback, and same-day deadlines are common manipulation tactics.',
    example:
      'A message offers a large cashback if you pay a small fee today. Delete it.',
  },
  {
    id: 'keep-updated',
    icon: RefreshCw,
    title: 'Keep payment applications and devices updated',
    summary:
      'Security updates fix known weaknesses. Install updates from official app stores and avoid sideloaded APKs.',
    example:
      'A chat message offers a "beta" banking app as an APK file. Do not install it; use the official store listing.',
  },
]
