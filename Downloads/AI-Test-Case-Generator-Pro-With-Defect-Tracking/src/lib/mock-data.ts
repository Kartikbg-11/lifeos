// Mock data for AI Test Case Generator Pro
export const useMockData = true;

export interface Project {
  id: string;
  name: string;
  description: string;
  status: "Active" | "Completed" | "On Hold" | "Planning";
  members: number;
  testCases: number;
  createdAt: string;
}

export interface Document {
  id: string;
  projectId: string;
  name: string;
  type: string;
  size: string;
  status: "Processed" | "Processing" | "Pending" | "Failed";
  uploadedAt: string;
}

export interface TestCase {
  id: string;
  projectId: string;
  tcId: string;
  module: string;
  title: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  severity: "Critical" | "Major" | "Minor" | "Trivial";
  type: "Functional" | "Integration" | "Regression" | "API" | "Performance" | "Security" | "UI";
  status: "Draft" | "Ready" | "Approved" | "Deprecated";
  automation: "Automated" | "Manual" | "Semi-Automated" | "Not Set";
  preconditions: string;
  steps: string;
  expected: string;
  notes: string;
}

export interface RtmEntry {
  id: string;
  projectId: string;
  requirementId: string;
  requirement: string;
  scenarioId: string;
  scenario: string;
  testCaseId: string;
  coverage: "Covered" | "Partially Covered" | "Not Covered";
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "QA Lead" | "QA Engineer" | "Viewer";
  status: "Active" | "Inactive";
  lastActive: string;
  avatar?: string;
}

export interface Activity {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
}

export const mockProjects: Project[] = [
  { id: "p1", name: "E-Commerce Platform", description: "Full-stack e-commerce solution with payment integration and inventory management", status: "Active", members: 8, testCases: 124, createdAt: "2025-01-15" },
  { id: "p2", name: "Banking Mobile App", description: "Mobile banking application with secure transaction processing", status: "Active", members: 6, testCases: 98, createdAt: "2025-02-03" },
  { id: "p3", name: "Healthcare Portal", description: "Patient management and telemedicine platform", status: "Completed", members: 5, testCases: 67, createdAt: "2024-11-20" },
  { id: "p4", name: "CRM System", description: "Customer relationship management with analytics dashboard", status: "On Hold", members: 4, testCases: 34, createdAt: "2025-03-10" },
  { id: "p5", name: "Logistics Tracker", description: "Real-time shipment tracking and fleet management", status: "Planning", members: 3, testCases: 19, createdAt: "2025-04-01" },
];

export const mockDocuments: Document[] = [
  { id: "d1", projectId: "p1", name: "PRD_E-Commerce_v2.1.pdf", type: "PDF", size: "2.4 MB", status: "Processed", uploadedAt: "2025-01-20" },
  { id: "d2", projectId: "p1", name: "API_Spec_E-Commerce.yaml", type: "YAML", size: "156 KB", status: "Processed", uploadedAt: "2025-01-22" },
  { id: "d3", projectId: "p1", name: "UI_Wireframes_Figma.pdf", type: "PDF", size: "8.1 MB", status: "Processed", uploadedAt: "2025-01-25" },
  { id: "d4", projectId: "p2", name: "SRS_Banking_App_v3.docx", type: "DOCX", size: "1.8 MB", status: "Processed", uploadedAt: "2025-02-05" },
  { id: "d5", projectId: "p2", name: "Security_Requirements.pdf", type: "PDF", size: "980 KB", status: "Processed", uploadedAt: "2025-02-08" },
  { id: "d6", projectId: "p2", name: "Test_Strategy_Banking.docx", type: "DOCX", size: "420 KB", status: "Processed", uploadedAt: "2025-02-10" },
  { id: "d7", projectId: "p3", name: "HIPAA_Compliance_Guide.pdf", type: "PDF", size: "3.2 MB", status: "Processed", uploadedAt: "2024-11-25" },
  { id: "d8", projectId: "p3", name: "Patient_Workflow_Spec.docx", type: "DOCX", size: "1.1 MB", status: "Processed", uploadedAt: "2024-11-28" },
  { id: "d9", projectId: "p4", name: "CRM_Requirements_v1.docx", type: "DOCX", size: "2.0 MB", status: "Processing", uploadedAt: "2025-03-12" },
  { id: "d10", projectId: "p5", name: "Logistics_Spec_Draft.pdf", type: "PDF", size: "750 KB", status: "Pending", uploadedAt: "2025-04-03" },
];

