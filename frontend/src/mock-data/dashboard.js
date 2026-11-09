/**
 * Demo data for the Security Analytics Dashboard.
 * All values are illustrative and clearly labeled as Demo Data.
 * Do not connect to real backend — these are static demonstration values.
 */

/** Risk distribution: low, medium, high, critical */
export const RISK_DISTRIBUTION = {
  low: 420,
  medium: 360,
  high: 320,
  critical: 184,
}

/** Seven-day scan activity (Monday through Sunday) */
export const DAILY_SCANS = {
  monday: 32,
  tuesday: 45,
  wednesday: 38,
  thursday: 60,
  friday: 52,
  saturday: 72,
  sunday: 84,
}

/** Recent scan activity records (fictional, not real user data) */
export const RECENT_SCANS = [
  {
    id: 1,
    content: 'Suspicious KYC message',
    type: 'SMS',
    riskLevel: 'Critical',
    riskScore: 94,
    date: '2026-01-15',
  },
  {
    id: 2,
    content: 'Unknown payment URL',
    type: 'URL',
    riskLevel: 'High',
    riskScore: 82,
    date: '2026-01-14',
  },
  {
    id: 3,
    content: 'Cashback offer message',
    type: 'WhatsApp',
    riskLevel: 'Medium',
    riskScore: 57,
    date: '2026-01-13',
  },
  {
    id: 4,
    content: 'Bank account alert',
    type: 'SMS',
    riskLevel: 'High',
    riskScore: 76,
    date: '2026-01-12',
  },
  {
    id: 5,
    content: 'Normal payment reminder',
    type: 'SMS',
    riskLevel: 'Low',
    riskScore: 12,
    date: '2026-01-11',
  },
]

/** Risk insights — common indicators with icons */
export const RISK_INDICATORS = [
  {
    id: 1,
    icon: 'Lock',
    title: 'Urgent account-blocking language',
    description: 'Messages claiming immediate account suspension or closure.',
  },
  {
    id: 2,
    icon: 'Link',
    title: 'Suspicious external links',
    description: 'Unfamiliar URLs prompting immediate click-through.',
  },
  {
    id: 3,
    icon: 'ShieldAlert',
    title: 'Requests for OTP or UPI PIN',
    description: 'Legitimate banks never ask for one-time passwords.',
  },
  {
    id: 4,
    icon: 'Gift',
    title: 'Fake cashback or reward offers',
    description: 'Unexpected rewards designed to extract personal data.',
  },
  {
    id: 5,
    icon: 'UserRound',
    title: 'Impersonation of banking institutions',
    description: 'Messages mimicking known banks or financial institutions.',
  },
]

/** Quick action links */
export const QUICK_ACTIONS = [
  { label: 'Analyze a Message', to: '/detect', icon: 'MessageCircle', variant: 'primary' },
  { label: 'Review Scan History', to: '/history', icon: 'History', variant: 'secondary' },
  { label: 'Explore Scam Awareness', to: '/awareness', icon: 'GraduationCap', variant: 'secondary' },
  { label: 'View Security Analytics', to: '/analytics', icon: 'ChartNoAxesColumn', variant: 'secondary' },
]

/** Statistics card data */
export const STATS_CARDS = [
  {
    id: 1,
    label: 'Total Scans',
    value: '1,284',
    description: 'Total content analyses',
    icon: 'ScanLine',
    tone: 'brand',
  },
  {
    id: 2,
    label: 'Suspicious Detected',
    value: '186',
    description: 'Analyses marked suspicious',
    icon: 'ShieldAlert',
    tone: 'warning',
  },
  {
    id: 3,
    label: 'Critical Alerts',
    value: '42',
    description: 'High-priority risk findings',
    icon: 'AlertCircle',
    tone: 'danger',
  },
  {
    id: 4,
    label: 'Average Risk Score',
    value: '64/100',
    description: 'Average score across sample scans',
    icon: 'TrendingUp',
    tone: 'success',
  },
]