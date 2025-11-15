# WAEC Voucher Purchase Site - Design Guidelines

## Design Approach: Function-First Simplicity
User explicitly requested simplicity. This is a single-purpose utility page focused on efficient voucher purchase. Design prioritizes clarity, trust, and mobile accessibility for Ghanaian students.

## Layout System
**Spacing Primitives**: Use Tailwind units of 4, 6, and 8 (p-4, gap-6, mb-8)
- Mobile-first approach (most users will be on phones)
- Single-column centered layout with max-w-md container
- Card-based form design with subtle elevation
- Generous padding around form elements for touch targets

## Typography Hierarchy
**Font Stack**: System fonts for fast loading (Inter or similar via Google Fonts CDN)
- Page Title: text-2xl font-bold (WAEC Voucher Purchase)
- Section Headers: text-lg font-semibold 
- Form Labels: text-sm font-medium
- Body Text: text-base
- Helper Text: text-sm text-gray-600
- Price Display: text-3xl font-bold (prominent GHC 20)

## Core Components

**Header**: 
- Simple centered logo/title
- Minimal height (py-4)
- Trust indicator: "Secure Payment via Paystack" badge

**Main Purchase Card**:
- Centered card with rounded corners (rounded-lg)
- White background with subtle shadow
- Padding p-6 on mobile, p-8 on desktop
- Clear visual hierarchy: Title → Form → Price → CTA

**Form Elements**:
- Full-width inputs with consistent spacing (gap-4)
- Labels above inputs (not floating/inline)
- Clear placeholder text
- Phone input with Ghana country code pre-filled (+233)
- Dropdown for exam type (clean, native select)
- Input heights: h-12 for comfortable touch targets

**Payment Section**:
- Prominent price display before CTA
- Single primary CTA button: "Pay GHC 20 - Get Voucher"
- Button: Full width on mobile, w-full, h-12, rounded-lg
- Paystack logo/text below button for trust

**Trust Elements**:
- Security icons (lock, shield) near payment button
- "Voucher sent via SMS & Email instantly" message
- Simple money-back guarantee or support contact

**Footer**:
- Minimal: Support contact, terms link
- Powered by Paystack badge

## Visual Treatment
- Clean white background
- Subtle gray borders for form fields (border-gray-300)
- Primary action color for CTA (choose one bold color - blue or green)
- No hero images (unnecessary for utility page)
- No decorative elements - purely functional
- Icons: Heroicons for form fields (envelope, phone, document icons)

## Mobile Optimization
- Stack everything vertically
- Full-width form elements
- Large touch targets (min 44px height)
- Minimal horizontal scrolling
- Fixed CTA button at bottom on mobile for easy access

## Success State
Simple confirmation message with voucher details displayed prominently after payment, clear instructions to check SMS/Email.

**Images**: No images required for this utility page. Focus is on form clarity and payment trust indicators (Paystack logo is sufficient).