export const mockTestCases: TestCase[] = [
  { id: "tc1", projectId: "p1", tcId: "EC-TC-001", module: "User Authentication", title: "Verify user login with valid credentials", priority: "Critical", severity: "Critical", type: "Functional", status: "Approved", automation: "Automated", preconditions: "User account exists with valid credentials", steps: "1. Navigate to login page\n2. Enter valid username\n3. Enter valid password\n4. Click Login button", expected: "User is redirected to dashboard with success message", notes: "Test with multiple browsers" },
  { id: "tc2", projectId: "p1", tcId: "EC-TC-002", module: "User Authentication", title: "Verify user login with invalid password", priority: "High", severity: "Major", type: "Functional", status: "Approved", automation: "Automated", preconditions: "User account exists", steps: "1. Navigate to login page\n2. Enter valid username\n3. Enter invalid password\n4. Click Login button", expected: "Error message displayed: 'Invalid credentials'", notes: "" },
  { id: "tc3", projectId: "p1", tcId: "EC-TC-003", module: "Product Catalog", title: "Verify product search by keyword", priority: "High", severity: "Major", type: "Functional", status: "Approved", automation: "Automated", preconditions: "Products exist in catalog", steps: "1. Navigate to search bar\n2. Enter keyword 'laptop'\n3. Press Enter or click Search", expected: "Search results display products matching keyword", notes: "" },
  { id: "tc4", projectId: "p1", tcId: "EC-TC-004", module: "Shopping Cart", title: "Verify adding product to cart from product page", priority: "Critical", severity: "Critical", type: "Functional", status: "Ready", automation: "Semi-Automated", preconditions: "User is logged in, product in stock", steps: "1. Navigate to product page\n2. Select quantity\n3. Click 'Add to Cart'", expected: "Product added to cart, cart count updated, success toast shown", notes: "" },
  { id: "tc5", projectId: "p1", tcId: "EC-TC-005", module: "Payment", title: "Verify credit card payment processing", priority: "Critical", severity: "Critical", type: "Integration", status: "Approved", automation: "Manual", preconditions: "Items in cart, valid payment method configured", steps: "1. Proceed to checkout\n2. Select credit card payment\n3. Enter card details\n4. Confirm payment", expected: "Payment processed, order confirmation displayed", notes: "Needs sandbox environment" },
  { id: "tc6", projectId: "p2", tcId: "BA-TC-001", module: "Account Management", title: "Verify new account registration", priority: "Critical", severity: "Critical", type: "Functional", status: "Approved", automation: "Automated", preconditions: "Valid email and phone number", steps: "1. Open app\n2. Tap 'Create Account'\n3. Fill registration form\n4. Submit", expected: "Account created, verification email sent", notes: "" },
  { id: "tc7", projectId: "p2", tcId: "BA-TC-002", module: "Fund Transfer", title: "Verify inter-bank fund transfer", priority: "Critical", severity: "Critical", type: "Integration", status: "Ready", automation: "Manual", preconditions: "Sufficient balance, recipient account valid", steps: "1. Login to app\n2. Navigate to Transfer\n3. Enter recipient details\n4. Enter amount\n5. Confirm with OTP", expected: "Transfer successful, balance updated, notification sent", notes: "Test with various amount ranges" },
  { id: "tc8", projectId: "p2", tcId: "BA-TC-003", module: "Security", title: "Verify session timeout after inactivity", priority: "High", severity: "Major", type: "Security", status: "Approved", automation: "Automated", preconditions: "User logged in", steps: "1. Login to app\n2. Wait for session timeout period (5 min)\n3. Attempt any action", expected: "User is logged out, redirected to login page", notes: "" },
  { id: "tc9", projectId: "p3", tcId: "HP-TC-001", module: "Patient Records", title: "Verify patient data access by authorized doctor", priority: "Critical", severity: "Critical", type: "Functional", status: "Approved", automation: "Automated", preconditions: "Doctor has valid credentials, patient records exist", steps: "1. Doctor logs in\n2. Search for patient\n3. View patient records", expected: "Patient records displayed with full access", notes: "HIPAA compliance required" },
  { id: "tc10", projectId: "p3", tcId: "HP-TC-002", module: "Telemedicine", title: "Verify video call connection between doctor and patient", priority: "High", severity: "Major", type: "Integration", status: "Draft", automation: "Not Set", preconditions: "Doctor and patient both online", steps: "1. Doctor initiates consultation\n2. Patient accepts call\n3. Verify video and audio", expected: "Video call established with clear audio/video", notes: "" },
  { id: "tc11", projectId: "p4", tcId: "CRM-TC-001", module: "Contact Management", title: "Verify creating a new contact", priority: "Medium", severity: "Minor", type: "Functional", status: "Draft", automation: "Not Set", preconditions: "User logged into CRM", steps: "1. Navigate to Contacts\n2. Click 'New Contact'\n3. Fill form\n4. Save", expected: "Contact created and visible in list", notes: "" },
  { id: "tc12", projectId: "p1", tcId: "EC-TC-006", module: "Product Catalog", title: "Verify product filtering by price range", priority: "Medium", severity: "Minor", type: "UI", status: "Ready", automation: "Semi-Automated", preconditions: "Products with various prices exist", steps: "1. Go to product listing\n2. Set price range filter\n3. Apply filter", expected: "Only products within price range displayed", notes: "" },
  { id: "tc13", projectId: "p1", tcId: "EC-TC-007", module: "Checkout", title: "Verify checkout with multiple shipping addresses", priority: "High", severity: "Major", type: "Functional", status: "Approved", automation: "Automated", preconditions: "User has multiple saved addresses", steps: "1. Add items to cart\n2. Proceed to checkout\n3. Select different shipping address\n4. Complete order", expected: "Order shipped to selected address", notes: "" },
  { id: "tc14", projectId: "p2", tcId: "BA-TC-004", module: "Performance", title: "Verify app response time under load", priority: "High", severity: "Major", type: "Performance", status: "Ready", automation: "Automated", preconditions: "Load testing environment configured", steps: "1. Simulate 1000 concurrent users\n2. Measure response times\n3. Check for errors", expected: "95% of requests under 2 seconds, error rate < 1%", notes: "Run during off-peak hours" },
  { id: "tc15", projectId: "p1", tcId: "EC-TC-008", module: "Search", title: "Verify search with special characters and SQL injection", priority: "Critical", severity: "Critical", type: "Security", status: "Approved", automation: "Automated", preconditions: "None", steps: "1. Navigate to search\n2. Enter SQL injection strings\n3. Enter XSS payloads\n4. Submit", expected: "No errors, sanitized input, no data exposure", notes: "Critical security test" },
];

