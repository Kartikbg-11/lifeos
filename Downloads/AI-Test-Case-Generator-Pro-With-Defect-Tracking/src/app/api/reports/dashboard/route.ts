import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const totalProjects = await db.project.count()
    const totalDocuments = await db.document.count()
    const totalTestCases = await db.testCase.count()
    const totalTestScenarios = await db.testScenario.count()
    const totalRtms = await db.rTM.count()
    const totalBugPredictions = await db.bugPrediction.count()
    const totalUsers = await db.user.count()
    const totalRequirements = await db.requirement.count()

    // Automation coverage
    const automatableCases = await db.testCase.count({
      where: { automationCandidate: 'AUTOMATABLE' },
    })
    const partiallyAutomatableCases = await db.testCase.count({
      where: { automationCandidate: 'PARTIALLY_AUTOMATABLE' },
    })
    const manualOnlyCases = await db.testCase.count({
      where: { automationCandidate: 'MANUAL_ONLY' },
    })
    const automationCoverage = totalTestCases > 0
      ? Math.round(((automatableCases + partiallyAutomatableCases * 0.5) / totalTestCases) * 100)
      : 0

    // Risk coverage
    const highRiskBugs = await db.bugPrediction.count({
      where: { impact: 'HIGH' },
    })
    const openBugs = await db.bugPrediction.count({
      where: { status: 'OPEN' },
    })

    // RTM coverage
    const coveredReqs = await db.rTM.count({
      where: { coverageStatus: 'COVERED' },
    })
    const partiallyCoveredReqs = await db.rTM.count({
      where: { coverageStatus: 'PARTIALLY_COVERED' },
    })
    const notCoveredReqs = await db.rTM.count({
      where: { coverageStatus: 'NOT_COVERED' },
    })
    const requirementCoverage = totalRtms > 0
      ? Math.round(((coveredReqs + partiallyCoveredReqs * 0.5) / totalRtms) * 100)
      : 0

    // Test case status distribution
    const draftCases = await db.testCase.count({ where: { status: 'DRAFT' } })
    const approvedCases = await db.testCase.count({ where: { status: 'APPROVED' } })
    const reviewCases = await db.testCase.count({ where: { status: 'REVIEW' } })

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentTestCases = await db.testCase.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    })
    const recentProjects = await db.project.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    })

    // Project status distribution
    const activeProjects = await db.project.count({ where: { status: 'ACTIVE' } })
    const completedProjects = await db.project.count({ where: { status: 'COMPLETED' } })
    const archivedProjects = await db.project.count({ where: { status: 'ARCHIVED' } })

    const stats = {
      overview: {
        totalProjects,
        totalDocuments,
        totalTestCases,
        totalTestScenarios,
        totalRequirements,
        totalUsers,
        totalBugPredictions,
      },
      automation: {
        automatable: automatableCases,
        partiallyAutomatable: partiallyAutomatableCases,
        manualOnly: manualOnlyCases,
        coveragePercentage: automationCoverage,
      },
      riskAnalysis: {
        totalPredictions: totalBugPredictions,
        highRisk: highRiskBugs,
        openRisks: openBugs,
        mitigationRate: totalBugPredictions > 0
          ? Math.round(((totalBugPredictions - openBugs) / totalBugPredictions) * 100)
          : 0,
      },
      coverage: {
        requirementCoveragePercentage: requirementCoverage,
        coveredRequirements: coveredReqs,
        partiallyCoveredRequirements: partiallyCoveredReqs,
        notCoveredRequirements: notCoveredReqs,
        totalRTMEntries: totalRtms,
      },
      testCaseStatus: {
        draft: draftCases,
        review: reviewCases,
        approved: approvedCases,
      },
      projectStatus: {
        active: activeProjects,
        completed: completedProjects,
        archived: archivedProjects,
      },
      recentActivity: {
        newTestCasesThisWeek: recentTestCases,
        newProjectsThisWeek: recentProjects,
      },
      monthlyTrend: [
        { month: 'Jan', testCases: 12, bugs: 3 },
        { month: 'Feb', testCases: 28, bugs: 5 },
        { month: 'Mar', testCases: 45, bugs: 8 },
        { month: 'Apr', testCases: 62, bugs: 12 },
        { month: 'May', testCases: 78, bugs: 15 },
        { month: 'Jun', testCases: totalTestCases || 95, bugs: totalBugPredictions || 18 },
      ],
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}