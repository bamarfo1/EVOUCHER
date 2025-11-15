# AllTekSE e-Voucher Platform - Design Guidelines

## Design Approach: Premium Utility with Visual Impact
Reference-based approach drawing from modern fintech/edtech platforms (Stripe, Coinbase, Duolingo) - combining bold visual appeal with conversion-focused simplicity. Target: Ghanaian students and parents who expect a premium, trustworthy payment experience.

## Color Strategy
**Primary Gradient**: Deep blue to vibrant purple (rgb(37, 99, 235) to rgb(139, 92, 246))
**Accent**: Teal highlights (rgb(20, 184, 166))
**Success**: Emerald green for confirmations
**Backgrounds**: Rich gradient overlays, white cards with strong shadows
**Text**: Dark slate for headers, gray-700 for body

## Layout System
**Spacing Primitives**: Tailwind units of 4, 6, 8, 12, 16
- Mobile-first, single-column centered with max-w-2xl container
- Generous vertical rhythm (py-16 sections on desktop, py-12 mobile)
- Deep shadows on cards (shadow-2xl) for premium depth
- Layered design: gradient backgrounds with floating white cards

## Typography Hierarchy
**Font Stack**: Plus Jakarta Sans or DM Sans via Google Fonts CDN (modern, friendly)
- Hero Title: text-4xl md:text-5xl font-bold
- Section Headers: text-2xl md:text-3xl font-bold
- Price Display: text-5xl font-extrabold with gradient text effect
- Form Labels: text-sm font-semibold uppercase tracking-wide
- Body: text-base leading-relaxed
- Helper Text: text-sm

## Hero Section
**Full-width gradient background** with confident student imagery
- Height: 60vh on desktop, 50vh mobile
- Gradient overlay: Linear from primary blue to purple (60% opacity)
- Centered content: Logo, bold headline ("Get Your WAEC Voucher Instantly"), supporting text, primary CTA
- CTA button with backdrop-blur-md glass effect
- Floating badge: "Trusted by 50,000+ Students" with icon

## Core Sections

**Trust Bar**: Below hero, full-width gradient strip
- Three-column grid: "Instant Delivery" | "Secure Payment" | "24/7 Support"
- Icons with short text, centered alignment

**Purchase Card**: Main conversion component
- White background, rounded-2xl, shadow-2xl with subtle border
- Padding: p-8 md:p-12
- Inner gradient accent bar at top (h-1.5, full gradient)
- Form fields with enhanced styling: rounded-xl, border-2, focus:ring-4 with primary color
- Input height: h-14 for premium feel
- Dropdown with custom styling, phone input with Ghana flag icon
- Price callout: Large gradient text with "Only" prefix, "Per Voucher" suffix

**Payment CTA Section**: Within card
- Two-column layout: Price breakdown (left) | CTA button (right) on desktop
- Single column stacked on mobile
- Button: Full-width, h-14, rounded-xl, gradient background, white text, shadow-lg
- Paystack logo integration with "Secured by" text
- Money-back guarantee badge below

**How It Works**: Three-step process
- Three-column grid with numbered gradient circles
- Step titles and brief descriptions
- Icons from Heroicons (shopping-cart, credit-card, envelope)

**FAQ Section**: Accordion-style
- 4-5 common questions in expandable cards
- Each card: white background, rounded-lg, subtle shadow on hover
- Questions in bold, answers in regular weight

**Footer**: Rich footer with gradient background
- Two-column grid: Company info + Quick links | Contact details
- Social media icons, support email/phone
- Powered by Paystack badge with logo

## Component Styling Patterns
**Cards**: All cards use rounded-2xl, white backgrounds, shadow-2xl, hover:shadow-3xl transition
**Buttons**: Primary = gradient, Secondary = white with gradient border, text-base font-semibold
**Form Inputs**: border-2 default, focus:border-primary, focus:ring-4 ring-primary/20
**Icons**: Heroicons, size-6 for inline, size-10 for features
**Badges**: Rounded-full, gradient backgrounds with white text, px-4 py-2

## Images

**Hero Image**: Professional photo of confident Ghanaian student with laptop/books in modern study environment. Warm, aspirational lighting. Image should convey success and educational achievement. Overlay with 60% opacity gradient (blue to purple).

**Trust Section Icons**: Use Heroicons for lightning-bolt (instant), shield-check (secure), chat-bubble (support)

**Success Confirmation**: Celebratory illustration or icon of checkmark with confetti effect

## Mobile Optimization
- Hero reduced to 50vh
- Trust bar stacks to single column
- Purchase card maintains full-width with p-6
- Form elements remain full-width
- FAQ cards stack naturally
- Footer converts to single column

## Animations
Minimal, purposeful motion only:
- Hero CTA: subtle pulse effect
- Cards: gentle hover lift (translate-y-1)
- Form focus: smooth ring expansion
- Success state: checkmark draw animation

## Success State
Full-page modal or dedicated page with:
- Large gradient checkmark icon
- "Voucher Delivered!" headline
- Voucher details in styled card (PIN, serial, exam type)
- Instructions to check SMS/email
- Download receipt button
- Return to home CTA

**Visual Principle**: Every element reinforces premium quality and trustworthiness through bold gradients, generous spacing, and confident typography while maintaining clarity for the purchase flow.