export const mockRtmEntries: RtmEntry[] = [
  { id: "rtm1", projectId: "p1", requirementId: "REQ-001", requirement: "User shall be able to register and login", scenarioId: "SC-001", scenario: "Successful login flow", testCaseId: "EC-TC-001", coverage: "Covered" },
  { id: "rtm2", projectId: "p1", requirementId: "REQ-001", requirement: "User shall be able to register and login", scenarioId: "SC-002", scenario: "Invalid credentials handling", testCaseId: "EC-TC-002", coverage: "Covered" },
  { id: "rtm3", projectId: "p1", requirementId: "REQ-002", requirement: "User shall be able to search products", scenarioId: "SC-003", scenario: "Keyword search", testCaseId: "EC-TC-003", coverage: "Covered" },
  { id: "rtm4", projectId: "p1", requirementId: "REQ-003", requirement: "User shall be able to add items to cart", scenarioId: "SC-004", scenario: "Add single item", testCaseId: "EC-TC-004", coverage: "Covered" },
  { id: "rtm5", projectId: "p1", requirementId: "REQ-004", requirement: "User shall be able to make payment", scenarioId: "SC-005", scenario: "Credit card payment", testCaseId: "EC-TC-005", coverage: "Partially Covered" },
  { id: "rtm6", projectId: "p1", requirementId: "REQ-005", requirement: "Products shall be filterable by multiple criteria", scenarioId: "SC-006", scenario: "Price range filter", testCaseId: "EC-TC-006", coverage: "Covered" },
  { id: "rtm7", projectId: "p1", requirementId: "REQ-006", requirement: "Checkout shall support multiple shipping addresses", scenarioId: "SC-007", scenario: "Select different address", testCaseId: "EC-TC-007", coverage: "Covered" },
  { id: "rtm8", projectId: "p2", requirementId: "REQ-101", requirement: "Customer shall be able to create account", scenarioId: "SC-101", scenario: "New account registration", testCaseId: "BA-TC-001", coverage: "Covered" },
  { id: "rtm9", projectId: "p2", requirementId: "REQ-102", requirement: "Customer shall be able to transfer funds", scenarioId: "SC-102", scenario: "Inter-bank transfer", testCaseId: "BA-TC-002", coverage: "Partially Covered" },
  { id: "rtm10", projectId: "p2", requirementId: "REQ-103", requirement: "System shall enforce session security", scenarioId: "SC-103", scenario: "Session timeout", testCaseId: "BA-TC-003", coverage: "Covered" },
  { id: "rtm11", projectId: "p2", requirementId: "REQ-104", requirement: "System shall handle concurrent users", scenarioId: "SC-104", scenario: "Load testing", testCaseId: "BA-TC-004", coverage: "Not Covered" },
];

