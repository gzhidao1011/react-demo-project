---
name: payment-integration
description: Implement payment integration including Stripe, PayPal, or other payment gateways. Use when integrating payment processing or handling transactions.
---

# Payment Integration

Implement payment integration with payment gateways.

## Quick Checklist

When implementing payments:

- [ ] **Payment gateway** selected (Stripe, PayPal, etc.)
- [ ] **API keys** configured securely
- [ ] **Payment flow** implemented
- [ ] **Error handling** added
- [ ] **Webhook handling** implemented
- [ ] **Security** measures in place
- [ ] **Testing** with test mode

## Stripe Integration

### 1. Install Stripe

```bash
pnpm add @stripe/stripe-js @stripe/react-stripe-js
```

### 2. Stripe Provider

```tsx
// apps/web/app/providers/StripeProvider.tsx
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

export function StripeProvider({ children }: { children: React.ReactNode }) {
  return <Elements stripe={stripePromise}>{children}</Elements>;
}
```

### 3. Payment Form Component

```tsx
// apps/web/app/components/PaymentForm.tsx
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useState } from "react";
import { paymentService } from "@repo/services";

interface PaymentFormProps {
  amount: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function PaymentForm({ amount, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);

    try {
      // Create payment intent
      const { clientSecret } = await paymentService.createPaymentIntent({
        amount: amount * 100, // Convert to cents
      });

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
          },
        }
      );

      if (error) {
        onError?.(error);
      } else if (paymentIntent.status === "succeeded") {
        onSuccess?.();
      }
    } catch (error) {
      onError?.(error as Error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe || processing}>
        {processing ? "处理中..." : `支付 ¥${amount}`}
      </button>
    </form>
  );
}
```

## Payment Service

### 1. Payment Service Implementation

```typescript
// packages/services/src/payment.service.ts
import { APIServiceBase } from "./api.service.base";

export interface CreatePaymentIntentRequest {
  amount: number;
  currency?: string;
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export class PaymentService extends APIServiceBase {
  async createPaymentIntent(
    data: CreatePaymentIntentRequest
  ): Promise<CreatePaymentIntentResponse> {
    return this.request<CreatePaymentIntentResponse>("/api/payments/intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...data,
        currency: data.currency || "cny",
      }),
    });
  }

  async confirmPayment(paymentIntentId: string): Promise<void> {
    return this.request(`/api/payments/${paymentIntentId}/confirm`, {
      method: "POST",
    });
  }
}

export const paymentService = new PaymentService();
```

## Best Practices

### ✅ Good Practices

- Use test mode for development
- Store API keys securely
- Handle payment errors gracefully
- Implement webhook handlers
- Validate amounts server-side
- Use HTTPS for all requests
- Log payment events
- Handle refunds properly

### ❌ Anti-Patterns

- Don't expose secret keys
- Don't skip error handling
- Don't process payments client-side only
- Don't ignore webhook security
- Don't skip amount validation

## Related Rules

- Security: `.cursor/rules/21-安全规范.mdc`
- API Development: `.cursor/skills/api-development/SKILL.md`
