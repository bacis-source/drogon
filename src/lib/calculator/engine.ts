export interface CalculatorInputs {
  totalWindows: number;
  avgWindowSizeM2: number;
}

export interface SystemConstants {
  co2_per_m2_new_window: number;
  price_per_m2_new_window: number;
  damage_rate_no_wincover: number;
  damage_rate_with_wincover: number;
  wincover_rental_cost: number;
}

export interface CalculationResult {
  financial: {
    totalWindowCostWithoutProtection: number;
    totalWindowCostWithWincover: number;
    wincoverRentalCost: number;
    netSavingsDkk: number;
    roiPercentage: number;
  };
  co2: {
    emissionsWithoutProtectionKg: number;
    emissionsWithWincoverKg: number;
    netSavingsKgCo2: number;
  };
  metrics: {
    windowsSavedFromDamage: number;
  };
}

/**
 * Kerne-motor (Rule Engine) til at beregne den økonomiske og miljømæssige gevinst ved Wincover.
 * Sammenligner et scenarie med og uden vinduesbeskyttelse baseret på faste skadesrater.
 * 
 * @param {CalculatorInputs} inputs - Brugerens input (antal og størrelse på vinduer).
 * @param {SystemConstants} constants - Aktuelle beregningskonstanter hentet fra databasen.
 * @returns {CalculationResult} Detaljeret objekt med finansielle og CO2-mæssige besparelser.
 */
export function runCalculator(
  inputs: CalculatorInputs,
  constants: SystemConstants
): CalculationResult {
  
  // Baseline (No Wincover)
  const damagedWindowsNoWincover = inputs.totalWindows * constants.damage_rate_no_wincover;
  const replacementCostNoWincover = damagedWindowsNoWincover * inputs.avgWindowSizeM2 * constants.price_per_m2_new_window;
  const co2NoWincover = damagedWindowsNoWincover * inputs.avgWindowSizeM2 * constants.co2_per_m2_new_window;
  
  // With Wincover
  const damagedWindowsWithWincover = inputs.totalWindows * constants.damage_rate_with_wincover;
  const replacementCostWithWincover = damagedWindowsWithWincover * inputs.avgWindowSizeM2 * constants.price_per_m2_new_window;
  const co2WithWincover = damagedWindowsWithWincover * inputs.avgWindowSizeM2 * constants.co2_per_m2_new_window;
  const rentalCost = inputs.totalWindows * constants.wincover_rental_cost;
  
  // Financial Savings
  const netSavingsDkk = replacementCostNoWincover - (replacementCostWithWincover + rentalCost);
  const roiPercentage = rentalCost > 0 ? (netSavingsDkk / rentalCost) * 100 : 0;
  
  // CO2 Savings
  const netSavingsKgCo2 = co2NoWincover - co2WithWincover;
  
  return {
    financial: {
      totalWindowCostWithoutProtection: replacementCostNoWincover,
      totalWindowCostWithWincover: replacementCostWithWincover,
      wincoverRentalCost: rentalCost,
      netSavingsDkk: Math.round(netSavingsDkk),
      roiPercentage: Math.round(roiPercentage)
    },
    co2: {
      emissionsWithoutProtectionKg: Math.round(co2NoWincover),
      emissionsWithWincoverKg: Math.round(co2WithWincover),
      netSavingsKgCo2: Math.round(netSavingsKgCo2)
    },
    metrics: {
      windowsSavedFromDamage: Math.round(damagedWindowsNoWincover - damagedWindowsWithWincover)
    }
  };
}
