/**
 * Educational quiz. No personal information is collected or stored; answers
 * live only in component state for the duration of the session.
 */
export const QUIZ_QUESTIONS = [
  {
    id: 'q1',
    topic: 'UPI PIN safety',
    question: 'Someone calls and says they need your UPI PIN to send you a refund. What should you do?',
    options: [
      'Share the PIN so the refund can be processed',
      'Enter the PIN in your app as instructed',
      'Refuse, end the call, and check your account in your official app',
      'Share only the last two digits of the PIN',
    ],
    correctIndex: 2,
    explanation:
      'A UPI PIN authorizes a payment from your account. It is never needed to receive money, and it should never be shared with anyone.',
  },
  {
    id: 'q2',
    topic: 'OTP protection',
    question: 'A caller claiming to be from your bank asks for the OTP you just received. What is the correct response?',
    options: [
      'Share it because the caller knows your name',
      'Never share the OTP and contact the bank through an official number',
      'Forward the OTP by SMS to verify the caller',
      'Share it only if the caller gives an employee ID',
    ],
    correctIndex: 1,
    explanation:
      'Genuine bank staff never ask for an OTP. An OTP authorizes an action, so sharing it can let someone access your account or approve a transaction.',
  },
  {
    id: 'q3',
    topic: 'Collect requests',
    question: 'An unexpected UPI collect request appears with the note "cashback refund". What does approving it do?',
    options: [
      'Credits the amount to your account',
      'Pays the requester from your account',
      'Cancels the request automatically',
      'Adds the sender to your trusted contacts',
    ],
    correctIndex: 1,
    explanation:
      'Approving a collect request with your PIN authorizes a debit. If you did not expect the request, decline it.',
  },
  {
    id: 'q4',
    topic: 'QR-code scams',
    question: 'A seller sends a QR code and says scanning it will transfer money to you. Is this correct?',
    options: [
      'Yes, QR codes are used to receive money',
      'Yes, but only for amounts under Rs 500',
      'No, scanning and paying sends money from your account',
      'No, QR codes only work at physical shops',
    ],
    correctIndex: 2,
    explanation:
      'Scanning a QR code opens a payment screen. Entering your PIN then authorizes a payment from your account, not a credit to it.',
  },
  {
    id: 'q5',
    topic: 'Fake KYC messages',
    question: 'An SMS says your KYC has expired and your account will be blocked unless you click a link. What should you do?',
    options: [
      'Click the link and complete the form quickly',
      'Reply with your account number to verify',
      'Ignore the link and check your KYC status in your bank\'s official app',
      'Forward the message to friends as a warning and click later',
    ],
    correctIndex: 2,
    explanation:
      'Banks do not ask customers to complete KYC through links in SMS messages. Check the real status in the official app or at a branch.',
  },
  {
    id: 'q6',
    topic: 'Cashback fraud',
    question: 'A message offers Rs 5,000 cashback if you pay a Rs 10 verification fee. What is the safest response?',
    options: [
      'Pay the small fee, since the risk is low',
      'Treat it as a scam and do not pay or share details',
      'Send a collect request back for Rs 10',
      'Share your UPI ID but not your PIN',
    ],
    correctIndex: 1,
    explanation:
      'Genuine rewards do not require a payment or verification fee. "Pay to receive" offers are a classic fraud pattern.',
  },
  {
    id: 'q7',
    topic: 'Fake customer care',
    question: 'You find a customer-care number in a search advertisement. What should you do before calling?',
    options: [
      'Call immediately because it appears in search results',
      'Verify the number on the official website, app, or card',
      'Ask the number to confirm it is genuine on the call',
      'Use it if the advertisement has a brand logo',
    ],
    correctIndex: 1,
    explanation:
      'Fraudsters buy search advertisements and post fake helpline numbers. Verify through the official website, app, or the number printed on your card.',
  },
  {
    id: 'q8',
    topic: 'Payment screenshots',
    question: 'A buyer sends a screenshot showing a successful UPI transfer. How should you confirm the payment?',
    options: [
      'Trust the screenshot because it shows a reference number',
      'Ask the buyer to send a second screenshot',
      'Check the credit in your own bank or UPI app transaction history',
      'Deliver the goods and confirm later',
    ],
    correctIndex: 2,
    explanation:
      'Screenshots can be edited. Only your own account transaction history confirms whether money actually arrived.',
  },
  {
    id: 'q9',
    topic: 'Suspicious URLs',
    question: 'Which link is the safest way to reach your bank?',
    options: [
      'A shortened link from an SMS alert',
      'A link in a WhatsApp message from an unknown number',
      'The official app installed from your app store',
      'A search advertisement offering faster login',
    ],
    correctIndex: 2,
    explanation:
      'Use the official app or type the bank\'s website address yourself. Links from unexpected messages and advertisements can lead to look-alike pages.',
  },
  {
    id: 'q10',
    topic: 'Reporting cybercrime',
    question: 'What is India\'s national cybercrime helpline for reporting financial fraud?',
    options: ['100', '1930', '181', '112'],
    correctIndex: 1,
    explanation:
      '1930 is India\'s national cybercrime financial fraud helpline. Complaints can also be filed at cybercrime.gov.in.',
  },
  {
    id: 'q11',
    topic: 'Remote access',
    question: 'A "bank support agent" asks you to install a screen-sharing app to fix a failed transaction. What should you do?',
    options: [
      'Install it and share the access code',
      'Install it but close your banking app first',
      'Refuse and contact the bank through an official number',
      'Install it only if the call is on a recorded line',
    ],
    correctIndex: 2,
    explanation:
      'Remote-access apps can expose OTPs and banking screens, and may let the other person control your device. Genuine support does not need this.',
  },
  {
    id: 'q12',
    topic: 'After a scam',
    question: 'Money has been debited by a fraudster. Which sequence is most appropriate?',
    options: [
      'Wait a week, then call the bank',
      'Pay a recovery agent who promises a guaranteed refund',
      'Stop further payments, contact your bank, call 1930, and preserve evidence',
      'Delete the messages and uninstall your UPI app',
    ],
    correctIndex: 2,
    explanation:
      'Act quickly: stop payments, contact your bank through official channels, report to 1930, preserve evidence, and beware of recovery scams. Recovery is not guaranteed.',
  },
]
