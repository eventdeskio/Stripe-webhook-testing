// src/app/services/stripe.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { loadStripe, Stripe, StripeElements, StripeElement } from '@stripe/stripe-js';
import { Observable, from, throwError } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private stripe: Promise<Stripe | null>;
  private elements: StripeElements | null = null;

  constructor(private http: HttpClient) {
    // Initialize Stripe with your publishable key
    this.stripe = loadStripe(environment.stripePublishableKey);
  }
  
  /**
   * Creates a PaymentIntent on the server
   * @param amount The amount to charge in the base currency unit
   * @param currency The currency to use (default: USD)
   * @param metadata Any additional data to store with the payment
   */
  createPaymentIntent(amount: number, currency: string = 'usd', metadata: any = {}): Observable<{clientSecret: string}> {
    return this.http.post<{clientSecret: string}>(
      `${environment.apiUrl}/api/create-payment-intent`,
      { amount, currency, metadata }
    ).pipe(
      catchError(error => throwError(() => new Error(`Error creating payment intent: ${error.message}`)))
    );
  }
  
  /**
   * Initializes the Stripe Elements
   * @param clientSecret The client secret from the PaymentIntent
   */
  async initializeElements(clientSecret: string): Promise<StripeElement> {
    const stripeInstance = await this.stripe;
    if (!stripeInstance) {
      throw new Error('Stripe failed to initialize');
    }
    
    // Create elements instance
    this.elements = stripeInstance.elements({
      clientSecret,
      appearance: {
        theme: 'stripe',
        // Customize appearance as needed
        variables: {
          colorPrimary: '#0570de',
          colorBackground: '#ffffff',
          colorText: '#30313d',
          colorDanger: '#df1b41',
          fontFamily: 'Roboto, Open Sans, Segoe UI, sans-serif',
          borderRadius: '4px'
        }
      }
    });
    
    // Create and return the Payment Element
    const paymentElement = this.elements.create('payment', {
      layout: 'tabs'
    });
    
    return paymentElement;
  }
  
  /**
   * Confirms the payment with Stripe
   * @param redirectUrl The URL to redirect to after payment
   */
  async confirmPayment(redirectUrl: string): Promise<{error?: any}> {
    const stripeInstance = await this.stripe;
    if (!stripeInstance || !this.elements) {
      throw new Error('Stripe not properly initialized');
    }
    
    // Trigger form validation and wallet collection
    const { error } = await stripeInstance.confirmPayment({
      elements: this.elements,
      confirmParams: {
        return_url: redirectUrl,
      }
    });
    
    return { error };
  }
  
  /**
   * Retrieves the PaymentIntent after a redirect
   */
  async retrievePaymentIntent(): Promise<{paymentIntent?: any, error?: any}> {
    const stripeInstance = await this.stripe;
    if (!stripeInstance) {
      throw new Error('Stripe not properly initialized');
    }
    
    // Get client secret from URL
    const clientSecret = new URLSearchParams(window.location.search).get('payment_intent_client_secret');
    
    if (!clientSecret) {
      return { error: new Error('No payment intent client secret found in URL') };
    }
    
    return stripeInstance.retrievePaymentIntent(clientSecret);
  }
}