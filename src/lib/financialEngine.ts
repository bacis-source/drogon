export interface FinancialAssumptions {
  initialCapital: number;
  customersMonth1: number;
  arpa: number; // Average Revenue Per Account (Monthly)
  monthlyGrowthRate: number; // e.g. 0.05 for 5%
  monthlyChurnRate: number; // e.g. 0.02 for 2%
  fixedCostsMonthly: number;
  variableCostPerCustomer: number;
  cac: number; // Cost to acquire one customer
}

export interface MonthData {
  month: number;
  newCustomers: number;
  churnedCustomers: number;
  totalCustomers: number;
  revenue: number;
  fixedCosts: number;
  variableCosts: number;
  marketingCosts: number; // CAC * newCustomers
  totalCosts: number;
  netProfit: number;
  cashBalance: number;
}

export interface FinancialOutput {
  months: MonthData[];
  summary: {
    ltv: number;
    cac: number;
    ltvCacRatio: number;
    breakEvenMonth: number | null;
    runwayMonths: number | null;
    totalRevenueY1: number;
    totalRevenueY2: number;
    totalRevenueY3: number;
  };
}

export function generateFinancialModel(assumptions: FinancialAssumptions, monthsToCalculate = 36): FinancialOutput {
  const months: MonthData[] = [];
  let currentCash = assumptions.initialCapital;
  let currentCustomers = 0;
  let breakEvenMonth: number | null = null;
  let runwayMonths: number | null = null;

  let totalRevY1 = 0;
  let totalRevY2 = 0;
  let totalRevY3 = 0;

  for (let m = 1; m <= monthsToCalculate; m++) {
    // 1. Calculate Customers
    let newCustomers = 0;
    if (m === 1) {
      newCustomers = assumptions.customersMonth1;
    } else {
      // Growth is based on previous month's new customers in this simple model
      const prevNew = months[m - 2].newCustomers;
      newCustomers = Math.round(prevNew * (1 + assumptions.monthlyGrowthRate));
    }

    const churnedCustomers = Math.round(currentCustomers * assumptions.monthlyChurnRate);
    currentCustomers = currentCustomers + newCustomers - churnedCustomers;

    // 2. Calculate Revenue
    const revenue = currentCustomers * assumptions.arpa;

    // 3. Calculate Costs
    const fixedCosts = assumptions.fixedCostsMonthly;
    const variableCosts = currentCustomers * assumptions.variableCostPerCustomer;
    const marketingCosts = newCustomers * assumptions.cac;
    const totalCosts = fixedCosts + variableCosts + marketingCosts;

    // 4. Calculate Profit & Cash
    const netProfit = revenue - totalCosts;
    currentCash = currentCash + netProfit;

    // 5. Track Metrics
    if (netProfit > 0 && breakEvenMonth === null) {
      breakEvenMonth = m;
    }

    if (currentCash <= 0 && runwayMonths === null) {
      runwayMonths = m;
    }

    if (m <= 12) totalRevY1 += revenue;
    else if (m <= 24) totalRevY2 += revenue;
    else if (m <= 36) totalRevY3 += revenue;

    months.push({
      month: m,
      newCustomers,
      churnedCustomers,
      totalCustomers,
      revenue,
      fixedCosts,
      variableCosts,
      marketingCosts,
      totalCosts,
      netProfit,
      cashBalance: currentCash
    });
  }

  // Summary Metrics
  // LTV = ARPA * Gross Margin % / Churn Rate
  // For simplicity: Gross Margin = (ARPA - Variable Cost) / ARPA
  const grossMargin = (assumptions.arpa - assumptions.variableCostPerCustomer) / assumptions.arpa;
  const ltv = (assumptions.arpa * grossMargin) / assumptions.monthlyChurnRate;
  
  const ltvCacRatio = assumptions.cac > 0 ? ltv / assumptions.cac : 0;

  return {
    months,
    summary: {
      ltv: Math.round(ltv),
      cac: assumptions.cac,
      ltvCacRatio: parseFloat(ltvCacRatio.toFixed(2)),
      breakEvenMonth,
      runwayMonths,
      totalRevenueY1: Math.round(totalRevY1),
      totalRevenueY2: Math.round(totalRevY2),
      totalRevenueY3: Math.round(totalRevY3),
    }
  };
}
