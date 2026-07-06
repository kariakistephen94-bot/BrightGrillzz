// Business Contact Information
export const CONTACT = {
  name: 'BrightGrillzz',
  tagline: 'Premium BBQ',
  phone: '+234 818 107 0919',
  phoneShort: '0818 107 0919',
  address: '5 Madiana Close, Wuse 2, Abuja, Nigeria',
  email: 'Brightgrillzzglobal@gmail.com',
  website: 'brightgrillzz.com',
  instagram: 'https://www.instagram.com/brightgrillzz/',
  facebook: 'https://web.facebook.com/Brightgrillzz',
  whatsapp: 'https://wa.me/2348181070919',
  youtube: 'https://www.youtube.com/@brightgrillzzglobal/videos',
  tiktok: 'https://www.tiktok.com/@brightgrillzz',
  maps: 'https://maps.app.goo.gl/j2EAceh2XF4a6ud78',
  hours: 'Open 24/7',
  rating: '4.4',
  reviewCount: '20+',
  coordinates: {
    lat: 9.0765,
    lng: 7.4668,
  },
}

// Helper to build a pre-filled WhatsApp order link for a specific dish
export const orderLink = (dish?: string) =>
  dish
    ? `${CONTACT.whatsapp}?text=${encodeURIComponent(
        `Hi BrightGrillzz! I'd like to order the ${dish}. Please share availability and pricing.`,
      )}`
    : CONTACT.whatsapp

// Key imagery (real grill photography served locally from /public/images)
export const HERO_IMAGE = '/images/hero.jpg'
export const ABOUT_IMAGE = '/images/interior.jpg'
export const DRINKS_IMAGE = '/images/cocktails.jpg'

export interface MenuItem {
  id: number
  name: string
  description: string
  /** Numeric unit price used by the cart / checkout (lower bound of the range). */
  price: number
  /** Human-friendly price range shown on cards. */
  priceLabel: string
  rating: number
  category: string
  image: string
  badge?: string
}

// Featured Dishes (homepage highlights)
export const FEATURED_DISHES: MenuItem[] = [
  {
    id: 1,
    name: 'Royal Platter',
    description: 'A lavish selection of flame-grilled proteins, sides and dips, built to share.',
    price: 18000,
    priceLabel: '₦18,000 – ₦25,000',
    rating: 4.9,
    category: 'Signature',
    image: '/images/royal-platter.jpg',
    badge: 'BESTSELLER',
  },
  {
    id: 2,
    name: 'Grilled Tilapia Fish',
    description: 'Whole fresh fish chargrilled with herbs, lemon butter and house spice.',
    price: 15000,
    priceLabel: '₦15,000 – ₦18,000',
    rating: 4.8,
    category: 'Seafood',
    image: '/images/grilled-fish.jpg',
    badge: 'CELEBRITY PICK',
  },
  {
    id: 3,
    name: 'Carne Asada',
    description: 'Flame-grilled marinated beef, sliced and served over an open fire.',
    price: 16000,
    priceLabel: '₦16,000 – ₦20,000',
    rating: 4.7,
    category: 'Meat',
    image: '/images/carne-asada.jpg',
  },
  {
    id: 4,
    name: 'King Crab',
    description: 'Premium ocean-fresh seafood, grilled and finished with garlic butter.',
    price: 22000,
    priceLabel: '₦22,000 – ₦28,000',
    rating: 5.0,
    category: 'Premium',
    image: '/images/king-crab.jpg',
    badge: 'PREMIUM',
  },
  {
    id: 5,
    name: 'BBQ Ribs',
    description: 'Slow-smoked, fall-off-the-bone ribs glazed in our signature sauce.',
    price: 14000,
    priceLabel: '₦14,000 – ₦17,000',
    rating: 4.8,
    category: 'Barbecue',
    image: '/images/bbq-ribs.jpg',
  },
  {
    id: 6,
    name: 'Skewered Kebab',
    description: 'Tender cuts marinated overnight and grilled over open coals.',
    price: 12000,
    priceLabel: '₦12,000 – ₦15,000',
    rating: 4.6,
    category: 'Kebab',
    image: '/images/kebab.jpg',
  },
]

// Full Menu (shared by the homepage + menu page)
export const FULL_MENU: MenuItem[] = [
  ...FEATURED_DISHES,
  {
    id: 7,
    name: 'Grilled Porchetta',
    description: 'Succulent roasted pork belly with crackling and grilled potatoes.',
    price: 16000,
    priceLabel: '₦16,000 – ₦19,000',
    rating: 4.6,
    category: 'Meat',
    image: '/images/porchetta.jpg',
  },
  {
    id: 8,
    name: 'Flame Burger',
    description: 'Double prime-beef patty, melted cheese and house sauce.',
    price: 8000,
    priceLabel: '₦8,000 – ₦11,000',
    rating: 4.5,
    category: 'Burger',
    image: '/images/burger.jpg',
  },
  {
    id: 9,
    name: 'Vegetable Skewers',
    description: 'Garden-fresh vegetables grilled and tossed in herb dressing.',
    price: 6000,
    priceLabel: '₦6,000 – ₦8,000',
    rating: 4.4,
    category: 'Vegetarian',
    image: '/images/veg-skewers.jpg',
  },
  {
    id: 10,
    name: 'Grilled Prawns',
    description: 'Jumbo prawns flame-grilled with garlic, chilli and lime.',
    price: 20000,
    priceLabel: '₦20,000 – ₦25,000',
    rating: 4.9,
    category: 'Seafood',
    image: '/images/grilled-prawns.jpg',
  },
  {
    id: 11,
    name: 'Beef Tenderloin',
    description: 'Premium cut grilled to your liking with grilled greens.',
    price: 24000,
    priceLabel: '₦24,000 – ₦30,000',
    rating: 5.0,
    category: 'Premium',
    image: '/images/beef-tenderloin.jpg',
    badge: 'PREMIUM',
  },
  {
    id: 12,
    name: 'Chicken Satay',
    description: 'Sticky glazed chicken grilled over coals with a creamy dip.',
    price: 10000,
    priceLabel: '₦10,000 – ₦13,000',
    rating: 4.7,
    category: 'Kebab',
    image: '/images/chicken-satay.jpg',
  },
]

// Gallery (view-only grill photography from public/gallery)
export const GALLERY_ITEMS = [
  { id: 1, image: '/gallery/image1.jpg' },
  { id: 2, image: '/gallery/image2.jpeg' },
  { id: 3, image: '/gallery/image3.jpg' },
  { id: 4, image: '/gallery/image4.jpg' },
  { id: 5, image: '/gallery/image5.jpeg' },
  { id: 6, image: '/gallery/image6.jpg' },
  { id: 7, image: '/gallery/image7.jpg' },
  { id: 8, image: '/gallery/image8.jpg' },
  { id: 9, image: '/gallery/image9.jpg' },
  { id: 10, image: '/gallery/image10.jpg' },
  { id: 11, image: '/gallery/image11.jpeg' },
  { id: 12, image: '/gallery/image12.jpg' },
  { id: 13, image: '/gallery/image13.jpg' },
]

// Menu Categories
export const MENU_CATEGORIES = [
  { id: 1, name: 'Signature Grills', description: 'Our signature flame-grilled specialties', dishes: 5 },
  { id: 2, name: 'Seafood', description: 'Fresh ocean catch, grilled to order', dishes: 4 },
  { id: 3, name: 'Premium Meats', description: 'Premium cuts grilled to perfection', dishes: 6 },
  { id: 4, name: 'Kebabs & Satay', description: 'Skewered and grilled over open coals', dishes: 5 },
  { id: 5, name: 'Sides & Compliments', description: 'The perfect partners to your grill', dishes: 8 },
  { id: 6, name: 'Beverages', description: 'Premium drinks, cocktails and wines', dishes: 12 },
]

// Statistics
export const STATS = [
  { value: '4.4★', label: 'Google Rating' },
  { value: '20+', label: 'Customer Reviews' },
  { value: '24/7', label: 'Always Open' },
  { value: 'A-List', label: 'Clientele' },
]

// Reviews (sourced from Google, verified guests only)
export const REVIEWS = [
  {
    id: 1,
    author: 'T.C.B.O (Tobz)',
    role: 'Local Guide · 131 reviews',
    comment:
      'Looking for the best barbecued proteins? BrightGrillz is your plug; the taste buds of King Mo Adah, Davido, E-money, Obi-Cubana and more also agree!',
    rating: 5,
  },
  {
    id: 2,
    author: 'Naf2 Isa',
    role: 'Local Guide · 91 reviews',
    comment: 'Nice chicken. Premium quality with perfect seasoning, every bite is worth it.',
    rating: 5,
  },
  {
    id: 3,
    author: 'yahaya james',
    role: 'Verified Guest',
    comment: 'The best place to be, everything is readily available. Excellent service and amazing food!',
    rating: 5,
  },
  {
    id: 4,
    author: 'Omar Shamsudeen',
    role: 'Local Guide · 15 reviews',
    comment: 'Tasty grill with amazing flavours. Worth every naira, highly recommended!',
    rating: 5,
  },
  {
    id: 5,
    author: 'Okoro Mary',
    role: 'Local Guide · 3 reviews',
    comment: 'Nice place to visit with friends and family. Great food, great service!',
    rating: 5,
  },
  {
    id: 6,
    author: 'Joseph Roberts',
    role: 'Local Guide · 168 reviews',
    comment: 'Awesome experience from start to finish. Food and service both top notch.',
    rating: 5,
  },
]

// Service Features
export const SERVICE_FEATURES = [
  { id: 1, icon: 'Utensils', title: 'Dine In', description: 'Comfortable seating for every occasion' },
  { id: 2, icon: 'TrendingUp', title: 'Drive Through', description: 'Quick, convenient grab-and-go service' },
  { id: 3, icon: 'Truck', title: 'Delivery', description: 'Fast, no-contact delivery available' },
  { id: 4, icon: 'Clock', title: 'Open 24/7', description: 'Always ready to serve you' },
]

// Navigation Links
export const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/menu', label: 'Menu' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/contact', label: 'Contact' },
]
