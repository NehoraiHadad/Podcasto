/**
 * Credit pricing and package configuration
 * Centralizes all credit-related pricing and limits
 */

export const PRICING = {
  // Cost per episode generation (flat rate)
  EPISODE_GENERATION_COST: 10,

  // Free credits granted on user signup
  FREE_CREDITS_ON_SIGNUP: 30,

  // Credit packages available for purchase
  CREDIT_PACKAGES: [
    {
      id: 'basic',
      name: 'Basic Package',
      credits: 50,
      price: 9.99,
      description: '50 credits - perfect for trying out the service',
      displayOrder: 1
    },
    {
      id: 'pro',
      name: 'Pro Package',
      credits: 200,
      price: 29.99,
      description: '200 credits - best value for regular users',
      displayOrder: 2,
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise Package',
      credits: 1000,
      price: 99.99,
      description: '1000 credits - for power users and teams',
      displayOrder: 3
    }
  ] as const,

  // Monthly subscription plans
  SUBSCRIPTIONS: [
    {
      id: 'basic',
      name: 'Basic Plan',
      monthlyCredits: 100,
      price: 19.99,
      description: '100 credits per month',
      displayOrder: 1
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      monthlyCredits: 500,
      price: 49.99,
      description: '500 credits per month',
      displayOrder: 2,
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise Plan',
      monthlyCredits: 2000,
      price: 149.99,
      description: '2000 credits per month',
      displayOrder: 3
    }
  ] as const
} as const;

// Type exports for TypeScript
export type CreditPackageId = typeof PRICING.CREDIT_PACKAGES[number]['id'];
export type SubscriptionPlanId = typeof PRICING.SUBSCRIPTIONS[number]['id'];
