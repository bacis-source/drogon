import { NextResponse } from 'next/server';
import { generateFinancialModel, FinancialAssumptions } from '@/lib/financialEngine';

export async function GET() {
  // Hardcoded dummy assumptions based on the user's SaaS example
  const dummyAssumptions: FinancialAssumptions = {
    initialCapital: 100000,
    customersMonth1: 200,
    arpa: 49, // 49 kr/month
    monthlyGrowthRate: 0.20, // 20% growth
    monthlyChurnRate: 0.08, // 8% churn
    fixedCostsMonthly: 35000,
    variableCostPerCustomer: 5, // Hosting/support per user
    cac: 200 // Cost to acquire
  };

  const model = generateFinancialModel(dummyAssumptions, 36);

  return NextResponse.json({
    message: "Financial Engine MVP Test",
    assumptions: dummyAssumptions,
    summary: model.summary,
    month1: model.months[0],
    month12: model.months[11],
    month36: model.months[35]
  });
}
