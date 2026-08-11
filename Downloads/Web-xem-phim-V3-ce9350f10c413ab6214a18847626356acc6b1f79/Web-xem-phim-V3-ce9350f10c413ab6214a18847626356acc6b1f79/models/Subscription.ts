import mongoose, { Schema, Document } from "mongoose";

export interface ISubscription extends Document {
  movieSlug: string;
  subscription: any;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    movieSlug: { type: String, required: true, index: true },
    subscription: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Subscription || mongoose.model<ISubscription>("Subscription", SubscriptionSchema);
