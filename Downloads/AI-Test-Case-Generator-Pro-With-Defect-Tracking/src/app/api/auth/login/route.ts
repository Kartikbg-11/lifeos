import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    }

    // Seed admin user if not exists
    const existingAdmin = await db.user.findUnique({ where: { username: 'admin' } })
    if (!existingAdmin) {
      await db.user.create({
        data: {
          username: 'admin',
          email: 'admin@testcasegen.com',
          password: 'Admin@12345',
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN',
        },
      })

      // Also seed sample data
      await seedSampleData()
    }

    const user = await db.user.findUnique({ where: { username } })

    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 })
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entityType: 'User',
        entityId: user.id,
        details: `User ${user.username} logged in`,
      },
    })

    return NextResponse.json({
      token: 'mock-jwt-' + user.id,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function seedSampleData() {
  // Get admin user
  const admin = await db.user.findUnique({ where: { username: 'admin' } })
  if (!admin) return

  // Create sample users
  const user1 = await db.user.create({
    data: {
      username: 'qa_lead',
      email: 'qa.lead@testcasegen.com',
      password: 'Password@123',
      firstName: 'Sarah',
      lastName: 'Chen',
      role: 'QA_LEAD',
    },
  })

  const user2 = await db.user.create({
    data: {
      username: 'qa_engineer',
      email: 'qa.engineer@testcasegen.com',
      password: 'Password@123',
      firstName: 'Mike',
      lastName: 'Johnson',
      role: 'QA_ENGINEER',
    },
  })

  // Create sample projects
  const project1 = await db.project.create({
    data: {
      name: 'E-Commerce Platform',
      description: 'End-to-end testing for the new e-commerce platform including user authentication, product catalog, shopping cart, checkout, and payment processing modules.',
      status: 'ACTIVE',
      createdById: admin.id,
    },
  })

  const project2 = await db.project.create({
    data: {
      name: 'Mobile Banking App',
      description: 'QA testing for mobile banking application covering login, account management, fund transfers, bill payments, and transaction history.',
      status: 'ACTIVE',
      createdById: user1.id,
    },
  })

  // Add project members
  await db.projectMember.createMany({
    data: [
      { projectId: project1.id, userId: admin.id, roleInProject: 'ADMIN' },
      { projectId: project1.id, userId: user1.id, roleInProject: 'QA_LEAD' },
      { projectId: project1.id, userId: user2.id, roleInProject: 'QA_ENGINEER' },
      { projectId: project2.id, userId: user1.id, roleInProject: 'QA_LEAD' },
      { projectId: project2.id, userId: user2.id, roleInProject: 'QA_ENGINEER' },
    ],
  })

  // Create sample documents
  const doc1 = await db.document.create({
    data: {
      projectId: project1.id,
      name: 'E-Commerce Requirements_v2.1.pdf',
      fileType: 'PDF',
      filePath: '/uploads/ecommerce-reqs.pdf',
      fileSize: 2048000,
      uploadedById: admin.id,
      status: 'COMPLETED',
      version: 2,
      contentExtracted: 'E-Commerce Platform Requirements Document v2.1\n\n1. User Authentication\n1.1 Users shall be able to register with email and password\n1.2 Password must be minimum 8 characters with uppercase, lowercase, number, and special character\n1.3 Users can reset password via email verification\n1.4 Session timeout after 30 minutes of inactivity\n1.5 Maximum 5 failed login attempts before account lockout\n\n2. Product Catalog\n2.1 Products shall display name, price, image, description, and availability\n2.2 Search by keyword with auto-suggestions\n2.3 Filter by category, price range, brand, rating\n2.4 Sort by price, popularity, newest, rating\n2.5 Pagination: 20 products per page\n\n3. Shopping Cart\n3.1 Add/remove products from cart\n3.2 Update quantity (max 10 per item)\n3.3 Cart persists across sessions for logged-in users\n3.4 Show real-time subtotal and estimated tax\n3.5 Apply coupon codes with validation\n\n4. Checkout & Payment\n4.1 Support credit card, debit card, and PayPal\n4.2 Validate shipping address with zip code lookup\n4.3 Order summary before payment confirmation\n4.4 Email confirmation after successful order\n4.5 Handle payment failures gracefully with retry option\n\n5. User Profile\n5.1 View and edit profile information\n5.2 Manage shipping addresses (add, edit, delete, set default)\n5.3 View order history with status tracking\n5.4 Write product reviews after delivery',
    },
  })

  const doc2 = await db.document.create({
    data: {
      projectId: project2.id,
      name: 'Banking App SRS_v1.0.pdf',
      fileType: 'PDF',
      filePath: '/uploads/banking-srs.pdf',
      fileSize: 1536000,
      uploadedById: user1.id,
      status: 'COMPLETED',
      version: 1,
      contentExtracted: 'Mobile Banking App Software Requirements Specification v1.0\n\n1. Login & Security\n1.1 Login with username/password or biometric (fingerprint/face)\n1.2 Two-factor authentication via SMS or authenticator app\n1.3 Account lockout after 3 failed attempts\n1.4 Secure session with auto-logout after 5 minutes\n1.5 Device registration and management\n\n2. Account Dashboard\n2.1 Display account balance for all linked accounts\n2.2 Show recent transactions (last 10)\n2.3 Quick transfer button\n2.4 Notifications for low balance and suspicious activity\n\n3. Fund Transfer\n3.1 Transfer to own accounts\n3.2 Transfer to other bank accounts (NEFT/IMPS)\n3.3 Transfer using UPI ID or phone number\n3.4 Set transfer limits (daily, monthly)\n3.5 Beneficiary management\n\n4. Bill Payments\n4.1 Pay electricity, water, gas, internet bills\n4.2 Scheduled/recurring payments\n4.3 Payment history and receipts\n4.4 Bill reminders and notifications',
    },
  })

  // Create sample requirements for project 1
  await db.requirement.createMany({
    data: [
      { documentId: doc1.id, projectId: project1.id, reqId: 'EC-001', title: 'User Registration with Email', type: 'FUNCTIONAL', description: 'Users shall be able to register using a valid email address and a password meeting complexity requirements.', priority: 'HIGH', source: 'DOCUMENT' },
      { documentId: doc1.id, projectId: project1.id, reqId: 'EC-002', title: 'Password Complexity Validation', type: 'BUSINESS_RULE', description: 'Password must be minimum 8 characters containing at least one uppercase, one lowercase, one digit, and one special character.', priority: 'HIGH', source: 'DOCUMENT' },
      { documentId: doc1.id, projectId: project1.id, reqId: 'EC-003', title: 'Account Lockout After Failed Logins', type: 'SECURITY', description: 'Account should be locked after 5 consecutive failed login attempts. User must contact support or wait 30 minutes.', priority: 'HIGH', source: 'DOCUMENT' },
      { documentId: doc1.id, projectId: project1.id, reqId: 'EC-004', title: 'Product Search with Filters', type: 'FUNCTIONAL', description: 'Users can search products by keyword and filter by category, price range, brand, and rating.', priority: 'HIGH', source: 'DOCUMENT' },
      { documentId: doc1.id, projectId: project1.id, reqId: 'EC-005', title: 'Shopping Cart Management', type: 'FUNCTIONAL', description: 'Users can add, remove, and update quantity of items in their cart. Max 10 per item.', priority: 'MEDIUM', source: 'DOCUMENT' },
      { documentId: doc1.id, projectId: project1.id, reqId: 'EC-006', title: 'Coupon Code Validation', type: 'BUSINESS_RULE', description: 'Coupon codes must be validated for expiry date, minimum order value, and single-use restrictions.', priority: 'MEDIUM', source: 'DOCUMENT' },
      { documentId: doc1.id, projectId: project1.id, reqId: 'EC-007', title: 'Payment Processing', type: 'FUNCTIONAL', description: 'System shall support credit card, debit card, and PayPal payments with proper validation.', priority: 'HIGH', source: 'DOCUMENT' },
      { documentId: doc1.id, projectId: project1.id, reqId: 'EC-008', title: 'Session Timeout', type: 'NON_FUNCTIONAL', description: 'User session should timeout after 30 minutes of inactivity with a warning at 25 minutes.', priority: 'MEDIUM', source: 'DOCUMENT' },
    ],
  })

  // Create sample test scenarios for project 1
  await db.testScenario.createMany({
    data: [
      { projectId: project1.id, documentId: doc1.id, scenarioId: 'TS-001', module: 'Authentication', description: 'Valid user registration with all required fields', type: 'POSITIVE', priority: 'HIGH', status: 'APPROVED' },
      { projectId: project1.id, documentId: doc1.id, scenarioId: 'TS-002', module: 'Authentication', description: 'Registration with duplicate email address', type: 'NEGATIVE', priority: 'HIGH', status: 'APPROVED' },
      { projectId: project1.id, documentId: doc1.id, scenarioId: 'TS-003', module: 'Authentication', description: 'Password validation with various invalid formats', type: 'BOUNDARY', priority: 'HIGH', status: 'DRAFT' },
      { projectId: project1.id, documentId: doc1.id, scenarioId: 'TS-004', module: 'Authentication', description: 'Account lockout after 5 failed login attempts', type: 'NEGATIVE', priority: 'HIGH', status: 'APPROVED' },
      { projectId: project1.id, documentId: doc1.id, scenarioId: 'TS-005', module: 'Product Catalog', description: 'Search products with keyword and verify results', type: 'POSITIVE', priority: 'HIGH', status: 'APPROVED' },
      { projectId: project1.id, documentId: doc1.id, scenarioId: 'TS-006', module: 'Product Catalog', description: 'Filter products by price range boundary values', type: 'BOUNDARY', priority: 'MEDIUM', status: 'DRAFT' },
      { projectId: project1.id, documentId: doc1.id, scenarioId: 'TS-007', module: 'Shopping Cart', description: 'Add multiple items and verify cart total', type: 'POSITIVE', priority: 'HIGH', status: 'APPROVED' },
      { projectId: project1.id, documentId: doc1.id, scenarioId: 'TS-008', module: 'Shopping Cart', description: 'Exceed maximum quantity (10) for a single item', type: 'BOUNDARY', priority: 'MEDIUM', status: 'DRAFT' },
      { projectId: project1.id, documentId: doc1.id, scenarioId: 'TS-009', module: 'Checkout', description: 'Complete purchase with valid credit card', type: 'POSITIVE', priority: 'HIGH', status: 'APPROVED' },
      { projectId: project1.id, documentId: doc1.id, scenarioId: 'TS-010', module: 'Checkout', description: 'Payment with expired credit card', type: 'NEGATIVE', priority: 'HIGH', status: 'DRAFT' },
      { projectId: project1.id, documentId: doc1.id, scenarioId: 'TS-011', module: 'Checkout', description: 'SQL injection attempt in payment form fields', type: 'SECURITY', priority: 'HIGH', status: 'DRAFT' },
      { projectId: project1.id, documentId: doc1.id, scenarioId: 'TS-012', module: 'Checkout', description: 'Apply expired or invalid coupon code', type: 'NEGATIVE', priority: 'MEDIUM', status: 'DRAFT' },
    ],
  })

  // Create sample test cases
  await db.testCase.createMany({
    data: [
      {
        projectId: project1.id, documentId: doc1.id, scenarioId: 'TS-001', tcId: 'TC-001', module: 'Authentication',
        title: 'Verify successful registration with valid email and password',
        preconditions: 'User is on the registration page. Email is not already registered.',
        testData: 'Email: testuser@example.com, Password: Test@1234, Confirm Password: Test@1234',
        steps: '1. Navigate to registration page\n2. Enter valid email address\n3. Enter password meeting complexity requirements\n4. Confirm password\n5. Click Register button',
        expectedResult: 'User account is created. Confirmation email is sent. User is redirected to login page.',
        priority: 'HIGH', severity: 'HIGH', type: 'POSITIVE', automationCandidate: 'AUTOMATABLE', status: 'APPROVED', createdById: user1.id,
      },
      {
        projectId: project1.id, documentId: doc1.id, scenarioId: 'TS-002', tcId: 'TC-002', module: 'Authentication',
        title: 'Verify registration fails with duplicate email',
        preconditions: 'A user account with email testuser@example.com already exists.',
        testData: 'Email: testuser@example.com (already registered), Password: Test@1234',
        steps: '1. Navigate to registration page\n2. Enter already registered email\n3. Enter valid password\n4. Click Register button',
        expectedResult: 'Registration fails with error message "Email already registered". No duplicate account created.',
        priority: 'HIGH', severity: 'HIGH', type: 'NEGATIVE', automationCandidate: 'AUTOMATABLE', status: 'APPROVED', createdById: user1.id,
      },
      {
        projectId: project1.id, documentId: doc1.id, scenarioId: 'TS-005', tcId: 'TC-003', module: 'Product Catalog',
        title: 'Verify product search returns relevant results',
        preconditions: 'Products exist in the database. At least 5 products contain "laptop" in name or description.',
        testData: 'Search keyword: "laptop"',
        steps: '1. Navigate to product catalog page\n2. Enter "laptop" in search bar\n3. Click search or press Enter\n4. Verify search results',
        expectedResult: 'Products containing "laptop" are displayed. Results show product name, price, image, and availability. Results are sorted by relevance.',
        priority: 'HIGH', severity: 'MEDIUM', type: 'POSITIVE', automationCandidate: 'AUTOMATABLE', status: 'APPROVED', createdById: user2.id,
      },
    ],
  })

  // Create default settings
  await db.appSetting.createMany({
    data: [
      { key: 'ai_model', value: 'gpt-4', description: 'Default AI model for test case generation' },
      { key: 'max_test_cases_per_scenario', value: '5', description: 'Maximum test cases generated per scenario' },
      { key: 'default_priority', value: 'MEDIUM', description: 'Default priority for generated test cases' },
      { key: 'auto_automation_tagging', value: 'true', description: 'Automatically tag test cases for automation candidacy' },
      { key: 'session_timeout_minutes', value: '30', description: 'User session timeout in minutes' },
    ],
  })
}