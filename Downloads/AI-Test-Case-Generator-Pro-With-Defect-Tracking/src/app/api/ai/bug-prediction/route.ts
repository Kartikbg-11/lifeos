import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { projectId, documentId } = await request.json()

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const project = await db.project.findUnique({ where: { id: projectId } })
    const isBanking = project?.name.toLowerCase().includes('bank')

    const predictions = isBanking ? getBankingPredictions(projectId, documentId) : getEcommercePredictions(projectId, documentId)

    // Save to DB
    await db.bugPrediction.createMany({
      data: predictions.map((p) => ({
        projectId,
        documentId: documentId || '',
        riskArea: p.riskArea,
        possibleDefects: JSON.stringify(p.possibleDefects),
        likelihood: p.likelihood,
        impact: p.impact,
        suggestedTests: JSON.stringify(p.suggestedTests),
        status: 'OPEN',
      })),
    })

    return NextResponse.json({ predictions, totalGenerated: predictions.length })
  } catch (error) {
    console.error('AI bug prediction error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getEcommercePredictions(projectId: string, documentId: string) {
  return [
    {
      riskArea: 'Authentication - Password Reset Flow',
      possibleDefects: [
        'Password reset token not expired after use, allowing replay attacks',
        'Reset link works for different email than requested',
        'No rate limiting on password reset email requests (DoS vector)',
        'New password not validated for complexity during reset',
      ],
      likelihood: 'HIGH',
      impact: 'HIGH',
      suggestedTests: [
        'Reuse password reset token after successful reset',
        'Request reset with email A, use link with email B',
        'Send 100 reset requests in 1 minute',
        'Reset password to "12345678" (no special char)',
      ],
    },
    {
      riskArea: 'Shopping Cart - Concurrent Modifications',
      possibleDefects: [
        'Race condition when updating cart from multiple browser tabs',
        'Cart total calculation mismatch after rapid add/remove operations',
        'Out-of-stock item can still be added to cart if not validated in real-time',
        'Coupon discount applied incorrectly when cart is modified after coupon application',
      ],
      likelihood: 'MEDIUM',
      impact: 'HIGH',
      suggestedTests: [
        'Open cart in 2 tabs, add item in both simultaneously',
        'Rapidly add/remove same item 10 times, verify cart state',
        'Add last available item from 2 browsers simultaneously',
        'Apply coupon, then modify cart, verify discount recalculation',
      ],
    },
    {
      riskArea: 'Payment Processing - Edge Cases',
      possibleDefects: [
        'Double charge on network retry or browser refresh during payment',
        'Order created but payment not captured (inconsistent state)',
        'Zero-amount payment accepted when coupon covers full amount',
        'International card payments fail without proper 3D Secure handling',
        'Refund amount calculation error when partial order is cancelled',
      ],
      likelihood: 'MEDIUM',
      impact: 'CRITICAL',
      suggestedTests: [
        'Refresh browser during payment processing',
        'Simulate network timeout during payment API call',
        'Apply 100% discount coupon and process payment',
        'Pay with international card requiring 3D Secure',
        'Cancel partial order and verify refund amount',
      ],
    },
    {
      riskArea: 'Product Search - Data Quality Issues',
      possibleDefects: [
        'Search returns deleted/unpublished products',
        'Special characters in product names break search functionality',
        'Search results show incorrect price after price update (cache issue)',
        'Pagination returns duplicate products across pages',
        'Filters return products not matching selected criteria',
      ],
      likelihood: 'MEDIUM',
      impact: 'MEDIUM',
      suggestedTests: [
        'Search for product that was just deleted',
        `Search with special characters: <, >, &, ", '`,
        'Update product price and immediately search for it',
        'Navigate pages 1, 2, 3 and check for duplicates',
        'Apply filter and verify all results match criteria',
      ],
    },
    {
      riskArea: 'Session Management - Security Vulnerabilities',
      possibleDefects: [
        'Session not properly invalidated on logout (token still valid)',
        'Session cookie not set with HttpOnly and Secure flags',
        'Concurrent sessions not limited (unlimited devices can login)',
        'Session timeout countdown not reset on API activity (only page navigation)',
        'CSRF token not validated on critical POST requests',
      ],
      likelihood: 'HIGH',
      impact: 'HIGH',
      suggestedTests: [
        'Logout then reuse session token in API call',
        'Inspect session cookie for HttpOnly and Secure flags',
        'Login from 5 different devices simultaneously',
        'Keep API polling active but no page navigation for 30 min',
        'Submit form without CSRF token or with expired token',
      ],
    },
    {
      riskArea: 'Checkout - Address and Shipping Validation',
      possibleDefects: [
        'Invalid zip code accepted for shipping address',
        'Shipping cost not recalculated when address is changed',
        'PO Box address accepted for courier delivery that doesn\'t support it',
        'International address format not handled correctly',
        'Default address not properly selected when user has multiple addresses',
      ],
      likelihood: 'MEDIUM',
      impact: 'MEDIUM',
      suggestedTests: [
        'Enter invalid zip code: 00000, 99999',
        'Change address during checkout, verify shipping cost update',
        'Enter PO Box address for FedEx/UPS delivery',
        'Enter address with international format (no state/zip)',
        'Checkout with multiple saved addresses, verify default selection',
      ],
    },
    {
      riskArea: 'Coupon System - Business Logic Flaws',
      possibleDefects: [
        'Stacked discounts when multiple coupons applied via API (bypassing UI limit)',
        'Coupon applied to items not in eligible category',
        'Free shipping coupon applied when shipping is already free',
        'Coupon min order check bypassed by adding then removing items',
        'Percentage discount results in negative total for high-value coupons',
      ],
      likelihood: 'LOW',
      impact: 'HIGH',
      suggestedTests: [
        'Send API request with 2 coupon codes simultaneously',
        'Apply category-specific coupon to out-of-category item',
        'Apply free shipping when order qualifies for free shipping',
        'Add items to meet min, apply coupon, remove items, checkout',
        'Apply 200% discount coupon and verify total >= 0',
      ],
    },
    {
      riskArea: 'Email Notifications - Reliability Issues',
      possibleDefects: [
        'Order confirmation email sent before payment is fully captured',
        'Verification email not sent for certain email domains',
        'Email contains incorrect order details if order is modified after email trigger',
        'HTML email not rendered correctly in all email clients',
        'Unsubscribe link in marketing emails is non-functional',
      ],
      likelihood: 'LOW',
      impact: 'MEDIUM',
      suggestedTests: [
        'Trigger order and verify email timing vs payment status',
        'Register with emails from different domains (Gmail, Yahoo, custom)',
        'Modify order immediately after placement, check email content',
        'View email in Outlook, Gmail, Apple Mail for rendering',
        'Click unsubscribe link and verify preference is saved',
      ],
    },
  ]
}

function getBankingPredictions(projectId: string, documentId: string) {
  return [
    {
      riskArea: 'Fund Transfer - Amount Validation',
      possibleDefects: [
        'Transfer amount with more than 2 decimal places not handled correctly',
        'Negative amount transfer possible via API manipulation',
        'Zero amount transfer creates invalid transaction record',
        'Amount exceeds available balance but transfer proceeds (balance check race condition)',
      ],
      likelihood: 'HIGH',
      impact: 'CRITICAL',
      suggestedTests: [
        'Transfer $100.999 (3 decimal places)',
        'API call with amount: -500',
        'Transfer $0.00',
        'Transfer full balance from 2 devices simultaneously',
      ],
    },
    {
      riskArea: 'Authentication - 2FA Bypass',
      possibleDefects: [
        '2FA step can be skipped by directly calling the post-2FA API endpoint',
        'OTP not expired after timeout, allowing late use',
        'Same OTP works for multiple verification attempts',
        'SMS OTP intercepted or not delivered (no fallback)',
      ],
      likelihood: 'MEDIUM',
      impact: 'CRITICAL',
      suggestedTests: [
        'Call dashboard API directly without completing 2FA',
        'Use OTP after 10 minutes of receiving it',
        'Submit same OTP 3 times',
        'Test with unreachable phone number, verify fallback',
      ],
    },
    {
      riskArea: 'Bill Payment - Duplicate Processing',
      possibleDefects: [
        'Double payment on network retry or app back-press during processing',
        'Bill paid but status not updated (shows as unpaid)',
        'Scheduled payment executed multiple times',
        'Payment confirmation received but amount deducted incorrectly',
      ],
      likelihood: 'MEDIUM',
      impact: 'HIGH',
      suggestedTests: [
        'Press back button during payment processing',
        'Simulate network timeout and retry payment',
        'Set up 2 scheduled payments for same bill and time',
        'Compare debited amount with bill amount after payment',
      ],
    },
    {
      riskArea: 'Session - Auto-Logout Timing',
      possibleDefects: [
        'Session not terminated after 5-minute inactivity timeout',
        'Background API calls (transaction polling) reset the timeout counter',
        'Active session on another device not invalidated',
        'Logout doesn\'t clear sensitive data from device memory/cache',
      ],
      likelihood: 'MEDIUM',
      impact: 'HIGH',
      suggestedTests: [
        'Leave app idle for 5+ minutes, try to perform action',
        'Keep app open with background sync, wait 5 minutes',
        'Login on Device A, then Device B, check Device A session',
        'After logout, inspect app cache for sensitive data',
      ],
    },
    {
      riskArea: 'Transaction History - Data Integrity',
      possibleDefects: [
        'Transactions not showing in correct chronological order',
        'Pending transactions disappear after app refresh',
        'Transaction amount displayed differently in list vs detail view',
        'Pagination skips or duplicates transactions',
        'Filter by date range includes transactions outside the range',
      ],
      likelihood: 'LOW',
      impact: 'MEDIUM',
      suggestedTests: [
        'Make 10 transactions and verify sort order',
        'Check pending transaction, refresh, verify it still shows',
        'Compare amount in list view vs detail view',
        'Scroll through paginated transaction list',
        'Filter by date range, check boundary dates',
      ],
    },
  ]
}