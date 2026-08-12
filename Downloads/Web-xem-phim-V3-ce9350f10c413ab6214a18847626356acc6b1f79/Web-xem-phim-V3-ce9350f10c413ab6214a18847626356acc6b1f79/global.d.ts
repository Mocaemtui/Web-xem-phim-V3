declare module '@/models/Subscription' {
  import mongoose from 'mongoose';
  const Subscription: mongoose.Model<any>;
  export default Subscription;
}

declare module 'react-intersection-observer' {
  export function useInView(options?: any): { ref: (node: any) => void; inView: boolean };
}