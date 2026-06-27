/**
 * V1 trade value formula.
 *
 * Raw player values are 1-100, but value isn't linear: two 50s shouldn't
 * equal one 99. We raise each value to a power before summing a trade side,
 * so elite players are worth disproportionately more than the sum of
 * similar mid-tier players. Bump TRADE_VALUE_EXPONENT up to make stars even
 * more dominant, or down toward 1 to make the formula closer to linear.
 */
export const TRADE_VALUE_EXPONENT = 2;

export function powerValue(value: number): number {
  return Math.pow(value, TRADE_VALUE_EXPONENT);
}

export function sidePower(values: number[]): number {
  return values.reduce((sum, value) => sum + powerValue(value), 0);
}

export type TradeComparison = {
  sideAPower: number;
  sideBPower: number;
  /** Share of combined power each side holds, 0-1. Splits evenly if both sides are empty. */
  sideAShare: number;
  sideBShare: number;
  winner: "A" | "B" | "tie";
};

export function compareTradeSides(sideAValues: number[], sideBValues: number[]): TradeComparison {
  const sideAPower = sidePower(sideAValues);
  const sideBPower = sidePower(sideBValues);
  const total = sideAPower + sideBPower;

  return {
    sideAPower,
    sideBPower,
    sideAShare: total === 0 ? 0.5 : sideAPower / total,
    sideBShare: total === 0 ? 0.5 : sideBPower / total,
    winner: sideAPower === sideBPower ? "tie" : sideAPower > sideBPower ? "A" : "B",
  };
}
