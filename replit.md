# AllTekSE e-Voucher

A professional WAEC/WASSCE result checker voucher purchase system with instant delivery via SMS and email after successful Paystack payment.

**Platform Branding:**
- Name: AllTekSE e-Voucher
- Tagline: WAEC Result Checker Platform
- Contact Email: support@alltekse.com (changed from info@)
- WhatsApp Support: 0593260440
- Shop Location: Tech Junction, Kumasi
- Form Filling Services: Available - Contact 0593260440
- Production URL: https://waec-checker-hub-bmarfo422.replit.app

## Features

### Visual Design
- **Vibrant Modern UI** with purple/blue/teal gradient theme throughout
- **Hero Banner**: Inspiring student celebration image with gradient overlay, motivational messaging, and glassmorphism trust badges (Instant Delivery, 100% Secure, Trusted by Thousands)
- **Dual Logo Branding**: AllTekSE logo (on black background) + WAEC logo in glassmorphism header
- **Gradient Design System**: Consistent purple → blue → teal gradients across all elements (headers, cards, buttons, icons)
- **Glassmorphism Effects**: Backdrop blur effects on header and hero badges for modern premium feel
- **Colorful Payment Cards**: Each payment provider has unique accent color (MTN purple, Telecel blue, AirtelTigo teal, Visa indigo)
- **University Portal Links**: Colorful cards with unique accents for 6 Ghana universities (UG purple, KNUST blue, UCC teal, UPSA indigo, Central pink, Ashesi amber)
- **Mobile-Optimized**: Fully responsive with tailored sizing for mobile devices (reduced banner height, smaller text, optimized spacing)

### Functionality
- **Progressive Disclosure UX**: "Click Here to Buy" button reveals form on click to reduce visual clutter
- **Instant Delivery Messaging**: Clear communication about automatic voucher delivery
- **Form Filling Services**: Contact info for university application assistance (0593260440)
- **Shop Location**: Tech Junction, Kumasi with full contact details and gradient icons
- Clean, mobile-responsive purchase form with icon-enhanced inputs
- **Strategic Button Placement**: "Pay Now" button appears after form fields for better user flow
- Paystack payment integration (MTN MoMo, Telecel Cash, AirtelTigo Money, Visa Card)
- Automatic voucher assignment from database
- Instant delivery via SMS (BulkSMS Ghana) and Email (Namecheap SMTP)
- PostgreSQL database for voucher cards and transactions
- Payment webhook handling for reliable voucher delivery
- Contact information displayed on all pages (email & WhatsApp)

## Tech Stack

**Frontend:**
- React with TypeScript
- Tailwind CSS + Shadcn UI components
- Wouter for routing
- TanStack Query for data fetching

**Backend:**
- Express.js
- PostgreSQL with Drizzle ORM
- Nodemailer for email (Namecheap/PrivateEmail SMTP)
- Paystack API for payments
- BulkSMS Ghana for SMS delivery

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

The following secrets are configured with custom names:

**Payment Integration:**
- `PAYSTACKSECRETKEYbright` - Paystack secret key (configured)
- `PAYSTACKPUBLICKEYbright` - Paystack public key (configured)

**Email Configuration:**
- `EMAILUSER` - Email address for sending vouchers (info@alltekse.com)
- `EMAILPASSWORD` - Email password for Namecheap/PrivateEmail SMTP
- `EMAIL_HOST` - SMTP host (default: mail.privateemail.com)
- `EMAIL_PORT` - SMTP port (default: 587)

