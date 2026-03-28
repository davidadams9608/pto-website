export interface SubscribeResult {
  success: boolean;
  error?: string;
}

export interface NewsletterProvider {
  subscribe(email: string): Promise<SubscribeResult>;
  getSubscriberCount(): Promise<number>;
}
