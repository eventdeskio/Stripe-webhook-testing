
// src/app/components/payment/payment.component.ts
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StripeService } from '../../services/stripe.service';
import { StripeElement } from '@stripe/stripe-js';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payments',
  imports: [FormsModule,CommonModule,ReactiveFormsModule],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss'
})
export class PaymentsComponent implements OnInit, AfterViewInit, OnDestroy  {
  @ViewChild('paymentElement') paymentElement!: ElementRef;
  
  paymentForm: FormGroup;
  loading = false;
  error: string | null = null;
  success = false;
  stripeElement: StripeElement | null = null;
  
  constructor(
    private fb: FormBuilder,
    private stripeService: StripeService,
    public router: Router
  ) {
    this.paymentForm = this.fb.group({
      amount: [100, [Validators.required, Validators.min(1)]],
      // Add other form fields as needed
    });
  }
  
  ngOnInit(): void {
    // Check if returning from a redirect
    this.checkPaymentStatus();
  }
  
  ngAfterViewInit(): void {
    // Intentionally empty - we'll initialize Stripe when user clicks "Pay"
  }
  
  ngOnDestroy(): void {
    // Cleanup if needed
    if (this.stripeElement) {
      this.stripeElement.unmount();
    }
  }
  
  async checkPaymentStatus(): Promise<void> {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('payment_intent_client_secret')) {
        this.loading = true;
        const { paymentIntent, error } = await this.stripeService.retrievePaymentIntent();
        
        if (error) {
          this.error = error.message;
        } else if (paymentIntent) {
          if (paymentIntent.status === 'succeeded') {
            this.success = true;
          } else if (paymentIntent.status === 'processing') {
            this.success = true; // Consider this a success with a processing message
          } else {
            this.error = 'Payment failed. Please try again.';
          }
        }
        this.loading = false;
      }
    } catch (err: any) {
      this.error = err.message;
      this.loading = false;
    }
  }
  
  async initializePayment(): Promise<void> {
    try {
      if (this.paymentForm.invalid) {
        return;
      }
      
      this.loading = true;
      this.error = null;
      
      // Get form values
      const amount = this.paymentForm.get('amount')!.value;
      
      // Create PaymentIntent on server
      const response = await this.stripeService.createPaymentIntent(
        amount,
        'usd',
        { orderId: 'demo-' + Date.now() }
      ).toPromise();
      
      const clientSecret:any = response?.clientSecret; 
      
      // Initialize Stripe Elements
      this.stripeElement = await this.stripeService.initializeElements(clientSecret);
      this.stripeElement.mount(this.paymentElement.nativeElement);
      
      this.loading = false;
    } catch (err: any) {
      this.error = err.message;
      this.loading = false;
    }
  }
  
  async submitPayment(): Promise<void> {
    try {
      if (this.paymentForm.invalid || !this.stripeElement) {
        return;
      }
      
      this.loading = true;
      this.error = null;
      
      // Build the return URL (current URL with extra info if needed)
      const returnUrl = `${window.location.origin}${this.router.url}`;
      
      // Confirm the payment
      const { error } = await this.stripeService.confirmPayment(returnUrl);
      
      if (error) {
        // Payment failed
        this.error = error.message;
        this.loading = false;
      }
      // If successful, the user will be redirected away from this page
      
    } catch (err: any) {
      this.error = err.message;
      this.loading = false;
    }
  }
}