export const mockUsers: User[] = [
  { id: "u1", name: "John Smith", email: "john.smith@company.com", role: "Admin", status: "Active", lastActive: "2025-06-21 09:30" },
  { id: "u2", name: "Sarah Johnson", email: "sarah.j@company.com", role: "QA Lead", status: "Active", lastActive: "2025-06-21 10:15" },
  { id: "u3", name: "Mike Chen", email: "mike.chen@company.com", role: "QA Engineer", status: "Active", lastActive: "2025-06-20 16:45" },
  { id: "u4", name: "Emily Davis", email: "emily.d@company.com", role: "QA Engineer", status: "Active", lastActive: "2025-06-21 08:00" },
  { id: "u5", name: "Alex Rivera", email: "alex.r@company.com", role: "Viewer", status: "Inactive", lastActive: "2025-05-30 14:20" },
  { id: "u6", name: "Lisa Park", email: "lisa.park@company.com", role: "QA Engineer", status: "Active", lastActive: "2025-06-19 11:30" },
];

export const mockActivities: Activity[] = [
  { id: "a1", user: "Sarah Johnson", action: "generated", target: "12 test cases for E-Commerce Platform", time: "5 minutes ago" },
  { id: "a2", user: "Mike Chen", action: "uploaded", target: "API_Spec_E-Commerce.yaml", time: "23 minutes ago" },
  { id: "a3", user: "John Smith", action: "approved", target: "EC-TC-005: Credit card payment", time: "1 hour ago" },
  { id: "a4", user: "Emily Davis", action: "created project", target: "Logistics Tracker", time: "2 hours ago" },
  { id: "a5", user: "Sarah Johnson", action: "updated RTM for", target: "Banking Mobile App", time: "3 hours ago" },
];

