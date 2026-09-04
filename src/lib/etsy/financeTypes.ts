export type EtsyMoney = {
  amount?: number;
  divisor?: number;
  currency_code?: string;
};

export type EtsyPaymentAdjustmentItem = {
  payment_adjustment_id?: number;
  payment_adjustment_item_id?: number;

  adjustment_type?: string;

  amount?: number;
  shop_amount?: number;

  transaction_id?: number;
  bill_payment_id?: number;

  created_timestamp?: number;
  updated_timestamp?: number;
};

export type EtsyPaymentAdjustment = {
  payment_adjustment_id?: number;
  payment_id?: number;

  status?: string;
  is_success?: boolean;

  user_id?: number;
  reason_code?: string;

  total_adjustment_amount?: number;

  shop_total_adjustment_amount?: number;

  buyer_total_adjustment_amount?: number;

  total_fee_adjustment_amount?: number;

  create_timestamp?: number;
  created_timestamp?: number;

  update_timestamp?: number;
  updated_timestamp?: number;

  payment_adjustment_items?:
    EtsyPaymentAdjustmentItem[];
};

export type EtsyPayment = {
  payment_id?: number;
  buyer_user_id?: number;
  shop_id?: number;
  receipt_id?: number;

  amount_gross?: EtsyMoney;
  amount_fees?: EtsyMoney;
  amount_net?: EtsyMoney;

  posted_gross?: EtsyMoney;
  posted_fees?: EtsyMoney;
  posted_net?: EtsyMoney;

  adjusted_gross?: EtsyMoney;
  adjusted_fees?: EtsyMoney;
  adjusted_net?: EtsyMoney;

  currency?: string;

  shop_currency?: string;
  buyer_currency?: string;

  shipping_user_id?: number;
  shipping_address_id?: number;

  billing_address_id?: number;

  status?: string;

  shipped_timestamp?: number;

  create_timestamp?: number;
  created_timestamp?: number;

  update_timestamp?: number;
  updated_timestamp?: number;

  payment_adjustments?: EtsyPaymentAdjustment[];
};

export type EtsyPaymentsResponse = {
  count?: number;
  results?: EtsyPayment[];
};

export type EtsyPaymentAccountLedgerEntry = {
  entry_id?: number;
  ledger_id?: number;

  sequence_number?: number;

  amount?: number;

  currency?: string;

  description?: string;

  balance?: number;

  create_date?: number;
  created_timestamp?: number;

  ledger_type?: string;

  reference_type?: string;

  reference_id?: string;

  parent_entry_id?: number;

  payment_adjustments?: EtsyPaymentAdjustment[];
};

export type EtsyPaymentAccountLedgerResponse = {
  count?: number;

  results?: EtsyPaymentAccountLedgerEntry[];
};

export type SellerOsMoney = {
  amount: number;
  currency: string | null;
};

export function convertEtsyMoney(
  money: EtsyMoney | null | undefined,
): SellerOsMoney {
  const amount =
    typeof money?.amount === "number"
      ? money.amount
      : 0;

  const divisor =
    typeof money?.divisor === "number" &&
    money.divisor > 0
      ? money.divisor
      : 100;

  return {
    amount: amount / divisor,

    currency:
      typeof money?.currency_code ===
      "string"
        ? money.currency_code
        : null,
  };
}