import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json()

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Get all test cases for the project
    const testCases = await db.testCase.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    })

    // If we have real test cases, analyze them; otherwise provide mock recommendations
    let recommendations
    if (testCases.length > 0) {
      recommendations = testCases.map((tc) => {
        const { automationCandidate, module, type, steps, title } = tc

        // Analyze and potentially update automation candidacy
        let recommendation = automationCandidate
        let reason = tc.automationReason

        // Heuristic: security tests are often harder to automate
        if (module === 'Security' && automationCandidate === 'AUTOMATABLE') {
          recommendation = 'PARTIALLY_AUTOMATABLE'
          reason = 'Security tests require manual verification of response behavior. Automated input injection is possible, but response validation may need manual review for subtle vulnerabilities.'
        }

        // Heuristic: positive tests with clear steps are highly automatable
        if (type === 'POSITIVE' && steps.length > 50 && automationCandidate === 'MANUAL_ONLY') {
          recommendation = 'AUTOMATABLE'
          reason = 'This positive test case has detailed, deterministic steps with clear expected results. It is an excellent candidate for full test automation.'
        }

        // Heuristic: negative/boundary tests are usually automatable
        if ((type === 'NEGATIVE' || type === 'BOUNDARY') && automationCandidate === 'MANUAL_ONLY') {
          recommendation = 'AUTOMATABLE'
          reason = `${type} test with defined error conditions. Error message validation can be automated.`
        }

        return {
          id: tc.id,
          tcId: tc.tcId,
          title,
          module,
          type,
          currentAutomationCandidate: automationCandidate,
          recommendedAutomationCandidate: recommendation,
          reason,
          estimatedEffort: recommendation === 'AUTOMATABLE' ? '2-4 hours' : recommendation === 'PARTIALLY_AUTOMATABLE' ? '4-8 hours' : 'Manual only - N/A',
          priority: tc.priority === 'HIGH' ? 'P1 - Automate first' : tc.priority === 'MEDIUM' ? 'P2 - Automate in next sprint' : 'P3 - Automate later',
        }
      })
    } else {
      // Mock recommendations
      recommendations = [
        { tcId: 'TC-001', title: 'User Registration - Valid Input', module: 'Authentication', type: 'POSITIVE', currentAutomationCandidate: 'MANUAL_ONLY', recommendedAutomationCandidate: 'AUTOMATABLE', reason: 'Standard form fill and submission with deterministic expected results. Perfect for API automation.', estimatedEffort: '2-3 hours', priority: 'P1 - Automate first' },
        { tcId: 'TC-002', title: 'Registration - Duplicate Email', module: 'Authentication', type: 'NEGATIVE', currentAutomationCandidate: 'MANUAL_ONLY', recommendedAutomationCandidate: 'AUTOMATABLE', reason: 'Simple validation test with clear error message assertion.', estimatedEffort: '1-2 hours', priority: 'P1 - Automate first' },
        { tcId: 'TC-003', title: 'Account Lockout', module: 'Authentication', type: 'NEGATIVE', currentAutomationCandidate: 'MANUAL_ONLY', recommendedAutomationCandidate: 'AUTOMATABLE', reason: 'Sequential step test with counter verification. Loop-based automation is straightforward.', estimatedEffort: '3-4 hours', priority: 'P1 - Automate first' },
        { tcId: 'TC-004', title: 'Product Search', module: 'Product Catalog', type: 'POSITIVE', currentAutomationCandidate: 'MANUAL_ONLY', recommendedAutomationCandidate: 'AUTOMATABLE', reason: 'API-driven test. Search response validation is programmatic.', estimatedEffort: '2-3 hours', priority: 'P2 - Automate in next sprint' },
        { tcId: 'TC-005', title: 'Cart Total Calculation', module: 'Shopping Cart', type: 'POSITIVE', currentAutomationCandidate: 'MANUAL_ONLY', recommendedAutomationCandidate: 'AUTOMATABLE', reason: 'Mathematical assertion test. Numeric verification is ideal for automation.', estimatedEffort: '2-3 hours', priority: 'P1 - Automate first' },
        { tcId: 'TC-006', title: 'Credit Card Payment', module: 'Checkout', type: 'POSITIVE', currentAutomationCandidate: 'MANUAL_ONLY', recommendedAutomationCandidate: 'PARTIALLY_AUTOMATABLE', reason: 'Payment gateway integration requires sandbox environment. Core flow automatable, but payment provider response may vary.', estimatedEffort: '6-8 hours', priority: 'P2 - Automate in next sprint' },
        { tcId: 'TC-007', title: 'SQL Injection Prevention', module: 'Security', type: 'NEGATIVE', currentAutomationCandidate: 'MANUAL_ONLY', recommendedAutomationCandidate: 'AUTOMATABLE', reason: 'Input validation and response code checking can be fully automated. No visual verification needed.', estimatedEffort: '3-4 hours', priority: 'P1 - Automate first' },
        { tcId: 'TC-008', title: 'Coupon Validation', module: 'Shopping Cart', type: 'NEGATIVE', currentAutomationCandidate: 'MANUAL_ONLY', recommendedAutomationCandidate: 'AUTOMATABLE', reason: 'Data-driven test with multiple coupon states. Each validation rule can be tested programmatically.', estimatedEffort: '3-4 hours', priority: 'P2 - Automate in next sprint' },
      ]
    }

    // Summary stats
    const total = recommendations.length
    const automatable = recommendations.filter((r) => r.recommendedAutomationCandidate === 'AUTOMATABLE').length
    const partiallyAutomatable = recommendations.filter((r) => r.recommendedAutomationCandidate === 'PARTIALLY_AUTOMATABLE').length
    const manualOnly = recommendations.filter((r) => r.recommendedAutomationCandidate === 'MANUAL_ONLY').length
    const automationPotential = total > 0 ? Math.round(((automatable + partiallyAutomatable * 0.5) / total) * 100) : 0

    const summary = {
      totalTestCases: total,
      automatable,
      partiallyAutomatable,
      manualOnly,
      automationPotential,
      estimatedTotalHours: `${automatable * 3 + partiallyAutomatable * 6} hours`,
      roiMessage: automationPotential > 70
        ? 'High automation ROI detected. Recommend prioritizing automation for this project.'
        : automationPotential > 40
          ? 'Moderate automation ROI. Focus on high-priority test cases first.'
          : 'Low automation ROI. Many tests require manual verification. Consider automation only for regression suite.',
    }

    return NextResponse.json({ recommendations, summary })
  } catch (error) {
    console.error('AI automation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}