import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { projectId, documentId, scenarioId } = await request.json()

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Get context from project
    const project = await db.project.findUnique({ where: { id: projectId } })
    const isBanking = project?.name.toLowerCase().includes('bank')
    const context = isBanking ? 'banking' : 'ecommerce'

    const testCases = context === 'banking' ? getBankingTestCases(projectId, documentId, scenarioId) : getEcommerceTestCases(projectId, documentId, scenarioId)

    // Save test cases to DB
    await db.testCase.createMany({
      data: testCases.map((tc, index) => ({
        projectId,
        documentId: documentId || '',
        scenarioId: scenarioId || '',
        tcId: `TC-AI-${String(index + 1).padStart(3, '0')}`,
        module: tc.module,
        title: tc.title,
        preconditions: tc.preconditions,
        testData: tc.testData,
        steps: tc.steps,
        expectedResult: tc.expectedResult,
        priority: tc.priority,
        severity: tc.severity,
        type: tc.type,
        automationCandidate: tc.automationCandidate,
        automationReason: tc.automationReason,
        status: 'DRAFT',
      })),
    })

    return NextResponse.json({ testCases, totalGenerated: testCases.length })
  } catch (error) {
    console.error('AI test cases error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getEcommerceTestCases(projectId: string, documentId: string, scenarioId: string) {
  return [
    {
      module: 'Authentication',
      title: 'Verify successful registration with valid email and strong password',
      preconditions: '1. Application is accessible\n2. Registration page is loaded\n3. Test email is not already registered',
      testData: 'Email: newuser@testmail.com\nPassword: Secure@Pass123\nConfirm Password: Secure@Pass123\nFirst Name: John\nLast Name: Doe',
      steps: '1. Navigate to the registration page\n2. Enter a valid and unique email address: newuser@testmail.com\n3. Enter password "Secure@Pass123" in the password field\n4. Enter the same password in the confirm password field\n5. Enter first name "John" and last name "Doe"\n6. Click the "Register" button\n7. Check inbox for verification email',
      expectedResult: '1. User account is created in the database\n2. Verification email is sent to newuser@testmail.com within 30 seconds\n3. User is redirected to a confirmation page saying "Please check your email to verify your account"\n4. Password is stored in hashed format, never in plain text\n5. User status is set to "PENDING_VERIFICATION"',
      priority: 'HIGH',
      severity: 'HIGH',
      type: 'POSITIVE',
      automationCandidate: 'AUTOMATABLE',
      automationReason: 'Clear input/output validation with deterministic results. No visual verification needed.',
    },
    {
      module: 'Authentication',
      title: 'Verify registration fails with duplicate email address',
      preconditions: '1. A user with email existing@testmail.com is already registered\n2. Registration page is loaded',
      testData: 'Email: existing@testmail.com (already registered)\nPassword: Secure@Pass123\nConfirm Password: Secure@Pass123',
      steps: '1. Navigate to the registration page\n2. Enter the already registered email: existing@testmail.com\n3. Enter a valid password meeting all complexity requirements\n4. Confirm the password\n5. Click the "Register" button',
      expectedResult: '1. Registration fails and user remains on the registration page\n2. Error message "This email is already registered" is displayed below the email field\n3. No new user record is created in the database\n4. Password field is cleared for security\n5. Email field retains the entered value for correction',
      priority: 'HIGH',
      severity: 'HIGH',
      type: 'NEGATIVE',
      automationCandidate: 'AUTOMATABLE',
      automationReason: 'Straightforward validation test with expected error message. Easily automated with API or UI automation.',
    },
    {
      module: 'Authentication',
      title: 'Verify account lockout after 5 consecutive failed login attempts',
      preconditions: '1. A valid user account exists with username "testuser"\n2. Account is in ACTIVE status\n3. Account is not currently locked',
      testData: 'Username: testuser\nInvalid Passwords: wrong1, wrong2, wrong3, wrong4, wrong5',
      steps: '1. Navigate to the login page\n2. Enter username "testuser" and incorrect password "wrong1"\n3. Click "Login" and verify error message. Note remaining attempts.\n4. Repeat steps 2-3 with passwords "wrong2", "wrong3", "wrong4" (4 total failed attempts)\n5. Verify the message shows "1 attempt remaining before account lockout"\n6. Enter username "testuser" and incorrect password "wrong5"\n7. Click "Login" (5th failed attempt)\n8. Try to login with correct password immediately after lockout',
      expectedResult: '1. After each failed attempt, error message shows remaining attempts (4, 3, 2, 1 remaining)\n2. After 5th failed attempt, account is locked\n3. Message displays "Your account has been locked. Please try again in 30 minutes or contact support."\n4. Login with correct password also fails with "Account is locked" message\n5. Lockout email notification is sent to the user\'s registered email\n6. Account auto-unlocks after 30 minutes',
      priority: 'HIGH',
      severity: 'CRITICAL',
      type: 'NEGATIVE',
      automationCandidate: 'AUTOMATABLE',
      automationReason: 'Sequential steps with clear assertions. Counter verification is deterministic.',
    },
    {
      module: 'Product Catalog',
      title: 'Verify product search returns relevant results sorted by relevance',
      preconditions: '1. At least 50 products exist in the catalog\n2. Multiple products contain "wireless headphones" in name or description\n3. Search index is up to date',
      testData: 'Search keyword: "wireless headphones"\nExpected: Products with "wireless" AND "headphones" ranked higher than partial matches',
      steps: '1. Navigate to the product catalog or homepage\n2. Locate the search bar (usually in the header)\n3. Type "wire" and verify auto-suggestions appear after 3 characters\n4. Complete typing "wireless headphones"\n5. Press Enter or click the search button\n6. Review the search results page\n7. Verify result count, product details, and sorting',
      expectedResult: '1. Auto-suggestions appear after typing "wir" (3rd character)\n2. Suggestions include products with "wireless" in name\n3. Search results page shows all matching products\n4. Products containing both "wireless" and "headphones" appear first (higher relevance)\n5. Each result shows: product image, name, price, rating stars, and availability status\n6. Results are paginated (20 per page by default)\n7. Search executed within 500ms response time\n8. "No results found" message if no matches (not applicable here)',
      priority: 'HIGH',
      severity: 'MEDIUM',
      type: 'POSITIVE',
      automationCandidate: 'AUTOMATABLE',
      automationReason: 'API-driven test. Search results can be verified programmatically by checking response data.',
    },
    {
      module: 'Shopping Cart',
      title: 'Verify adding multiple items and real-time total calculation in cart',
      preconditions: '1. User is logged in\n2. At least 3 products are available with known prices\n3. Products: "Laptop" ($999.99), "Mouse" ($29.99), "USB Cable" ($12.99)',
      testData: 'Product 1: Laptop - $999.99, Qty: 1\nProduct 2: Wireless Mouse - $29.99, Qty: 2\nProduct 3: USB-C Cable - $12.99, Qty: 3\nTax Rate: 8%\nExpected Subtotal: $999.99 + $59.98 + $38.97 = $1098.94',
      steps: '1. Navigate to product page for "Laptop"\n2. Click "Add to Cart" with quantity 1\n3. Navigate to "Wireless Mouse" page\n4. Set quantity to 2 and click "Add to Cart"\n5. Navigate to "USB-C Cable" page\n6. Set quantity to 3 and click "Add to Cart"\n7. Click the cart icon in the header\n8. Verify cart badge shows "3" (3 unique items)\n9. Verify each item, quantity, and line total\n10. Verify subtotal, estimated tax, and grand total',
      expectedResult: '1. Cart icon badge updates to "3" after all items added\n2. Cart page shows 3 line items with correct quantities\n3. Laptop: $999.99 x 1 = $999.99\n4. Wireless Mouse: $29.99 x 2 = $59.98\n5. USB-C Cable: $12.99 x 3 = $38.97\n6. Subtotal: $1,098.94\n7. Estimated Tax (8%): $87.92\n8. Cart updates in real-time without page refresh',
      priority: 'HIGH',
      severity: 'HIGH',
      type: 'POSITIVE',
      automationCandidate: 'AUTOMATABLE',
      automationReason: 'Calculation-based test with precise numeric assertions. Ideal for automated regression.',
    },
    {
      module: 'Checkout & Payment',
      title: 'Verify complete purchase flow with valid credit card',
      preconditions: '1. User is logged in\n2. Cart has at least 1 item\n3. Shipping address is configured\n4. Test credit card: 4111 1111 1111 1111 (Visa test card)',
      testData: 'Card Number: 4111 1111 1111 1111\nExpiry: 12/28\nCVV: 123\nName on Card: John Doe\nBilling Address: Same as shipping',
      steps: '1. Navigate to cart page\n2. Click "Proceed to Checkout"\n3. Verify shipping address is pre-filled (or enter new address)\n4. Select shipping method (Standard Free Shipping)\n5. Click "Continue to Payment"\n6. Enter credit card details: 4111 1111 1111 1111, 12/28, 123, John Doe\n7. Check "Billing same as shipping"\n8. Click "Place Order" / "Pay Now"\n9. Wait for payment processing',
      expectedResult: '1. Order summary shows correct items, quantities, and totals\n2. Payment is processed successfully\n3. Order confirmation page displays: Order ID, items, total, estimated delivery\n4. Confirmation email is sent within 60 seconds\n5. Order is created in database with status "CONFIRMED"\n6. Inventory is decremented for purchased items\n7. Cart is cleared after successful order\n8. User can view order in "Order History"',
      priority: 'HIGH',
      severity: 'CRITICAL',
      type: 'POSITIVE',
      automationCandidate: 'PARTIALLY_AUTOMATABLE',
      automationReason: 'Core flow is automatable via API, but payment gateway integration may require manual verification or sandbox testing.',
    },
    {
      module: 'Security',
      title: 'Verify SQL injection and XSS prevention on login form and search',
      preconditions: '1. Application is running\n2. Login page and search functionality are accessible',
      testData: 'SQL Injection payloads:\n- Username: admin\' OR \'1\'=\'1\' --\n- Username: \'; DROP TABLE users; --\n\nXSS payloads:\n- Search: <script>alert("xss")</script>\n- Search: <img src=x onerror=alert(1)>\n- Login: <svg onload=alert(document.cookie)>',
      steps: '1. Navigate to login page\n2. Enter SQL injection payload in username field: admin\' OR \'1\'=\'1\' --\n3. Enter any password and click Login\n4. Verify no SQL error is exposed and login fails gracefully\n5. Navigate to product search\n6. Enter XSS payload: <script>alert("xss")</script>\n7. Execute search\n8. Verify script does not execute in results\n9. Enter <img src=x onerror=alert(1)> in search\n10. Verify no alert is triggered',
      expectedResult: '1. SQL injection payload does not authenticate user\n2. No database error messages are displayed to user\n3. Generic "Invalid credentials" message shown\n4. XSS payloads are rendered as plain text (encoded)\n5. No JavaScript alert or popup is triggered\n6. Search results page loads without errors\n7. Application logs the suspicious attempt for security monitoring',
      priority: 'HIGH',
      severity: 'CRITICAL',
      type: 'NEGATIVE',
      automationCandidate: 'AUTOMATABLE',
      automationReason: 'Security tests are critical to automate. Input validation and output encoding can be verified programmatically.',
    },
    {
      module: 'Shopping Cart',
      title: 'Verify coupon code validation - expired, invalid, and valid codes',
      preconditions: '1. User is logged in with items in cart (subtotal > $50)\n2. Test coupons exist:\n   - SAVE10 (valid, 10% off, expires in future)\n   - EXPIRED20 (expired)\n   - NOTREAL (does not exist)\n   - MINORDER100 (valid but requires $100 minimum)',
      testData: 'Cart Subtotal: $89.99\nCoupon 1: EXPIRED20 (expired coupon)\nCoupon 2: NOTREAL (non-existent)\nCoupon 3: MINORDER100 (valid but below min order)\nCoupon 4: SAVE10 (valid, applicable)',
      steps: '1. Navigate to cart page with items totaling $89.99\n2. Locate the coupon code input field\n3. Enter "EXPIRED20" and click "Apply"\n4. Verify error message for expired coupon\n5. Enter "NOTREAL" and click "Apply"\n6. Verify error message for invalid coupon\n7. Enter "MINORDER100" and click "Apply"\n8. Verify error message about minimum order value\n9. Enter "SAVE10" and click "Apply"\n10. Verify discount is applied correctly',
      expectedResult: '1. EXPIRED20: "This coupon has expired" error displayed, no discount applied\n2. NOTREAL: "Invalid coupon code" error displayed\n3. MINORDER100: "Minimum order of $100 required for this coupon" error shown\n4. SAVE10: Discount of $9.00 (10% of $89.99) applied\n5. Updated total shows: Subtotal $89.99 - Discount $9.00 = $80.99\n6. Discount line is visible in order summary\n7. Only one coupon can be active at a time',
      priority: 'MEDIUM',
      severity: 'MEDIUM',
      type: 'NEGATIVE',
      automationCandidate: 'AUTOMATABLE',
      automationReason: 'Coupon validation has clear rules and expected outcomes. Easily automated with data-driven approach.',
    },
  ]
}

function getBankingTestCases(projectId: string, documentId: string, scenarioId: string) {
  return [
    {
      module: 'Login & Security',
      title: 'Verify successful login with valid credentials and biometric fallback',
      preconditions: '1. User has registered account with username and password\n2. Biometric (fingerprint/face) is enrolled on device\n3. Device is registered',
      testData: 'Username: testbankuser\nPassword: Bank@Secure123\nBiometric: Device fingerprint/face ID',
      steps: '1. Open the banking app\n2. If biometric is available, verify biometric prompt appears\n3. Use registered fingerprint/face to authenticate\n4. Alternatively, tap "Use password" and enter credentials\n5. Verify successful authentication',
      expectedResult: '1. Biometric prompt appears within 2 seconds of app launch\n2. Successful biometric scan redirects to dashboard\n3. Password login shows account dashboard with: balance, recent transactions, quick actions\n4. Session token is established\n5. Last login time is updated',
      priority: 'HIGH',
      severity: 'CRITICAL',
      type: 'POSITIVE',
      automationCandidate: 'PARTIALLY_AUTOMATABLE',
      automationReason: 'Password login is automatable, but biometric authentication requires manual/device testing.',
    },
    {
      module: 'Login & Security',
      title: 'Verify account lockout after 3 failed login attempts with 2FA enabled',
      preconditions: '1. User account exists and is active\n2. 2FA is enabled via SMS\n3. Account has 0 failed attempts currently',
      testData: 'Username: testbankuser\nInvalid passwords: wrong1, wrong2, wrong3',
      steps: '1. Open banking app and navigate to login\n2. Enter valid username and wrong password "wrong1"\n3. Submit and note the error message\n4. Repeat with "wrong2" and "wrong3"\n5. On 3rd failure, verify account lockout behavior\n6. Attempt login with correct password',
      expectedResult: '1. After 1st failed attempt: "Invalid credentials. 2 attempts remaining."\n2. After 2nd: "Invalid credentials. 1 attempt remaining."\n3. After 3rd: Account is locked immediately\n4. Message: "Account locked for security. Contact customer support or wait 15 minutes."\n5. Correct password also fails: "Account is temporarily locked"\n6. SMS notification sent about suspicious login attempts',
      priority: 'HIGH',
      severity: 'CRITICAL',
      type: 'NEGATIVE',
      automationCandidate: 'AUTOMATABLE',
      automationReason: 'Sequential attempts with deterministic counter behavior. Clear assertions for each step.',
    },
    {
      module: 'Fund Transfer',
      title: 'Verify fund transfer to own account with correct balance update',
      preconditions: '1. User has at least 2 linked accounts (Savings and Checking)\n2. Savings account balance >= $500\n3. Transfer limits are not exceeded',
      testData: 'From Account: Savings (Balance: $1,500.00)\nTo Account: Checking (Balance: $300.00)\nTransfer Amount: $500.00\nTransfer Type: IMPS (instant)',
      steps: '1. Login to banking app\n2. Navigate to "Transfer" section\n3. Select "Transfer to own account"\n4. Select From Account: Savings\n5. Select To Account: Checking\n6. Enter amount: $500.00\n7. Verify transfer details on confirmation screen\n8. Enter MPIN or biometric to authorize\n9. Wait for transfer confirmation',
      expectedResult: '1. Transfer confirmation shows: From, To, Amount, Type (IMPS)\n2. After confirmation: Savings balance = $1,000.00, Checking balance = $800.00\n3. Transaction appears in both accounts\' transaction history\n4. Transfer status shows "COMPLETED" or "SUCCESS"\n5. Push notification sent for debit and credit\n6. Transaction reference number generated',
      priority: 'HIGH',
      severity: 'CRITICAL',
      type: 'POSITIVE',
      automationCandidate: 'PARTIALLY_AUTOMATABLE',
      automationReason: 'API automation possible for core flow. MPIN/biometric authorization may need manual step.',
    },
    {
      module: 'Fund Transfer',
      title: 'Verify fund transfer exceeds daily limit is blocked',
      preconditions: '1. User daily transfer limit is set to $10,000\n2. User has already transferred $8,000 today\n3. Remaining daily limit: $2,000',
      testData: 'Transfer Amount: $3,000 (exceeds remaining $2,000 limit)\nDaily Limit: $10,000\nAlready Transferred: $8,000',
      steps: '1. Navigate to fund transfer\n2. Select beneficiary account\n3. Enter transfer amount: $3,000\n4. Click "Proceed" or "Transfer"\n5. Observe the system response',
      expectedResult: '1. System blocks the transfer attempt\n2. Error message: "Transfer amount exceeds your daily limit. Remaining limit: $2,000.00"\n3. No transaction is created in the database\n4. User is given option to modify the amount\n5. Suggested maximum amount shown: $2,000.00',
      priority: 'HIGH',
      severity: 'HIGH',
      type: 'NEGATIVE',
      automationCandidate: 'AUTOMATABLE',
      automationReason: 'Clear boundary test with deterministic validation. API can verify limit enforcement.',
    },
    {
      module: 'Bill Payments',
      title: 'Verify bill payment for electricity with correct amount and confirmation',
      preconditions: '1. User has added electricity biller (e.g., ConEdison)\n2. Bill amount is due: $125.50\n3. Sufficient account balance',
      testData: 'Biller: ConEdison Electricity\nAccount Number: CE-123456789\nAmount: $125.50\nPayment From: Checking Account',
      steps: '1. Navigate to "Bill Payments" section\n2. Select "Electricity" category\n3. Select biller: ConEdison\n4. Enter account number: CE-123456789\n5. System fetches pending bill amount: $125.50\n6. Verify amount or enter manual amount\n7. Select payment account: Checking\n8. Confirm payment details\n9. Authorize with MPIN',
      expectedResult: '1. Bill details displayed: Biller, Account, Amount, Due Date\n2. Payment processed successfully\n3. Confirmation screen shows: Transaction ID, Amount paid, Biller name\n4. Push notification: "Electricity bill of $125.50 paid to ConEdison"\n5. Payment appears in transaction history\n6. Checking account balance debited by $125.50',
      priority: 'HIGH',
      severity: 'HIGH',
      type: 'POSITIVE',
      automationCandidate: 'AUTOMATABLE',
      automationReason: 'Bill payment flow is API-driven with clear success/failure indicators.',
    },
  ]
}