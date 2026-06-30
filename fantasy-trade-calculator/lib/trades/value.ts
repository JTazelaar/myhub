export const TRADE_VALUE_EXPONENT = 2;
export function powerValue(value: number): number { return Math.pow(value, TRADE_VALUE_EXPONENT); }
export function sidePower(values: number[]): number { return values.reduce((sum, value) => sum + powerValue(value), 0); }
export type TradeComparison = { sideAPower: number; sideBPower: number; sideAShare: number; sideBShare: number; winner: "A" | "B" | "tie"; };
export function compareTradeSides(sideAValues: number[], sideBValues: number[]): TradeComparison {
  const sideAPower = sidePower(sideAValues);
  const sideBPower = sidePower(sideBValues);
  const total = sideAPower + sideBPower;
  return { sideAPower, sideBPower, sideAShare: total === 0 ? 0.5 : sideAPower / total, sideBShare: total === 0 ? 0.5 : sideBPower / total, winner: sideAPower === sideBPower ? "tie" : sideAPower > sideBPower ? "A" : "B" };
}
