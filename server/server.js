// server.js
require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
const helmet = require('helmet');
const app = express();

// Security middleware
app.use(helmet()); // Sets various HTTP headers for security
app.use(express.json()); // Parse JSON request bodies

// Configure CORS to only allow requests from your Angular app
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

app.get('/test' , async(req,res)=>{
  res.send(200).json({"message":"success"})
})

// Create a PaymentIntent
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    // Validate the request
    const { amount, currency = 'usd', metadata = {} } = req.body;
    
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata, // Store order details for reference
      automatic_payment_methods: {
        enabled: true,
      },
    });
    
    // Return only the client secret to the frontend
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Webhook to handle Stripe events
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature'];
  
  try {
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    // Handle specific events
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        // Handle successful payment (e.g., update order status in database)
        await handleSuccessfulPayment(paymentIntent);
        break;
      case 'payment_intent.payment_failed':
        // Handle failed payment
        break;
      // Handle other events as needed
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

// Helper function to process successful payments
async function handleSuccessfulPayment(paymentIntent) {
  // Implement your business logic:
  // 1. Update order status in your database
  // 2. Send confirmation email
  // 3. Trigger fulfillment process
  console.log('Processing payment:', paymentIntent.id);
  
  // Example: update order in database
  // await db.orders.update(
  //   { stripePaymentId: paymentIntent.id },
  //   { status: 'paid', updatedAt: new Date() }
  // );
}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});