export const mockTestScenarios = [
  { id: "SC-001", name: "User Login - Valid Credentials", projectId: "p1", type: "Positive" },
  { id: "SC-002", name: "User Login - Invalid Credentials", projectId: "p1", type: "Negative" },
  { id: "SC-003", name: "Product Search Functionality", projectId: "p1", type: "Functional" },
  { id: "SC-004", name: "Add to Cart Flow", projectId: "p1", type: "Functional" },
  { id: "SC-005", name: "Payment Processing", projectId: "p1", type: "Integration" },
  { id: "SC-006", name: "Price Range Filter", projectId: "p1", type: "UI" },
  { id: "SC-007", name: "Multiple Address Checkout", projectId: "p1", type: "Functional" },
  { id: "SC-101", name: "Account Registration", projectId: "p2", type: "Functional" },
  { id: "SC-102", name: "Fund Transfer", projectId: "p2", type: "Integration" },
  { id: "SC-103", name: "Session Security", projectId: "p2", type: "Security" },
];

export const dashboardChartData = {
  testCasesOverTime: [
    { month: "Jan", cases: 28 },
    { month: "Feb", cases: 45 },
    { month: "Mar", cases: 52 },
    { month: "Apr", cases: 78 },
    { month: "May", cases: 65 },
    { month: "Jun", cases: 74 },
  ],
  testCaseDistribution: [
    { name: "Functional", value: 142, fill: "#10b981" },
    { name: "Integration", value: 68, fill: "#f59e0b" },
    { name: "Regression", value: 45, fill: "#8b5cf6" },
    { name: "API", value: 38, fill: "#06b6d4" },
    { name: "Performance", value: 25, fill: "#ef4444" },
    { name: "Security", value: 24, fill: "#ec4899" },
  ],
  coverageByProject: [
    { project: "E-Commerce", coverage: 78 },
    { project: "Banking", coverage: 65 },
    { project: "Healthcare", coverage: 92 },
    { project: "CRM", coverage: 35 },
    { project: "Logistics", coverage: 18 },
  ],
};

