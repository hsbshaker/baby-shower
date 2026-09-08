// Cash fund configuration. Display-only: links open Venmo, no payments are processed here.
export const FUND = {
  title: "The Diaper & College Fund",
  blurb:
    "For the everyday essentials and the far-off ones. Any amount is received with gratitude.",
  venmoHandle: "HaseebShaker",
  venmoProfileUrl: "https://venmo.com/u/HaseebShaker",
  suggestedAmounts: [25, 50, 100, 250],
  note: "Baby Shaker 🍼",
};

export function venmoPayUrl(amount?: number) {
  const params = new URLSearchParams({
    txn: "pay",
    recipients: FUND.venmoHandle,
    note: FUND.note,
  });
  if (amount) params.set("amount", String(amount));
  return `https://account.venmo.com/pay?${params.toString()}`;
}
