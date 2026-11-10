/** Emergency response guidance and verified official reporting resources. */

export const EMERGENCY_STEPS = [
  {
    title: 'Stop further payments immediately',
    detail:
      'Do not send more money, approve any request, or enter your PIN again. Disconnect any remote-access session that is active.',
  },
  {
    title: 'Contact your bank or payment provider',
    detail:
      'Use the number printed on your card, your bank statement, or the official app. Explain what happened and ask them to secure the account and payment services.',
  },
  {
    title: 'Report financial cyber fraud on 1930',
    detail:
      'Call India\'s national cybercrime financial fraud helpline, 1930, as soon as possible. Quick reporting gives the best chance of limiting further loss.',
  },
  {
    title: 'File a complaint on the National Cyber Crime Reporting Portal',
    detail:
      'Submit the details at cybercrime.gov.in. Keep the complaint reference number you receive.',
  },
  {
    title: 'Preserve evidence',
    detail:
      'Save transaction IDs, UPI reference numbers, screenshots, phone numbers, chat logs, and the exact message you received. Do not delete the conversation.',
  },
  {
    title: 'Ask your bank to block or secure affected services',
    detail:
      'Request a review of the transactions and ask about blocking the card, UPI access, or internet banking if you believe they are compromised.',
  },
  {
    title: 'Change compromised passwords',
    detail:
      'If you shared a password or suspect account access, change it from a trusted device and enable any available two-factor authentication.',
  },
  {
    title: 'Do not share more OTPs or credentials',
    detail:
      'Anyone claiming they can recover your money in exchange for an OTP, PIN, or payment is trying to scam you again.',
  },
  {
    title: 'Beware of recovery scams',
    detail:
      'Be cautious of people or websites promising guaranteed refunds for an upfront fee. No one can guarantee recovery.',
  },
]

export const OFFICIAL_RESOURCES = [
  {
    id: 'cybercrime-portal',
    name: 'National Cyber Crime Reporting Portal',
    description:
      'The official Government of India portal for reporting cybercrime, including financial fraud.',
    value: 'cybercrime.gov.in',
    href: 'https://cybercrime.gov.in/',
    type: 'website',
  },
  {
    id: 'helpline-1930',
    name: 'Indian Cybercrime Helpline',
    description:
      'India\'s national helpline for reporting financial cyber fraud. Call as soon as possible after a loss.',
    value: '1930',
    href: 'tel:1930',
    type: 'phone',
  },
  {
    id: 'npci',
    name: 'NPCI',
    description:
      'National Payments Corporation of India, the organization that operates the UPI payments network.',
    value: 'npci.org.in',
    href: 'https://www.npci.org.in/',
    type: 'website',
  },
  {
    id: 'rbi',
    name: 'Reserve Bank of India',
    description:
      'India\'s central bank. Use its official website for banking guidance and awareness material.',
    value: 'rbi.org.in',
    href: 'https://www.rbi.org.in/',
    type: 'website',
  },
]

export const SAFETY_TIPS = [
  'Your UPI PIN only sends money out. Receiving money never needs a PIN.',
  'No genuine bank employee will ask for your OTP. Not on a call, not on chat, not on email.',
  'A payment screenshot is not proof. Confirm the credit in your own bank app.',
  'If a message creates panic, pause. Urgency is a tool used by fraudsters.',
  'Check the payee name in your UPI app before approving any payment.',
  'Treat a collect request like a bill: if you did not expect it, decline it.',
  'Never install a screen-sharing app because someone on a call asked you to.',
  'Verify a customer-care number on the official website, not in a search advertisement.',
  'Scanning a QR code and entering your PIN sends money, it does not receive money.',
  'Share your concern with a family member before making an unusual payment.',
  'Keep your banking and UPI apps updated from official app stores only.',
  'If money is lost, call 1930 quickly and preserve every transaction reference.',
]

export const FAQS = [
  {
    id: 'recovery',
    question: 'Can stolen money be recovered?',
    answer:
      'Recovery is not guaranteed, and no one can promise it. Reporting quickly to your bank and on 1930 gives authorities the best chance to act, but a report does not automatically reverse a transaction.',
  },
  {
    id: 'bank-ask-pin',
    question: 'Will my bank ever ask for my UPI PIN or OTP?',
    answer:
      'No. Genuine bank or payment-app staff do not ask for your UPI PIN, OTP, card CVV, or banking password. Treat any such request as fraud.',
  },
  {
    id: 'collect',
    question: 'What is a UPI collect request?',
    answer:
      'A collect request asks you to pay someone. Approving it with your PIN debits your account. If you did not expect the request, decline it.',
  },
  {
    id: 'qr',
    question: 'Is scanning a QR code a way to receive money?',
    answer:
      'No. Scanning a QR code starts a payment from your account. Entering your PIN afterward authorizes that payment, so verify the payee name before approving.',
  },
  {
    id: 'shared-otp',
    question: 'I shared an OTP by mistake. What should I do?',
    answer:
      'Call your bank immediately using its official number, check your account activity, and report the incident to 1930. Change any affected passwords from a trusted device.',
  },
  {
    id: 'helpline',
    question: 'What is 1930?',
    answer:
      '1930 is India\'s national cybercrime helpline for reporting financial cyber fraud. You can also file a complaint at cybercrime.gov.in.',
  },
  {
    id: 'report-reverse',
    question: 'Does filing a complaint automatically reverse the transaction?',
    answer:
      'No. A complaint starts an official process. It does not guarantee a refund or automatically undo a payment, which is why acting quickly and preserving evidence matters.',
  },
  {
    id: 'safe-app',
    question: 'Are UPI apps safe to use?',
    answer:
      'UPI is a regulated payments system, but safety also depends on how you use it. Download apps from official stores, verify payees, and never share credentials. No app or website can be guaranteed scam-proof.',
  },
  {
    id: 'screen-share',
    question: 'Why is screen-sharing dangerous during a support call?',
    answer:
      'Screen-sharing can expose OTP notifications and banking screens to the other person, and some tools allow them to control your device. Genuine support does not need remote control of your phone.',
  },
  {
    id: 'report-scam',
    question: 'Where can I report a scam message that did not cause a loss?',
    answer:
      'You can report it on cybercrime.gov.in and report or block the sender in your messaging app. If any money was lost, call 1930 as well.',
  },
]
