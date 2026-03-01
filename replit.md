# AllTekSE e-Voucher

## Overview

AllTekSE e-Voucher is a professional platform designed for purchasing voucher cards (WAEC result checkers and more). It offers instant delivery of vouchers via SMS and email upon successful payment through Paystack. The system supports dynamic card types — any new card type added to the database automatically appears as a purchasable product card on the frontend. Key capabilities include a robust voucher retrieval system, comprehensive mobile optimization, and support for unlimited card types.

## User Preferences

I prefer iterative development, with a focus on clear, concise code. Please ask before making major architectural changes or introducing new dependencies. I value detailed explanations for complex implementations but prefer simple language for routine updates.

## System Architecture

### UI/UX Decisions
The platform features a vibrant, modern UI with a purple/blue/teal gradient theme. A hero banner with student celebration imagery, motivational messaging, and glassmorphism trust badges (`Instant Delivery`, `100% Secure`, `Trusted by Thousands`) forms the central visual. It incorporates dual logo branding (AllTekSE and WAEC) in a glassmorphism header. A consistent gradient design system is applied across all elements, complemented by glassmorphism effects for a premium feel.

**Product Cards**: Each voucher card type is displayed as a visual product card with unique color scheme, stock count, price (GHC 20), and optional portal URL. Users click a card to select it, which reveals the purchase form. Card types are loaded dynamically from the database via `/api/card-types`.

Payment provider and university portal cards utilize unique accent colors. The design is fully responsive and mobile-optimized.

### Technical Implementations
- **Dynamic Card Types**: Card types are not hardcoded — they are derived from distinct `exam_type` values in the `voucher_cards` table. Adding cards with a new `exam_type` to the database automatically creates a new product card on the frontend.
- **Purchase Options**: Supports purchases with only a phone number (SMS delivery) or both email and phone. The system handles cases without email by generating a placeholder email (`{phone}@noemail.alltekse.com`) for Paystack and skipping email notifications.
- **Voucher Retrieval**: Allows users to recover lost vouchers using their phone number and purchase date, with robust phone number normalization and secure SQL-level filtering. Retrieval details are displayed on the web interface only.
- **Portal URLs**: Known card types (BECE, WASSCE) have specific portal URLs in notifications. Other card types get generic messages without portal links.
- **Payment Flow**: Users select a card type, fill in their details, the system checks voucher availability, creates a transaction, initializes Paystack payment, verifies payment, assigns a matching voucher, and sends it via SMS and email.
- **Security Features**: Includes Paystack webhook signature verification (HMAC-SHA512), payment amount validation (GHC 20), atomic status transitions, atomic voucher assignment with row-level locking, error recovery with rollback handling, and concurrency protection to prevent double voucher distribution.

### System Design Choices
- **Frontend**: React with TypeScript, Tailwind CSS with Shadcn UI components, Wouter for routing, and TanStack Query for data fetching.
- **Backend**: Express.js, PostgreSQL with Drizzle ORM, Nodemailer for email, Paystack API for payments, and BulkSMS Ghana for SMS delivery.
- **Database Schema**:
    - `voucher_cards`: `id` (UUID), `serial` (unique text), `pin` (text), `used` (boolean), `purchaser_phone`, `purchaser_email`, `exam_type`, `price` (integer, default 20 GHC), `image_url` (text, nullable), `used_at` (timestamp). The `exam_type` field determines the card type and can be any string value. The `price` field sets the price per voucher in GHC. The `image_url` field is an optional URL to a product image displayed on the card.
    - `transactions`: `id` (UUID), `email` (nullable), `phone`, `exam_type`, `amount`, `paystack_reference` (unique), `status` (pending/completed/failed), `voucher_card_id`, `created_at`, `completed_at` (timestamps).
- **API Endpoints**:
    - `GET /api/card-types` — Returns available card types with stock counts and prices
    - `POST /api/purchase/initialize`
    - `GET /api/payment/verify/:reference`
    - `POST /api/webhook/paystack`
    - `GET /api/voucher/retrieve?phone={phone}&date={date}`

## Adding New Card Types

To add a new card type, simply insert voucher cards into the database with the desired `exam_type` and optionally a custom `price` (defaults to GHC 20):

```sql
-- Default price (GHC 20), no image
INSERT INTO voucher_cards (serial, pin, exam_type) VALUES
('SERIAL001', '1234-5678-9012', 'NEW_TYPE'),
('SERIAL002', '2345-6789-0123', 'NEW_TYPE');

-- Custom price (GHC 50) with product image
INSERT INTO voucher_cards (serial, pin, exam_type, price, image_url) VALUES
('SERIAL003', '3456-7890-1234', 'PREMIUM_TYPE', 50, 'https://example.com/image.png');
```

The new card type will automatically appear on the frontend as a product card with its price. If `image_url` is provided, the card displays that image; otherwise a gradient placeholder with a card icon is shown. To set an image for existing cards:

```sql
UPDATE voucher_cards SET image_url = 'https://your-image-url.com/image.png' WHERE exam_type = 'BECE';
```

## External Dependencies

- **Payment Gateway**: Paystack (for mobile money and card payments)
- **SMS Delivery**: Nalo Solutions (nalosolutions.com)
- **Email Service**: Namecheap/PrivateEmail SMTP (via Nodemailer)
- **Database**: PostgreSQL
