# AllTekSE e-Voucher

## Overview

AllTekSE e-Voucher is a professional platform designed for purchasing WAEC/WASSCE result checker vouchers. It offers instant delivery of vouchers via SMS and email upon successful payment through Paystack. The project aims to provide a seamless, secure, and user-friendly experience for students and individuals needing WAEC result checking services, with a vision to be a leading provider in the Ghanaian market. Key capabilities include support for both BECE and WASSCE exam types, a robust voucher retrieval system, and comprehensive mobile optimization.

## User Preferences

I prefer iterative development, with a focus on clear, concise code. Please ask before making major architectural changes or introducing new dependencies. I value detailed explanations for complex implementations but prefer simple language for routine updates.

## System Architecture

### UI/UX Decisions
The platform features a vibrant, modern UI with a purple/blue/teal gradient theme. A hero banner with student celebration imagery, motivational messaging, and glassmorphism trust badges (`Instant Delivery`, `100% Secure`, `Trusted by Thousands`) forms the central visual. It incorporates dual logo branding (AllTekSE and WAEC) in a glassmorphism header. A consistent gradient design system is applied across all elements, complemented by glassmorphism effects for a premium feel. Payment provider and university portal cards utilize unique accent colors. The design is fully responsive and mobile-optimized, adjusting banner heights, text sizes, and spacing for optimal viewing on smaller devices. Progressive disclosure is used for the purchase form, revealing it only after a "Click Here to Buy" button is activated.

### Technical Implementations
- **Purchase Options**: Supports purchases with only a phone number (SMS delivery) or both email and phone. The system handles cases without email by generating a placeholder email (`{phone}@noemail.alltekse.com`) for Paystack and skipping email notifications.
- **Voucher Retrieval**: Allows users to recover lost vouchers using their phone number and purchase date, with robust phone number normalization and secure SQL-level filtering. Retrieval details are displayed on the web interface only.
- **Exam Type Support**: Differentiates between BECE and WASSCE exam types, ensuring users receive the correct voucher type with specific portal URLs in notifications. Each exam type has independent stock tracking.
- **Payment Flow**: Users fill a form, the system checks voucher availability for the selected exam type, creates a transaction, initializes Paystack payment, verifies payment, assigns an exam-type-matching voucher, and sends it via SMS and email.
- **Security Features**: Includes Paystack webhook signature verification (HMAC-SHA512), payment amount validation (GHC 20), atomic status transitions, atomic voucher assignment with row-level locking, error recovery with rollback handling, and concurrency protection to prevent double voucher distribution.

### Feature Specifications
- **Instant Delivery Messaging**: Clear communication regarding automatic voucher delivery.
- **Form Filling Services**: Contact information for university application assistance.
- **Shop Location**: Details provided for physical shop location in Kumasi.
- **Strategic Button Placement**: "Pay Now" button appears after form fields for improved user flow.

### System Design Choices
- **Frontend**: React with TypeScript, Tailwind CSS with Shadcn UI components, Wouter for routing, and TanStack Query for data fetching.
- **Backend**: Express.js, PostgreSQL with Drizzle ORM, Nodemailer for email, Paystack API for payments, and BulkSMS Ghana for SMS delivery.
- **Database Schema**:
    - `voucher_cards`: `id` (UUID), `serial` (unique text), `pin` (text), `used` (boolean), `purchaser_phone`, `purchaser_email`, `exam_type`, `used_at` (timestamp). Exam type is crucial for voucher assignment.
    - `transactions`: `id` (UUID), `email` (nullable), `phone`, `exam_type`, `amount`, `paystack_reference` (unique), `status` (pending/completed/failed), `voucher_card_id`, `created_at`, `completed_at` (timestamps).
- **API Endpoints**:
    - `POST /api/purchase/initialize`
    - `GET /api/payment/verify/:reference`
    - `POST /api/webhook/paystack`
    - `GET /api/voucher/retrieve?phone={phone}&date={date}`

## External Dependencies

- **Payment Gateway**: Paystack (for mobile money and card payments)
- **SMS Delivery**: BulkSMS Ghana
- **Email Service**: Namecheap/PrivateEmail SMTP (via Nodemailer)
- **Database**: PostgreSQL