**SMS Configuration:**
- `SMSAPI` - BulkSMS Ghana API key (configured)
- `SMS_API_URL` - SMS API endpoint (default: http://clientlogin.bulksmsgh.com/smsapi)
- `SMS_SENDER_ID` - Sender ID for SMS (default: "ALLTEK")

**Application:**
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

The application uses **BulkSMS Ghana** (bulksmsghana.com) for SMS delivery:
- Endpoint: `http://clientlogin.bulksmsgh.com/smsapi`
- Authentication: API key passed as URL parameter
- Response format: JSON with code 1000 for success
- Sender ID: "ALLTEK" (configurable via SMS_SENDER_ID)

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

## Security Features

The application includes multiple layers of security:

1. **Webhook Signature Verification**: All Paystack webhook requests are verified using HMAC-SHA512 signature validation against the raw request body to prevent unauthorized voucher distribution
2. **Payment Amount Validation**: Both verification endpoint and webhook validate that the payment amount matches the expected GHC 20 before assigning vouchers
3. **Atomic Status Transitions**: Conditional database updates (WHERE status='pending') ensure only one process can claim a transaction for processing
4. **Atomic Voucher Assignment**: Database transactions with row-level locking (FOR UPDATE) wrap voucher selection, marking, and transaction completion to prevent partial failures
5. **Error Recovery**: Proper rollback handling ensures transactions in "processing" state are reverted to "failed" on errors, allowing retry
6. **Concurrency Protection**: Combined atomic status transitions and transactional voucher assignment prevent double voucher distribution even when webhook and callback execute simultaneously

## Design System

**Color Palette:**
- Primary Gradient: Purple (262°) → Blue (217°) → Teal (173°)
- Purple shades: 50-900 for backgrounds, borders, text
- Blue shades: 50-900 for accents and cards
- Teal shades: 50-900 for highlights
- Supporting colors: Indigo, Pink, Amber for variety

**Mobile Responsiveness:**
All elements have mobile-optimized sizing with Tailwind breakpoint (md:):
- Hero banner: h-48 mobile → h-72 desktop (192px → 288px)
- Text sizes: text-2xl mobile → text-4xl desktop for headings
- Price display: text-3xl mobile → text-5xl desktop (30px → 48px)
- Buttons: h-12 mobile → h-14 desktop (48px → 56px)
- Icons: w-3 h-3 mobile → w-4 h-4 desktop for badges
- Padding/spacing: Reduced 25-33% on mobile across all components
- Payment logos: h-8 mobile → h-10 desktop (32px → 40px)

**Component Patterns:**
- Gradient backgrounds on cards, buttons, and badges
- Glassmorphism (backdrop-blur) on header and hero badges
- Colorful borders (border-2) with matching theme colors
- Enhanced shadows (shadow-lg, shadow-2xl) for depth
- Hover elevations using custom Tailwind utilities
- Consistent spacing system (small/medium/large)

**UX Patterns:**
- **Progressive Disclosure**: Initial view shows price + CTA button, form reveals on click
- **Logical Flow**: Price at top → Form fields → Pay button → Payment options (informs user before commitment)
- **Clear Hierarchy**: Price visible first, form fields grouped, payment button before payment logos

## Current State

- ✅ Frontend design completed with vibrant gradient theme and student banner
- ✅ Mobile-optimized responsive design for all screen sizes
- ✅ Database schema created and migrated (vouchers + transactions tables)
- ✅ Backend API routes implemented with security measures
- ✅ Paystack payment integration with proper callback URL
- ✅ SMS (BulkSMS Ghana) and Email (Namecheap SMTP) notification services configured
- ✅ Payment webhook with signature verification
- ✅ Test voucher cards added to database (5 cards)

**Production Ready:**
The application is fully functional with enterprise-grade security and ready for production deployment:

1. ✅ All security measures implemented (webhook signature verification, amount validation, atomic transactions)
2. ✅ Error recovery and rollback handling
3. ✅ Concurrency-safe voucher assignment
4. ✅ Test voucher cards added to database (5 cards)
5. ✅ Email notifications working (Namecheap SMTP)
6. ✅ SMS notifications working (BulkSMS Ghana)

**Current Configuration:**
- Email: info@alltekse.com (EMAILUSER, EMAILPASSWORD configured)
- SMS: BulkSMS Ghana with sender ID "ALLTEK" (SMSAPI configured)
- Payment: Paystack test mode (PAYSTACKSECRETKEYbright, PAYSTACKPUBLICKEYbright)

**Deployment Steps:**
1. Switch Paystack to live mode:
   - Update `PAYSTACKSECRETKEYbright` with live secret key
   - Update `PAYSTACKPUBLICKEYbright` with live public key
2. Set `BASE_URL` to your production Replit domain (e.g., https://your-app.repl.co)
3. Configure Paystack webhook URL: `https://your-domain/api/webhook/paystack`
4. Add production voucher cards to database using SQL INSERT
5. Test complete payment flow
6. Publish the application

**Note on Webhook Signature:**
The raw request body is captured via Express middleware (`verify` callback in `express.json()`) and stored as `req.rawBody`. This ensures accurate HMAC-SHA512 signature validation for Paystack webhooks. If signature validation issues occur in production, verify that the webhook secret key matches your Paystack dashboard settings.
