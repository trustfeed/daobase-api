
export class CoinPayments {
  public status: string;
  public _id?: string;

  constructor(
    public userId: string,
    public campaignId: string,
    public paymentCurrency: string,
    public tokenAmount: string,
    public currencyAmount: string,
    public etherAmount: string
  ) {
    this.status = 'PENDING_COINPAYMENT';
  }
}
