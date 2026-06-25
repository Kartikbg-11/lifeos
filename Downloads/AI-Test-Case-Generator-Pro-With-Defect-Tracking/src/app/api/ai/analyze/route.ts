import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { projectId, documentId } = await request.json()

    if (!projectId || !documentId) {
      return NextResponse.json({ error: 'Project ID and Document ID are required' }, { status: 400 })
    }

    // Get document info for context
    const document = await db.document.findUnique({ where: { id: documentId } })
    const projectName = document?.name || 'E-Commerce Platform'

    // Return mock analysis with realistic extracted requirements, business rules, and risks
    const analysis = {
      projectId,
      documentId,
      analysisDate: new Date().toISOString(),
      summary: `Document analysis completed for "${projectName}". Identified 12 functional requirements, 4 business rules, 3 non-functional requirements, and 5 risk areas.`,
      requirements: [
        {
          id: 'REQ-A001',
          title: 'User Registration with Email and Password',
          type: 'FUNCTIONAL',
          priority: 'HIGH',
          description: 'Users shall be able to register using a valid email address and a password meeting complexity requirements. Email verification link should be sent upon successful registration.',
          acceptanceCriteria: '1. Registration form accepts email and password\n2. Email verification sent within 30 seconds\n3. Account activated only after email verification\n4. Duplicate emails rejected with clear message',
        },
        {
          id: 'REQ-A002',
          title: 'Password Complexity Validation',
          type: 'BUSINESS_RULE',
          priority: 'HIGH',
          description: 'Password must be minimum 8 characters containing at least one uppercase letter, one lowercase letter, one digit, and one special character. Common passwords should be rejected.',
          acceptanceCriteria: '1. Min 8 chars, max 128 chars\n2. At least 1 uppercase, 1 lowercase, 1 digit, 1 special char\n3. Real-time strength indicator\n4. Reject passwords from common password list',
        },
        {
          id: 'REQ-A003',
          title: 'Account Lockout After Failed Login Attempts',
          type: 'SECURITY',
          priority: 'HIGH',
          description: 'Account should be locked after 5 consecutive failed login attempts. User must wait 30 minutes or contact support to unlock. Failed attempts counter resets after successful login.',
          acceptanceCriteria: '1. Lock after 5 failed attempts\n2. Show remaining attempts\n3. Auto-unlock after 30 minutes\n4. Email notification sent on lockout',
        },
        {
          id: 'REQ-A004',
          title: 'Product Search with Auto-Suggestions',
          type: 'FUNCTIONAL',
          priority: 'HIGH',
          description: 'Users can search products by keyword. System provides auto-suggestions after 3 characters. Search covers product name, description, brand, and category.',
          acceptanceCriteria: '1. Auto-suggest after 3 chars\n2. Max 10 suggestions displayed\n3. Search covers name, desc, brand, category\n4. Results within 500ms response time',
        },
        {
          id: 'REQ-A005',
          title: 'Product Filtering and Sorting',
          type: 'FUNCTIONAL',
          priority: 'MEDIUM',
          description: 'Users can filter products by category, price range, brand, rating (stars), and availability. Sorting options include price (asc/desc), popularity, newest, and rating.',
          acceptanceCriteria: '1. Multi-select filters\n2. Clear all filters option\n3. Filter count badge\n4. URL reflects active filters\n5. Filters persist across pagination',
        },
        {
          id: 'REQ-A006',
          title: 'Shopping Cart - Add, Remove, Update Quantity',
          type: 'FUNCTIONAL',
          priority: 'HIGH',
          description: 'Users can add products to cart, remove items, and update quantity. Maximum 10 units per item. Cart should show real-time subtotal, tax estimate, and shipping estimate.',
          acceptanceCriteria: '1. Add to cart with quantity selector\n2. Max 10 per item enforced\n3. Real-time total calculation\n4. Cart badge updates on header\n5. Out-of-stock items flagged',
        },
        {
          id: 'REQ-A007',
          title: 'Coupon Code Application and Validation',
          type: 'BUSINESS_RULE',
          priority: 'MEDIUM',
          description: 'Coupon codes must be validated for: expiry date, minimum order value, applicable product categories, single-use vs multi-use, and maximum discount cap.',
          acceptanceCriteria: '1. Validate expiry date\n2. Check minimum order value\n3. Show discount preview before apply\n4. Error message for invalid codes\n5. Stack limit (max 1 coupon per order)',
        },
        {
          id: 'REQ-A008',
          title: 'Payment Processing - Multiple Methods',
          type: 'FUNCTIONAL',
          priority: 'HIGH',
          description: 'System shall support credit card (Visa, MasterCard, Amex), debit card, and PayPal payments. All card numbers must be PCI-DSS compliant (tokenized, never stored in plain text).',
          acceptanceCriteria: '1. Accept Visa, MC, Amex\n2. Real-time card validation\n3. 3D Secure for international cards\n4. PayPal redirect flow\n5. Error handling for declined cards',
        },
        {
          id: 'REQ-A009',
          title: 'Order Confirmation and Email Notification',
          type: 'FUNCTIONAL',
          priority: 'HIGH',
          description: 'After successful payment, system must generate order confirmation with order ID, items summary, total, and estimated delivery. Confirmation email sent within 60 seconds.',
          acceptanceCriteria: '1. Order confirmation page with all details\n2. Email within 60 seconds\n3. PDF invoice downloadable\n4. Order tracking link in email\n5. SMS notification option',
        },
        {
          id: 'REQ-A010',
          title: 'Session Management and Timeout',
          type: 'NON_FUNCTIONAL',
          priority: 'MEDIUM',
          description: 'User session should timeout after 30 minutes of inactivity. Warning modal shown at 25 minutes with option to extend. Active sessions limited to 3 per user.',
          acceptanceCriteria: '1. Timeout after 30 min inactivity\n2. Warning at 25 min\n3. Session extend on user interaction\n4. Max 3 concurrent sessions\n5. Graceful redirect on timeout',
        },
        {
          id: 'REQ-A011',
          title: 'User Profile - Address Management',
          type: 'FUNCTIONAL',
          priority: 'MEDIUM',
          description: 'Users can add multiple shipping addresses, set a default address, and edit/delete addresses. Addresses validated against USPS/zip code database.',
          acceptanceCriteria: '1. Add/edit/delete addresses\n2. Set default address\n3. Address validation\n4. Max 10 addresses per user\n5. Address used in checkout auto-selected',
        },
        {
          id: 'REQ-A012',
          title: 'Product Review System',
          type: 'FUNCTIONAL',
          priority: 'LOW',
          description: 'Users can write reviews for purchased products only. Reviews include 1-5 star rating, title, and text. Reviews moderated before publishing.',
          acceptanceCriteria: '1. Only verified purchasers can review\n2. 1-5 star rating required\n3. Text review optional (min 10 chars if provided)\n4. Moderation queue for new reviews\n5. User can edit review within 24 hours',
        },
      ],
      businessRules: [
        {
          id: 'BR-001',
          title: 'Password Policy',
          description: 'Minimum 8 characters, must include uppercase, lowercase, digit, and special character. No common passwords allowed. Password history of last 5 passwords enforced.',
          impact: 'Affects registration, password change, and password reset flows.',
        },
        {
          id: 'BR-002',
          title: 'Cart Quantity Limits',
          description: 'Maximum 10 units of any single product per cart. Maximum 50 total items per cart. Bulk purchase requests routed to customer service.',
          impact: 'Affects add-to-cart, quantity update, and checkout validation.',
        },
        {
          id: 'BR-003',
          title: 'Coupon Stacking Rules',
          description: 'Only one coupon code can be applied per order. Free shipping coupons cannot be combined with percentage discount coupons. Loyalty points discount is separate from coupons.',
          impact: 'Affects cart totals, checkout, and order creation.',
        },
        {
          id: 'BR-004',
          title: 'Return and Refund Policy',
          description: 'Returns accepted within 30 days of delivery. Items must be unused and in original packaging. Refund processed within 5-7 business days to original payment method.',
          impact: 'Affects order history, return request flow, and refund processing.',
        },
      ],
      risks: [
        {
          id: 'RISK-001',
          area: 'Authentication & Authorization',
          description: 'Password stored/transmitted without proper encryption. Brute force attack vulnerability on login endpoint. Session hijacking risk without proper token rotation.',
          severity: 'HIGH',
          mitigation: 'Implement bcrypt hashing, rate limiting, CAPTCHA after 3 attempts, HTTPS-only cookies, and CSRF tokens.',
        },
        {
          id: 'RISK-002',
          area: 'Payment Processing',
          description: 'Credit card data exposure risk. Payment gateway timeout handling. Double-charge risk on network retries. PCI-DSS compliance gaps.',
          severity: 'HIGH',
          mitigation: 'Use tokenization, implement idempotency keys, proper timeout handling, and PCI-DSS audit.',
        },
        {
          id: 'RISK-003',
          area: 'Data Validation',
          description: 'SQL injection in search and filter inputs. XSS in product descriptions and user reviews. Mass assignment vulnerabilities in profile updates.',
          severity: 'MEDIUM',
          mitigation: 'Parameterized queries, input sanitization, output encoding, and allowlist-based field updates.',
        },
        {
          id: 'RISK-004',
          area: 'Concurrent Operations',
          description: 'Race condition in cart updates when multiple tabs open. Inventory overselling when stock runs low during high traffic. Coupon reuse via concurrent requests.',
          severity: 'MEDIUM',
          mitigation: 'Optimistic locking, database-level constraints, distributed locks for inventory, and idempotent coupon redemption.',
        },
        {
          id: 'RISK-005',
          area: 'Performance & Scalability',
          description: 'Product search performance degrades with large catalog. Image loading slows page render. Database queries not optimized for pagination with filters.',
          severity: 'LOW',
          mitigation: 'Implement Elasticsearch for search, lazy loading for images, and optimize database queries with proper indexing.',
        },
      ],
    }

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('AI analyze error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}