export const generationResults = {
  requirementAnalysis: [
    { id: "RA-001", requirement: "User shall be able to register with email and password", category: "Functional", priority: "High", complexity: "Medium" },
    { id: "RA-002", requirement: "System shall validate password strength (min 8 chars, 1 uppercase, 1 number)", category: "Security", priority: "Critical", complexity: "Low" },
    { id: "RA-003", requirement: "User shall receive email verification after registration", category: "Functional", priority: "High", complexity: "Medium" },
    { id: "RA-004", requirement: "System shall lock account after 5 failed login attempts", category: "Security", priority: "Critical", complexity: "High" },
    { id: "RA-005", requirement: "User shall be able to reset password via email link", category: "Functional", priority: "High", complexity: "Medium" },
  ],
  testScenarios: [
    { id: "TS-001", scenario: "Successful registration with valid data", module: "Auth", type: "Positive", testCases: 3 },
    { id: "TS-002", scenario: "Registration with duplicate email", module: "Auth", type: "Negative", testCases: 2 },
    { id: "TS-003", scenario: "Registration with weak password", module: "Auth", type: "Negative", testCases: 2 },
    { id: "TS-004", scenario: "Email verification flow", module: "Auth", type: "Functional", testCases: 4 },
    { id: "TS-005", scenario: "Account lockout after failed attempts", module: "Auth", type: "Security", testCases: 3 },
    { id: "TS-006", scenario: "Password reset via email", module: "Auth", type: "Functional", testCases: 5 },
  ],
  testCases: [
    { id: "TC-GEN-001", title: "Verify successful registration with all valid fields", priority: "High", type: "Functional", steps: 6, expected: "Account created, email sent" },
    { id: "TC-GEN-002", title: "Verify registration with already registered email", priority: "High", type: "Negative", steps: 4, expected: "Error: Email already exists" },
    { id: "TC-GEN-003", title: "Verify registration with password less than 8 characters", priority: "Medium", type: "Negative", steps: 4, expected: "Error: Password too short" },
    { id: "TC-GEN-004", title: "Verify registration with missing required fields", priority: "Medium", type: "Negative", steps: 5, expected: "Validation errors shown" },
    { id: "TC-GEN-005", title: "Verify email verification link validity", priority: "Critical", type: "Functional", steps: 5, expected: "Account verified, redirected" },
    { id: "TC-GEN-006", title: "Verify account lockout after 5 failed logins", priority: "Critical", type: "Security", steps: 7, expected: "Account locked, notification sent" },
  ],
  edgeCases: [
    { id: "EC-001", case: "Concurrent registration with same email from two browsers", risk: "High", impact: "Data integrity", recommendation: "Add database unique constraint" },
    { id: "EC-002", case: "Registration with extremely long input fields (>1000 chars)", risk: "Medium", impact: "UI/UX", recommendation: "Add max-length validation" },
    { id: "EC-003", case: "Registration with SQL injection in username field", risk: "Critical", impact: "Security", recommendation: "Input sanitization + parameterized queries" },
    { id: "EC-004", case: "Email verification with expired token", risk: "Medium", impact: "Functionality", recommendation: "Token expiration with clear error message" },
    { id: "EC-005", case: "Registration form submission with network timeout", risk: "Low", impact: "UX", recommendation: "Implement retry mechanism with debounce" },
  ],
  apiTestCases: [
    { id: "API-001", endpoint: "POST /api/auth/register", method: "POST", params: "email, password, name", expectedStatus: 201, auth: "None" },
    { id: "API-002", endpoint: "POST /api/auth/login", method: "POST", params: "email, password", expectedStatus: 200, auth: "None" },
    { id: "API-003", endpoint: "POST /api/auth/logout", method: "POST", params: "-", expectedStatus: 204, auth: "Bearer Token" },
    { id: "API-004", endpoint: "POST /api/auth/refresh", method: "POST", params: "refreshToken", expectedStatus: 200, auth: "None" },
    { id: "API-005", endpoint: "GET /api/users/me", method: "GET", params: "-", expectedStatus: 200, auth: "Bearer Token" },
    { id: "API-006", endpoint: "PUT /api/users/password", method: "PUT", params: "oldPassword, newPassword", expectedStatus: 200, auth: "Bearer Token" },
  ],
  databaseTestCases: [
    { id: "DB-001", operation: "INSERT user record", table: "users", validation: "All fields populated, timestamps set", type: "CRUD" },
    { id: "DB-002", operation: "SELECT user by email with index", table: "users", validation: "Query uses email index, <100ms", type: "Performance" },
    { id: "DB-003", operation: "UPDATE user status after verification", table: "users", validation: "is_verified=true, verified_at set", type: "CRUD" },
    { id: "DB-004", operation: "DELETE session on logout", table: "sessions", validation: "Session removed, no orphan records", type: "CRUD" },
    { id: "DB-005", operation: "Concurrent INSERT for same email", table: "users", validation: "Only one record created, constraint enforced", type: "Concurrency" },
  ],
  bugPrediction: [
    { id: "BP-001", area: "Authentication Flow", likelihood: "High", description: "Race condition in concurrent login attempts", severity: "Major" },
    { id: "BP-002", area: "Session Management", likelihood: "Medium", description: "Token refresh may fail silently", severity: "Major" },
    { id: "BP-003", area: "Email Service", likelihood: "Medium", description: "Verification emails may be marked as spam", severity: "Minor" },
    { id: "BP-004", area: "Password Reset", likelihood: "Low", description: "Reset link may be reused before expiry", severity: "Critical" },
    { id: "BP-005", area: "Rate Limiting", likelihood: "High", description: "API rate limits not enforced consistently", severity: "Major" },
  ],
  automationRecommendation: [
    { id: "AR-001", testArea: "User Registration", currentCoverage: "40%", recommended: "Playwright + Jest", effort: "Medium", roi: "High" },
    { id: "AR-002", testArea: "Login/Logout", currentCoverage: "60%", recommended: "Playwright", effort: "Low", roi: "High" },
    { id: "AR-003", testArea: "API Endpoints", currentCoverage: "20%", recommended: "Supertest + Jest", effort: "Medium", roi: "Very High" },
    { id: "AR-004", testArea: "Email Verification", currentCoverage: "0%", recommended: "Mailhog + Playwright", effort: "High", roi: "Medium" },
    { id: "AR-005", testArea: "Password Reset", currentCoverage: "10%", recommended: "Playwright", effort: "Medium", roi: "High" },
  ],
};