# BrightGrillzz Website - Quick Start Guide

## 🚀 Running the Website

### Development Mode
```bash
cd /home/hacker/Documents/grill-businesses/BrightGrillzz/brightgrillzz
npm run dev
# Visit: http://localhost:3000
```

### Production Build
```bash
npm run build
npm start
```

---

## 🎨 Key Customization Points

### 1. Business Information
**File**: `lib/contact.ts`

```typescript
export const CONTACT = {
  phone: '+234 818 107 0919',           // Your phone number
  address: '5 Madiana Close, Wuse 2',   // Your address
  whatsapp: 'https://wa.me/2348181070919',  // WhatsApp link
  instagram: 'https://www.instagram.com/brightgrillzz/',
  facebook: 'https://web.facebook.com/Brightgrillzz',
}
```

### 2. Menu & Dishes
**File**: `lib/contact.ts`

```typescript
export const FEATURED_DISHES = [
  {
    id: 1,
    name: 'Royal Platter',
    description: 'Premium selection...',
    price: '₦18,000 - ₦25,000',
    category: 'Signature',
    badge: 'BESTSELLER',
  },
  // Add more dishes here
]
```

### 3. Brand Colors
**File**: `app/globals.css`

```css
@theme {
  --color-primary: #001a4d;      /* Navy Blue - Change this */
  --color-secondary: #c41e3a;    /* Burgundy Red - Change this */
  --color-background: #ffffff;
  --color-foreground: #1a1a2e;
}
```

### 4. Customer Reviews
**File**: `lib/contact.ts`

```typescript
export const REVIEWS = [
  {
    id: 1,
    author: 'T.C.B.O (Tobz)',
    comment: 'Best barbecued proteins...',
    rating: 5,
  },
  // Add more reviews
]
```

---

## 📄 Page Content

### Homepage - Hero Section
**File**: `app/page.tsx` (lines 30-85)
- Edit: Heading, subheading, badge text

### Featured Dishes
**File**: `app/page.tsx` (lines 180-220)
- Edit: Dish titles, descriptions, prices

### Customer Reviews
**File**: `app/page.tsx` (lines 310-360)
- Update review data in `lib/contact.ts`

### About Section
**File**: `app/page.tsx` (lines 365-420)
- Edit: Benefits, unique selling points

---

## 🔗 Important Links

### Replace These
- `CONTACT.whatsapp` - Your WhatsApp link
- `CONTACT.phone` - Your phone number
- `CONTACT.address` - Your restaurant address
- `CONTACT.instagram` - Your Instagram URL
- `CONTACT.facebook` - Your Facebook URL

### Used In
- Navbar CTA button
- Mobile navigation
- Footer
- All "Order Now" buttons
- Contact page

---

## 📱 Mobile Menu

**File**: `components/layout/MobileNav.tsx`

Shows on screens < 768px width:
- Navigation links
- Contact information
- Social links
- CTA buttons

---

## 🖼️ Add Images

### Hero Background
**File**: `app/page.tsx` line 36-38
```jsx
<div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl -z-10" />
```

### Dish Images in Menu & Gallery
- Replace Flame icons with `<Image>` components
- Add images to `/public` folder
- Update component imports

### Example:
```jsx
import Image from 'next/image'

<Image
  src="/images/grilled-fish.jpg"
  alt="Grilled Tilapia Fish"
  width={400}
  height={300}
/>
```

---

## 💬 Form Integration

### Contact Form
**File**: `app/contact/page.tsx`

Currently sends to WhatsApp. To add email:

```typescript
// Add email service (SendGrid, Nodemailer, Resend, etc.)
const response = await fetch('/api/send-email', {
  method: 'POST',
  body: JSON.stringify(formData)
})
```

### Create API Route
**New File**: `app/api/send-email/route.ts`

```typescript
export async function POST(req: Request) {
  const data = await req.json()
  // Send email logic here
  return Response.json({ success: true })
}
```

---

## 🎯 Conversion Optimization

### Add More CTAs
- Edit Button text in component files
- Add more "Order Now" buttons
- Customize CTA colors and sizes

### Improve Reviews Section
- Add more customer testimonials
- Update ratings
- Add customer names and roles

### Enhance Trust Signals
- Add certifications/badges
- Update rating display
- Add review count

---

## 🔍 SEO Updates

**File**: `app/layout.tsx`

```typescript
export const metadata: Metadata = {
  title: "Your New Title - BrightGrillzz",
  description: "Your new description here",
}
```

Update:
- Page title
- Meta description
- Keywords (add to metadata)
- Open Graph tags

---

## 🧪 Testing Checklist

- [ ] Test all navigation links
- [ ] Test WhatsApp integration (click "Order Now")
- [ ] Test phone links (click phone numbers)
- [ ] Test mobile menu on small screens
- [ ] Test form submission
- [ ] Test reservation date/time picker
- [ ] Check animations load smoothly
- [ ] Verify images load correctly
- [ ] Test footer links
- [ ] Test social media links

---

## 📊 Analytics Integration

### Google Analytics
Add to `app/layout.tsx`:

```typescript
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout() {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

---

## 🚀 Deployment Checklist

Before going live:

1. **Update Business Data**
   - [ ] Phone number
   - [ ] Address
   - [ ] Social media links
   - [ ] Hours/availability

2. **Add Images**
   - [ ] Hero background
   - [ ] Dish photos
   - [ ] Gallery images
   - [ ] Logo (if different)

3. **Customize Colors**
   - [ ] Brand primary color
   - [ ] Brand secondary color
   - [ ] Adjust other colors if needed

4. **Test Everything**
   - [ ] All links work
   - [ ] WhatsApp integration works
   - [ ] Forms submit correctly
   - [ ] Mobile experience is perfect

5. **SEO**
   - [ ] Update meta tags
   - [ ] Add Google Analytics
   - [ ] Test with Google Mobile-Friendly Test
   - [ ] Submit sitemap to Google

6. **Performance**
   - [ ] Run Lighthouse audit
   - [ ] Optimize images
   - [ ] Check Core Web Vitals
   - [ ] Minimize CSS/JS

---

## 🆘 Common Issues

### WhatsApp Link Not Working
- Check URL format: `https://wa.me/COUNTRY_CODE_NUMBER`
- Example: `https://wa.me/2348181070919`

### Images Not Loading
- Add images to `/public` folder
- Use relative paths: `/images/photo.jpg`
- Check file names (case-sensitive)

### Styling Issues
- Clear Tailwind cache: `rm -rf .next`
- Run build again: `npm run build`
- Check for conflicting CSS classes

### Navigation Not Working
- Verify routes exist in `/app` folder
- Check Link hrefs match file paths
- Test on different screen sizes

---

## 📞 Support

For help with specific updates or customizations, refer to:
- `WEBSITE_DOCS.md` - Full documentation
- Component files - Code examples
- Next.js Docs: https://nextjs.org/docs
- Tailwind Docs: https://tailwindcss.com/docs

---

## 🎉 You're Ready!

Your BrightGrillzz website is production-ready. Make customizations as needed and deploy to your hosting platform.

**Good luck! 🍖🔥**
