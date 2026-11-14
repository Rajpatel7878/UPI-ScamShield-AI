/**
 * Educational content for the Scam Awareness Center.
 *
 * All example messages are fictional and written for teaching purposes only.
 * They do not reproduce real victims' information, and they must stay clearly
 * labelled as examples wherever they are rendered.
 */

export const SCAM_CATEGORIES = [
  'Payment fraud',
  'Phishing',
  'Identity theft',
  'Social engineering',
  'Banking fraud',
  'Online shopping and rewards',
]

export const SCAMS = [
  {
    id: 'fake-kyc',
    name: 'Fake KYC verification scam',
    category: 'Banking fraud',
    icon: 'BadgeCheck',
    description:
      'A message or call claims your KYC is incomplete and your account will be blocked unless you "update" it immediately through a link.',
    howItWorks: [
      'You receive an SMS, email, or call saying your KYC has expired or is pending.',
      'The message includes a link to a look-alike bank page or asks you to install an app.',
      'The fake page collects your account details, card information, OTP, or UPI PIN.',
      'The fraudster uses those details to take over the account or authorize a payment.',
    ],
    warningSigns: [
      'A deadline measured in hours, with a threat of account closure.',
      'A link in an SMS instead of a request to use your bank\'s official app.',
      'Any request for your UPI PIN, OTP, card CVV, or internet banking password.',
      'A sender ID or number that does not match your bank\'s official channels.',
    ],
    exampleMessage:
      'Dear customer, your KYC is pending and your account will be blocked today. Complete verification now at [fictional link] and enter your details.',
    howToAvoid: [
      'Open your bank\'s official app or visit a branch to check KYC status.',
      'Never complete KYC through a link received in an SMS, email, or chat.',
      'Remember that genuine KYC never requires your UPI PIN or OTP.',
    ],
    whatToDo: [
      'Do not click the link or reply to the message.',
      'Verify the claim by calling your bank\'s number printed on your card or official website.',
      'If you entered details, contact your bank immediately and report to 1930.',
    ],
    attackerApproach:
      'Fraudsters send the same message to thousands of numbers, hoping a small number of worried customers will act before checking with their bank. The fake page is usually designed to look almost identical to a real banking login.',
    manipulationTechniques: [
      'Fear of losing access to your money',
      'Artificial urgency and a same-day deadline',
      'Borrowed authority of a bank or regulator',
    ],
    related: ['fake-bank-block', 'phishing-url', 'otp-theft'],
  },
  {
    id: 'fake-cashback',
    name: 'Fake cashback and reward scam',
    category: 'Online shopping and rewards',
    icon: 'Gift',
    description:
      'An offer promises a cashback, scratch card, or reward for a small "verification" payment or by entering payment details on a fake page.',
    howItWorks: [
      'A link or message offers cashback, a scratch card, or a reward from a well-known brand.',
      'You are asked to pay a small amount, approve a collect request, or enter card and UPI details.',
      'The promised reward never arrives, and the payment or details are taken by the fraudster.',
    ],
    warningSigns: [
      'A reward you never applied for, especially from an unknown sender.',
      'A request to pay money or approve a payment in order to receive money.',
      'Links with misspelled brand names or unfamiliar domains.',
      'Pressure to act before the offer "expires" in a few minutes.',
    ],
    exampleMessage:
      'Congratulations! You have won Rs 2,000 cashback. Pay Rs 10 verification to claim: [fictional link]. Offer valid for 15 minutes only.',
    howToAvoid: [
      'Check offers only inside the official app or website of the brand.',
      'Treat "pay to receive" offers as a red flag. Receiving money never requires a payment.',
      'Do not enter card, UPI, or banking credentials on a page reached from a chat link.',
    ],
    whatToDo: [
      'Close the page and do not approve any payment request.',
      'If you paid, note the transaction ID, contact your bank, and report to 1930.',
      'Report the message in your messaging app and block the sender.',
    ],
    attackerApproach:
      'The scam uses a small, low-risk payment to make the reward feel real. Once the first payment succeeds, the fraudster often asks for a larger "processing fee".',
    manipulationTechniques: [
      'Greed and the excitement of an unexpected win',
      'Small initial commitment that lowers suspicion',
      'Countdown pressure that discourages verification',
    ],
    related: ['lottery-prize', 'collect-request', 'upi-pin'],
  },
  {
    id: 'otp-theft',
    name: 'OTP theft scam',
    category: 'Identity theft',
    icon: 'KeyRound',
    description:
      'Someone poses as a bank official, delivery agent, or support staff and asks you to read out or forward a one-time password.',
    howItWorks: [
      'The fraudster already has some of your details, such as your name or masked card number.',
      'They trigger an OTP on your phone by starting a transaction or login.',
      'They call or message you claiming the OTP is needed to "cancel", "verify", or "complete" something.',
      'Once you share the OTP, the transaction or account change is approved.',
    ],
    warningSigns: [
      'Anyone asking for an OTP, even if they claim to be from your bank.',
      'An OTP arrives when you did not start any transaction.',
      'A caller who knows partial account details and uses them to sound genuine.',
      'Requests to forward an OTP screenshot or read it aloud.',
    ],
    exampleMessage:
      'Sir, I am calling from your bank. We are reversing a wrong debit. Please share the OTP you just received so we can cancel the transaction.',
    howToAvoid: [
      'Never share an OTP with anyone, including people claiming to be bank staff.',
      'Remember that an OTP authorizes an action; it is not a cancellation code.',
      'If an OTP arrives unexpectedly, treat it as a sign someone is trying to access your account.',
    ],
    whatToDo: [
      'End the call and do not share the code.',
      'Check your account and card activity in your bank\'s official app.',
      'If you shared an OTP, call your bank immediately and report to 1930.',
    ],
    attackerApproach:
      'The caller often already knows your name, the last digits of your card, or a recent transaction. That partial knowledge is used to appear legitimate and to make the OTP request sound procedural.',
    manipulationTechniques: [
      'Authority of a bank employee',
      'Confusion about a supposed wrong transaction',
      'Time pressure to "stop" a debit',
    ],
    related: ['upi-pin', 'fake-customer-care', 'fake-kyc'],
  },
  {
    id: 'upi-pin',
    name: 'UPI PIN collection scam',
    category: 'Payment fraud',
    icon: 'LockKeyhole',
    description:
      'A caller claims they need your UPI PIN to send you money, refund you, or verify your account. In reality, entering the PIN authorizes a payment from you.',
    howItWorks: [
      'The fraudster says a refund, prize, or transfer is waiting for you.',
      'They ask you to enter your UPI PIN in your payment app, or to share it with them.',
      'Entering the PIN confirms a payment or mandate that debits your account.',
      'The fraudster disappears, often before you notice the debit.',
    ],
    warningSigns: [
      'Any claim that a UPI PIN is needed to receive money.',
      'A request to enter your PIN while on a call with a stranger.',
      'Instructions to "approve" something you did not initiate.',
      'Requests to share your PIN, even partially.',
    ],
    exampleMessage:
      'I have sent you Rs 5,000 but it is stuck. Please enter your UPI PIN to receive it and confirm the transfer.',
    howToAvoid: [
      'Never share your UPI PIN with anyone, for any reason.',
      'Enter your PIN only inside your trusted payment app, and only when you are intentionally paying.',
      'Remember that receiving money does not require a PIN.',
    ],
    whatToDo: [
      'Do not enter the PIN or share it.',
      'Check your app for any pending collect or payment request and decline unknown ones.',
      'If you entered the PIN, contact your bank and report to 1930 immediately.',
    ],
    attackerApproach:
      'The scam flips the direction of a payment. The fraudster says money is coming to you, but the app screen they are describing is actually a debit authorization.',
    manipulationTechniques: [
      'Confusion between sending and receiving money',
      'The promise of an incoming refund or prize',
      'Polite, helpful language that discourages suspicion',
    ],
    related: ['collect-request', 'otp-theft', 'fake-cashback'],
  },
  {
    id: 'fake-customer-care',
    name: 'Fake customer-care scam',
    category: 'Social engineering',
    icon: 'Headphones',
    description:
      'A fake support number found online or in a message connects you to a fraudster who asks for remote access, OTPs, or payment.',
    howItWorks: [
      'You search for a customer-care number and find a result or ad planted by fraudsters.',
      'The "agent" asks you to install a remote-access app or share your screen.',
      'They then read your OTPs, open your banking app, or guide you into approving a payment.',
    ],
    warningSigns: [
      'Customer-care numbers from search ads, social media comments, or forwarded messages.',
      'Requests to install AnyDesk, TeamViewer, or another screen-sharing app.',
      'Asking you to read OTPs, PINs, or card details over the phone.',
      'The agent refuses to give a ticket number or official reference.',
    ],
    exampleMessage:
      'Customer care here. To fix your failed transaction, install this remote support app and share the 9-digit code shown on your screen.',
    howToAvoid: [
      'Use only the customer-care number printed on your card, statement, or official app.',
      'Never install a remote-access app at the request of an unknown caller.',
      'Never share your screen while a banking or payment app is open.',
    ],
    whatToDo: [
      'End the call and uninstall any remote-access app you installed.',
      'Call your bank using an official number and explain what happened.',
      'Report the fake number and the interaction to 1930.',
    ],
    attackerApproach:
      'Fraudsters pay for search advertisements and post fake helpline numbers under real brand pages. The victim often calls the fraudster first, which makes the call feel legitimate.',
    manipulationTechniques: [
      'A helpful support persona',
      'Authority of a known brand',
      'Technical jargon that makes the request sound necessary',
    ],
    related: ['screen-sharing', 'otp-theft', 'phishing-url'],
  },
  {
    id: 'screen-sharing',
    name: 'Screen-sharing and remote-access app scam',
    category: 'Social engineering',
    icon: 'MonitorSmartphone',
    description:
      'A caller persuades you to install a remote-control app, giving them a live view of your phone and the ability to act on it.',
    howItWorks: [
      'The fraudster poses as support, a bank official, or a delivery agent with a "problem".',
      'They ask you to install a remote-access or screen-sharing app from an app store or link.',
      'Once connected, they can see your notifications, including OTPs, and guide or perform actions.',
      'Payments are approved or credentials are captured while you watch.',
    ],
    warningSigns: [
      'Any unsolicited request to install a remote-support app.',
      'A caller who asks you to keep the app open during a "verification".',
      'Requests to turn off security warnings or allow unknown permissions.',
      'Someone reading your screen back to you.',
    ],
    exampleMessage:
      'Your account has a security issue. Install this support tool and give me the access code so I can check it for you.',
    howToAvoid: [
      'Never install remote-access software for an unknown caller.',
      'Remember that genuine support does not need to control your phone.',
      'Keep screen-sharing off during any banking or payment activity.',
    ],
    whatToDo: [
      'Disconnect the session and uninstall the app.',
      'Turn off the device\'s network connection if you suspect an active session.',
      'Contact your bank and report to 1930; change passwords from a safe device if needed.',
    ],
    attackerApproach:
      'Remote-access tools are legitimate software misused here. The fraudster relies on the victim granting permission, which bypasses many technical protections.',
    manipulationTechniques: [
      'Technical authority and urgency',
      'Step-by-step instructions that feel like a normal support process',
      'Trust built over a calm, patient call',
    ],
    related: ['fake-customer-care', 'otp-theft', 'upi-pin'],
  },
  {
    id: 'fake-screenshot',
    name: 'Fake payment screenshot scam',
    category: 'Payment fraud',
    icon: 'ImageOff',
    description:
      'A buyer or "sender" shows a screenshot or edited message claiming a payment is complete, then asks you to deliver goods, refund money, or release a payment.',
    howItWorks: [
      'Someone sends a screenshot that looks like a successful UPI transfer.',
      'They claim the amount is delayed, on hold, or needs your PIN to "complete".',
      'You hand over goods, send a refund, or approve a request before checking your account.',
    ],
    warningSigns: [
      'A payment screenshot used as proof instead of your own account statement.',
      'Claims that the money is "on hold" and will arrive after you act.',
      'A request to refund an amount you never received.',
      'Pressure to complete the deal quickly.',
    ],
    exampleMessage:
      'Payment done, screenshot attached. The amount will reflect in 24 hours. Please send the item now and share the delivery OTP.',
    howToAvoid: [
      'Check your own bank or UPI app transaction history, not a screenshot.',
      'Wait for the credit to appear in your account before handing over goods or refunds.',
      'Do not pay to "release" an incoming payment.',
    ],
    whatToDo: [
      'Do not deliver goods or send money based on a screenshot.',
      'Verify the transaction in your official app; if there is no credit, treat it as unpaid.',
      'Report the profile and the message to the platform and to 1930 if money was lost.',
    ],
    attackerApproach:
      'Screenshots are easy to edit or imitate. Fraudsters target sellers on marketplaces and social media, where deals often move quickly and trust is based on chat.',
    manipulationTechniques: [
      'Visual proof that looks official',
      'Sympathy for a supposed payment delay',
      'Urgency to close the sale',
    ],
    related: ['collect-request', 'qr-code', 'upi-pin'],
  },
  {
    id: 'collect-request',
    name: 'Collect request scam',
    category: 'Payment fraud',
    icon: 'Inbox',
    description:
      'A UPI collect request appears in your app for money you do not owe. Approving it with your PIN pays the fraudster.',
    howItWorks: [
      'The fraudster sends a collect request with a misleading note, such as "refund" or "cashback".',
      'The request looks like an incoming payment notification to an inexperienced user.',
      'Approving it authorizes a debit from your account.',
    ],
    warningSigns: [
      'An unexpected collect request from an unknown UPI ID.',
      'A note claiming the request will send you money.',
      'Requests that arrive while you are on a call with a stranger.',
      'Repeated requests after you decline the first one.',
    ],
    exampleMessage:
      'Rs 1,999 collect request from [fictional UPI ID] — note: "refund for order, approve to receive cashback".',
    howToAvoid: [
      'Decline any collect request you did not expect or initiate.',
      'Read the request carefully: approving a collect request pays the requester.',
      'Never approve a request to "receive" money.',
    ],
    whatToDo: [
      'Decline the request and block the sender in your UPI app.',
      'If you approved it, note the transaction ID and contact your bank.',
      'Report the UPI ID and incident to 1930.',
    ],
    attackerApproach:
      'The collect request feature is legitimate and useful for merchants. Fraudsters exploit the fact that a request notification can look like an incoming payment to someone unfamiliar with the flow.',
    manipulationTechniques: [
      'Confusing a payment request with a payment received',
      'A reassuring note such as "refund" or "cashback"',
      'Rapid follow-up requests that pressure a decision',
    ],
    related: ['upi-pin', 'fake-cashback', 'qr-code'],
  },
  {
    id: 'qr-code',
    name: 'QR-code payment scam',
    category: 'Payment fraud',
    icon: 'QrCode',
    description:
      'A QR code presented as a way to receive money actually initiates a payment from your account once you scan and approve it.',
    howItWorks: [
      'A fraudster sends a QR code and says scanning it will credit money to you.',
      'You scan the code inside your payment app.',
      'The app opens a payment screen, and entering your PIN debits your account.',
    ],
    warningSigns: [
      'A QR code sent by chat to receive a refund, prize, or payment.',
      'Instructions to scan and enter your PIN to "accept" money.',
      'QR codes stuck over legitimate ones at a shop or stall.',
      'A payment screen appears after scanning when you expected to receive money.',
    ],
    exampleMessage:
      'Scan this QR code and enter your UPI PIN to receive your Rs 500 refund. It will credit instantly.',
    howToAvoid: [
      'Remember that scanning a QR code and entering a PIN sends money, it does not receive it.',
      'Verify the payee name shown in the app before approving.',
      'Use QR codes only from sources you trust, and check for tampering at physical locations.',
    ],
    whatToDo: [
      'Cancel the payment screen without entering your PIN.',
      'Report the QR code or sender in the app.',
      'If you paid, contact your bank and report to 1930 with the transaction ID.',
    ],
    attackerApproach:
      'The scam relies on the ambiguity of QR codes. A code can represent a payment request, but the fraudster describes it as a collection method for money owed to you.',
    manipulationTechniques: [
      'Technical ambiguity around how QR payments work',
      'A small, believable refund amount',
      'Instructions that sound routine',
    ],
    related: ['collect-request', 'fake-screenshot', 'upi-pin'],
  },
  {
    id: 'lottery-prize',
    name: 'Lottery and prize scam',
    category: 'Online shopping and rewards',
    icon: 'Trophy',
    description:
      'You are told you won a lottery or prize you never entered, and must pay a fee or share details to claim it.',
    howItWorks: [
      'A message announces a large win from a lottery, game show, or brand draw.',
      'You are asked to pay processing fees, taxes, or delivery charges upfront.',
      'Personal and banking details are collected, and the prize never arrives.',
    ],
    warningSigns: [
      'Winning a draw you never entered.',
      'A request for an upfront fee to release a prize.',
      'Requests for bank details, Aadhaar, PAN, or OTPs.',
      'A short deadline and a "claim ID" that sounds official.',
    ],
    exampleMessage:
      'Your mobile number won Rs 25,00,000 in the national lucky draw. Pay Rs 4,500 processing fee to release the prize. Claim ID: [fictional ID].',
    howToAvoid: [
      'Treat any prize you did not enter for as fake.',
      'Never pay a fee to receive a prize.',
      'Verify the organizer independently through official channels.',
    ],
    whatToDo: [
      'Do not pay or share documents.',
      'Save the message as evidence and report it to 1930 or cybercrime.gov.in.',
      'Block the sender and warn others in your family.',
    ],
    attackerApproach:
      'The promised amount is deliberately large so the processing fee looks trivial by comparison. Fraudsters may also use a fake "government approval" letter to add credibility.',
    manipulationTechniques: [
      'Life-changing reward',
      'Sunk-cost pressure after the first small payment',
      'Official-sounding paperwork and IDs',
    ],
    related: ['fake-cashback', 'job-scam', 'govt-impersonation'],
  },
  {
    id: 'job-scam',
    name: 'Job and work-from-home payment scam',
    category: 'Social engineering',
    icon: 'Briefcase',
    description:
      'A fake recruiter offers easy part-time work, then asks for a registration fee, security deposit, or payment to unlock tasks.',
    howItWorks: [
      'You are contacted on WhatsApp or Telegram with a work-from-home offer.',
      'Small tasks or fake earnings build trust, and a small payout may even be made.',
      'You are asked to deposit money for "premium tasks" or a "withdrawal fee".',
      'After a larger deposit, the recruiter stops responding.',
    ],
    warningSigns: [
      'A job offer without an interview or written contract.',
      'Requests to pay a registration, training, or security deposit.',
      'Communication only through chat apps from personal numbers.',
      'Promises of high daily earnings for simple tasks.',
    ],
    exampleMessage:
      'Work from home and earn Rs 3,000 daily. Complete simple tasks on Telegram. Pay a one-time Rs 999 activation fee to start.',
    howToAvoid: [
      'Never pay to get a job. Legitimate employers do not charge candidates.',
      'Verify the company on its official website and check the recruiter\'s email domain.',
      'Be sceptical of earnings that are far above market rates for the work described.',
    ],
    whatToDo: [
      'Stop communicating and do not send more money.',
      'Report the profile and group to the platform.',
      'Report financial loss to 1930 and cybercrime.gov.in.',
    ],
    attackerApproach:
      'Fraudsters run structured groups with fake colleagues and screenshots of payouts. Early small withdrawals are a deliberate investment to earn trust before the large deposit.',
    manipulationTechniques: [
      'Hope of income and financial pressure',
      'Social proof from fake group members',
      'Small early wins that create trust',
    ],
    related: ['investment-scam', 'lottery-prize', 'fake-customer-care'],
  },
  {
    id: 'investment-scam',
    name: 'Investment and trading scam',
    category: 'Payment fraud',
    icon: 'TrendingUp',
    description:
      'A fake advisor or trading app shows impressive returns, then blocks withdrawals unless you pay more or recruit others.',
    howItWorks: [
      'You are added to an investment group or contacted by a "market expert".',
      'A fake app or dashboard shows your investment growing rapidly.',
      'Withdrawals are blocked and you are asked to pay taxes, fees, or add more funds.',
      'The group and advisor disappear with the deposits.',
    ],
    warningSigns: [
      'Guaranteed or unusually high returns.',
      'Pressure to invest quickly or to recruit friends and family.',
      'Deposits to personal UPI IDs or unknown accounts instead of a regulated platform.',
      'Withdrawal blocked until you pay an additional fee.',
    ],
    exampleMessage:
      'Your portfolio is up 300%. To withdraw profits, pay 10% tax to this UPI ID. Limited window before market close.',
    howToAvoid: [
      'Check that the platform and advisor are registered with the relevant regulator.',
      'Treat guaranteed returns as a warning sign, not a benefit.',
      'Do not transfer money to personal accounts for investments.',
    ],
    whatToDo: [
      'Stop all transfers and preserve screenshots, chat logs, and transaction IDs.',
      'Report to 1930 and cybercrime.gov.in without delay.',
      'Inform your bank so it can review the transactions.',
    ],
    attackerApproach:
      'The "profits" are numbers on a fake dashboard, not real money. The scam depends on the victim trusting the interface and wanting to withdraw before the opportunity closes.',
    manipulationTechniques: [
      'Greed and fear of missing out',
      'Fake expertise and group consensus',
      'Withdrawal friction that prompts one more payment',
    ],
    related: ['job-scam', 'fake-cashback', 'phishing-url'],
  },
  {
    id: 'fake-bank-block',
    name: 'Fake bank account-blocking message',
    category: 'Banking fraud',
    icon: 'Ban',
    description:
      'A message warns that your account, card, or UPI service will be blocked unless you verify details through a link or call.',
    howItWorks: [
      'You receive an SMS or email that looks like a bank alert about a blocked account.',
      'The message provides a link or phone number to "restore" access.',
      'The link captures credentials, or the caller extracts OTPs and PINs.',
      'The account is then accessed or a payment is authorized.',
    ],
    warningSigns: [
      'A threat of immediate blocking with a link to fix it.',
      'A phone number that is not printed on your card or official website.',
      'Requests for OTP, PIN, password, or card details to unblock.',
      'Spelling mistakes, unusual sender IDs, or a generic greeting.',
    ],
    exampleMessage:
      'ALERT: Your account is blocked due to incomplete verification. Restore access within 24 hours at [fictional link] or call [fictional number].',
    howToAvoid: [
      'Open your bank\'s official app to check the real status of your account.',
      'Call only the number on your card or the bank\'s official website.',
      'Never treat an SMS threat as proof that your account is blocked.',
    ],
    whatToDo: [
      'Do not click, call, or reply.',
      'Verify with your bank through official channels.',
      'Report the message to 1930 or cybercrime.gov.in if it impersonates a bank.',
    ],
    attackerApproach:
      'This scam copies the visual style of real bank alerts. The threat of losing access makes recipients act before checking, which is exactly the intended reaction.',
    manipulationTechniques: [
      'Fear of losing account access',
      'A tight deadline',
      'Impersonation of a trusted bank',
    ],
    related: ['fake-kyc', 'otp-theft', 'phishing-url'],
  },
  {
    id: 'govt-impersonation',
    name: 'Impersonation of government authorities',
    category: 'Social engineering',
    icon: 'Landmark',
    description:
      'A caller or message poses as police, a court, a tax department, or another authority and demands payment or personal information.',
    howItWorks: [
      'The fraudster claims there is a case, fine, or verification pending against you.',
      'They may send fake notices, IDs, or video-call backgrounds to appear official.',
      'You are pressured to pay a "fine" or share documents and OTPs to avoid action.',
    ],
    warningSigns: [
      'Threats of arrest or legal action over a phone call.',
      'Demands for immediate payment to a personal account or UPI ID.',
      'Requests to stay on the call, keep it secret, or not tell family.',
      'Documents sent only through chat apps from unofficial numbers.',
    ],
    exampleMessage:
      'This is the cyber police. A parcel in your name contains illegal items. Pay a verification fee immediately to avoid a case. Do not disconnect.',
    howToAvoid: [
      'Do not pay or share documents based on an unsolicited call.',
      'Verify any notice directly with the concerned office using an official number.',
      'Remember that genuine authorities do not demand instant payment by UPI or ask you to keep a call secret.',
    ],
    whatToDo: [
      'End the call and do not pay.',
      'Discuss it with a family member and verify independently.',
      'Report the impersonation to 1930 and cybercrime.gov.in.',
    ],
    attackerApproach:
      'These scams use fear and isolation. Fake uniforms, badges, notices, and video backgrounds are used to overwhelm the victim\'s judgement.',
    manipulationTechniques: [
      'Fear of legal consequences',
      'Isolation from family and friends',
      'Authority symbols and official-sounding language',
    ],
    related: ['lottery-prize', 'fake-bank-block', 'fake-customer-care'],
  },
  {
    id: 'phishing-url',
    name: 'Phishing website and malicious URL scam',
    category: 'Phishing',
    icon: 'Link2',
    description:
      'A link leads to a look-alike website or malicious download designed to steal your login, card, or UPI credentials.',
    howItWorks: [
      'You receive a link by SMS, email, WhatsApp, or social media.',
      'The page imitates a bank, payment app, or shopping site.',
      'You are asked to log in, enter card details, or download an app.',
      'Credentials are captured, or malware is installed on your device.',
    ],
    warningSigns: [
      'A domain that is misspelled or has extra words before the brand name.',
      'Links shortened so the destination is hidden.',
      'A login page reached from a message rather than the official app.',
      'Requests for card details, PINs, or OTPs on a web page.',
    ],
    exampleMessage:
      'Your electricity bill is overdue. Pay now at [fictional look-alike link] to avoid disconnection tonight.',
    howToAvoid: [
      'Type the official website address yourself or use the official app.',
      'Check the domain carefully before entering any information.',
      'Never enter UPI PIN or card details on a page reached from an unexpected link.',
    ],
    whatToDo: [
      'Close the page and do not download anything.',
      'If you entered credentials, change passwords and contact your bank.',
      'Report the URL to 1930 or cybercrime.gov.in.',
    ],
    attackerApproach:
      'Phishing pages are copied from real sites and hosted on similar-looking domains. Some links deliver malicious apps that can read notifications and steal OTPs.',
    manipulationTechniques: [
      'Visual imitation of a trusted brand',
      'Urgency such as a disconnection notice',
      'A request that feels like a routine login',
    ],
    related: ['fake-kyc', 'fake-bank-block', 'fake-customer-care'],
  },
]

export function getScamById(id) {
  return SCAMS.find((scam) => scam.id === id) ?? null
}
