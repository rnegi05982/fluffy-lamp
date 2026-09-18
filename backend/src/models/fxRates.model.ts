import mongoose, { Schema, model, type Model } from 'mongoose';

export interface IFxRates {
  baseCurrency: string;
  /** currency code → rate relative to the base currency (base = 1). */
  rates: Record<string, number>;
  note?: string;
}

const fxRatesSchema = new Schema<IFxRates>(
  {
    baseCurrency: { type: String, required: true },
    rates: { type: Schema.Types.Mixed, required: true },
    note: { type: String },
  },
  { collection: 'fx_rates' },
);

export const FxRates: Model<IFxRates> =
  (mongoose.models.FxRates as Model<IFxRates>) || model<IFxRates>('FxRates', fxRatesSchema);
