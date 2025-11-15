# WAEC Voucher Purchase System

A simple web application for selling WAEC result checker vouchers with instant delivery via SMS and email after successful Paystack payment.

## Features

- Clean, mobile-friendly purchase form
- Paystack payment integration (Mobile Money: MTN, TELECEL, AIRTEL TIGO, VISA Card)
- Automatic voucher assignment from database
- Instant delivery via SMS and Email
- PostgreSQL database for voucher cards and transactions
- Payment webhook handling for reliable voucher delivery

## Tech Stack

**Frontend:**
- React with TypeScript
- Tailwind CSS + Shadcn UI components
- Wouter for routing
- TanStack Query for data fetching

**Backend:**
- Express.js
- PostgreSQL with Drizzle ORM
- Nodemailer for email (Gmail SMTP)
- Paystack API for payments
- SMS API integration (configurable)

## Database Schema

### voucher_cards
- id (UUID)
- serial (unique text)
- pin (text)
- used (boolean, default false)
- purchaser_phone, purchaser_email, exam_type
- used_at (timestamp)

### transactions
- id (UUID)
- email, phone, exam_type
- amount
- paystack_reference (unique)
- status (pending/completed/failed)
- voucher_card_id (reference to voucher_cards)
- created_at, completed_at (timestamps)

## Environment Variables Required

The following secrets need to be configured:

- `PAYSTACK_SECRET_KEY` - Your Paystack secret key
- `GMAIL_USER` - Gmail address for sending emails
- `GMAIL_APP_PASSWORD` - Gmail app password (not regular password)
- `SMS_API_KEY` - API key for SMS provider
- `SMS_API_URL` - SMS API endpoint URL
- `SMS_SENDER_ID` - Sender ID for SMS (default: "WAEC")
- `BASE_URL` - Base URL of your application (for Paystack callbacks)

## Setup Instructions

1. **Add voucher cards to database manually:**
   
   Use the database tool to insert voucher cards:
   ```sql
   INSERT INTO voucher_cards (serial, pin) VALUES
   ('2024-WAEC-1001', '1234-5678-9012'),
   ('2024-WAEC-1002', '2345-6789-0123'),
   ('2024-WAEC-1003', '3456-7890-1234');
   ```

2. **Configure Paystack webhook:**
   
   In your Paystack dashboard, set webhook URL to:
   `https://your-domain.repl.co/api/webhook/paystack`

3. **Test the flow:**
   - Fill purchase form
   - Complete Paystack payment (test mode)
   - Check SMS and Email delivery
   - Verify voucher status in database

## API Endpoints

- `POST /api/purchase/initialize` - Initialize payment and create transaction
- `GET /api/payment/verify/:reference` - Verify payment and assign voucher
- `POST /api/webhook/paystack` - Paystack webhook for payment notifications

## Payment Flow

1. User fills form (email, phone, exam type)
2. Backend checks voucher availability
3. Creates transaction record
4. Initializes Paystack payment
5. User completes payment via Paystack
6. Paystack redirects to callback or triggers webhook
7. Backend verifies payment
8. Assigns available voucher to user
9. Sends voucher via SMS and Email
10. Updates transaction and voucher status

## SMS Provider Configuration

The application is configured to work with any SMS API that accepts:
- Bearer token authentication
- JSON payload with sender, recipient, message fields

Adjust `server/services/notifications.ts` if your SMS provider uses different parameters.

## Admin Tasks

Since there's no admin interface, voucher management is done via database:

**Check available vouchers:**
```sql
SELECT COUNT(*) FROM voucher_cards WHERE used = false;
```

**View recent transactions:**
```sql
SELECT * FROM transactions ORDER BY created_at DESC LIMIT 10;
```

**Add new vouchers:**
```sql
INSERT INTO voucher_cards (serial, pin) VALUES ('SERIAL', 'PIN');
```

## Current State

- Frontend design completed with all components
- Database schema created and migrated
- Backend API routes implemented
- Paystack payment integration ready
- SMS and Email notification services configured
- Payment callback handling implemented

**Next Steps:**
- Add required API keys (Paystack, Gmail, SMS)
- Add voucher cards to database
- Test end-to-end payment flow
- Configure Paystack webhook
