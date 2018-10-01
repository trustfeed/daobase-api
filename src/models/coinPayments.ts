import { TypedError } from '../utils';

export const COIN_PAYMENTS_PENDING = 'PENDING_COINPAYMENT';
export const COIN_PAYMENTS_PENDING_TOKEN_TRANSFER = 'PENDING_TOKEN_TRANSFER';
export const COIN_PAYMENTS_COMPLETE = 'COMPLETE';

export class CoinPayments {
  public status: string;
  public _id?: string;

  constructor(
    public userId: string,
    public campaignId: string,
    public tokenAddress: string,
    public paymentCurrency: string,
    public tokenAmount: string,
    public currencyAmount: string,
    public etherAmount: string,
    public coinPaymentsId: string
  ) {
    this.status = COIN_PAYMENTS_PENDING;
  }
}

export const checkEtherReceived = async (coinPayments) => {
  if (coinPayments !== COIN_PAYMENTS_PENDING) {
    throw new TypedError(500, 'not pending payment on that transfer');
  }
  coinPayments.status = COIN_PAYMENTS_PENDING_TOKEN_TRANSFER;
  return coinPayments;
};

export const checkTokenTransfer = async (coinPayments) => {
  if (coinPayments !== COIN_PAYMENTS_PENDING_TOKEN_TRANSFER) {
    throw new TypedError(500, 'not pending token transfer');
  }
  // TODO: Use web3 to check the tokens were transfered successfully
  coinPayments.status = COIN_PAYMENTS_COMPLETE;
  return coinPayments;
};
