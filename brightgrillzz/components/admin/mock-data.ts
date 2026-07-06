/**
 * Static placeholder data for the admin dashboard. Frontend-only for now, 
 * swap these for live queries when the backend lands.
 */

export const stats = [
  {
    key: 'revenue',
    label: 'Total Revenue',
    value: '₦4.82M',
    delta: 12.4,
    trend: 'up' as const,
    hint: 'vs. last 30 days',
  },
  {
    key: 'orders',
    label: 'Orders',
    value: '1,284',
    delta: 8.1,
    trend: 'up' as const,
    hint: 'vs. last 30 days',
  },
  {
    key: 'aov',
    label: 'Avg. Order Value',
    value: '₦3,750',
    delta: -2.3,
    trend: 'down' as const,
    hint: 'vs. last 30 days',
  },
  {
    key: 'customers',
    label: 'New Customers',
    value: '312',
    delta: 5.6,
    trend: 'up' as const,
    hint: 'vs. last 30 days',
  },
]

// Revenue vs. orders across the last 12 weeks
export const revenueSeries = [
  { period: 'W1', revenue: 240000, orders: 62 },
  { period: 'W2', revenue: 298000, orders: 78 },
  { period: 'W3', revenue: 275000, orders: 71 },
  { period: 'W4', revenue: 331000, orders: 88 },
  { period: 'W5', revenue: 386000, orders: 96 },
  { period: 'W6', revenue: 352000, orders: 90 },
  { period: 'W7', revenue: 421000, orders: 104 },
  { period: 'W8', revenue: 468000, orders: 118 },
  { period: 'W9', revenue: 442000, orders: 112 },
  { period: 'W10', revenue: 515000, orders: 129 },
  { period: 'W11', revenue: 489000, orders: 121 },
  { period: 'W12', revenue: 563000, orders: 141 },
]

// Orders by day of week
export const ordersByDay = [
  { day: 'Mon', orders: 128 },
  { day: 'Tue', orders: 142 },
  { day: 'Wed', orders: 156 },
  { day: 'Thu', orders: 171 },
  { day: 'Fri', orders: 224 },
  { day: 'Sat', orders: 268 },
  { day: 'Sun', orders: 195 },
]

// Sales split by menu category
export const categorySplit = [
  { category: 'Grills & BBQ', value: 46, key: 'grills' },
  { category: 'Seafood', value: 24, key: 'seafood' },
  { category: 'Platters', value: 18, key: 'platters' },
  { category: 'Sides & Drinks', value: 12, key: 'sides' },
]

export const topItems = [
  { name: 'Royal Platter', orders: 312, revenue: '₦1.24M', share: 82 },
  { name: 'Grilled King Crab', orders: 268, revenue: '₦968K', share: 70 },
  { name: 'Carne Asada', orders: 241, revenue: '₦723K', share: 63 },
  { name: 'Whole Grilled Fish', orders: 205, revenue: '₦615K', share: 54 },
  { name: 'Peppered Snails', orders: 154, revenue: '₦462K', share: 40 },
]

export type OrderStatus = 'completed' | 'preparing' | 'pending' | 'cancelled'

export const recentOrders: {
  id: string
  customer: string
  item: string
  amount: string
  status: OrderStatus
  time: string
}[] = [
  { id: '#BG-2043', customer: 'Amaka Obi', item: 'Royal Platter', amount: '₦18,500', status: 'completed', time: '2 min ago' },
  { id: '#BG-2042', customer: 'Tunde Bakare', item: 'Grilled King Crab', amount: '₦12,000', status: 'preparing', time: '11 min ago' },
  { id: '#BG-2041', customer: 'Zainab Musa', item: 'Carne Asada ×2', amount: '₦9,400', status: 'preparing', time: '18 min ago' },
  { id: '#BG-2040', customer: 'Chidi Eze', item: 'Whole Grilled Fish', amount: '₦7,200', status: 'pending', time: '25 min ago' },
  { id: '#BG-2039', customer: 'Fatima Bello', item: 'Peppered Snails', amount: '₦5,800', status: 'completed', time: '39 min ago' },
  { id: '#BG-2038', customer: 'Kunle Adeyemi', item: 'Royal Platter', amount: '₦18,500', status: 'cancelled', time: '52 min ago' },
]

// ---------------------------------------------------------------------------
// Orders page
// ---------------------------------------------------------------------------
export type PaymentChannel = 'paystack' | 'bank_transfer'
export type Fulfillment = 'delivery' | 'pickup'

export interface AdminOrder {
  id: string
  customer: string
  email: string
  phone: string
  items: string
  itemCount: number
  amount: number
  status: OrderStatus
  payment: PaymentChannel
  fulfillment: Fulfillment
  area: string
  placed: string
}

export const orders: AdminOrder[] = [
  { id: 'BG-2043', customer: 'Amaka Obi', email: 'amaka@example.com', phone: '0801 234 5678', items: 'Royal Platter', itemCount: 1, amount: 18500, status: 'preparing', payment: 'paystack', fulfillment: 'delivery', area: 'Wuse 2', placed: 'Jul 4, 7:42 PM' },
  { id: 'BG-2042', customer: 'Tunde Bakare', email: 'tunde@example.com', phone: '0802 345 6789', items: 'Grilled King Crab', itemCount: 1, amount: 12000, status: 'preparing', payment: 'paystack', fulfillment: 'delivery', area: 'Maitama', placed: 'Jul 4, 7:33 PM' },
  { id: 'BG-2041', customer: 'Zainab Musa', email: 'zainab@example.com', phone: '0803 456 7890', items: 'Carne Asada ×2', itemCount: 2, amount: 9400, status: 'pending', payment: 'bank_transfer', fulfillment: 'pickup', area: 'Kitchen pickup', placed: 'Jul 4, 7:26 PM' },
  { id: 'BG-2040', customer: 'Chidi Eze', email: 'chidi@example.com', phone: '0804 567 8901', items: 'Whole Grilled Fish, Jollof', itemCount: 2, amount: 7200, status: 'pending', payment: 'paystack', fulfillment: 'delivery', area: 'Garki', placed: 'Jul 4, 7:19 PM' },
  { id: 'BG-2039', customer: 'Fatima Bello', email: 'fatima@example.com', phone: '0805 678 9012', items: 'Peppered Snails', itemCount: 1, amount: 5800, status: 'completed', payment: 'paystack', fulfillment: 'delivery', area: 'Jabi', placed: 'Jul 4, 6:55 PM' },
  { id: 'BG-2038', customer: 'Kunle Adeyemi', email: 'kunle@example.com', phone: '0806 789 0123', items: 'Royal Platter', itemCount: 1, amount: 18500, status: 'cancelled', payment: 'bank_transfer', fulfillment: 'delivery', area: 'Asokoro', placed: 'Jul 4, 6:41 PM' },
  { id: 'BG-2037', customer: 'Ngozi Okafor', email: 'ngozi@example.com', phone: '0807 890 1234', items: 'BBQ Ribs, Grilled Prawns', itemCount: 2, amount: 34000, status: 'completed', payment: 'paystack', fulfillment: 'delivery', area: 'Wuse 2', placed: 'Jul 4, 5:58 PM' },
  { id: 'BG-2036', customer: 'Ibrahim Sani', email: 'ibrahim@example.com', phone: '0808 901 2345', items: 'Beef Tenderloin', itemCount: 1, amount: 24000, status: 'completed', payment: 'paystack', fulfillment: 'pickup', area: 'Kitchen pickup', placed: 'Jul 4, 5:30 PM' },
  { id: 'BG-2035', customer: 'Blessing Udo', email: 'blessing@example.com', phone: '0809 012 3456', items: 'Flame Burger ×2, Chapman ×2', itemCount: 4, amount: 21000, status: 'completed', payment: 'bank_transfer', fulfillment: 'delivery', area: 'Utako', placed: 'Jul 4, 4:47 PM' },
  { id: 'BG-2034', customer: 'David Mark', email: 'david@example.com', phone: '0810 123 4567', items: 'Skewered Kebab ×3', itemCount: 3, amount: 36000, status: 'completed', payment: 'paystack', fulfillment: 'delivery', area: 'Gwarinpa', placed: 'Jul 4, 3:12 PM' },
  { id: 'BG-2033', customer: 'Halima Yusuf', email: 'halima@example.com', phone: '0811 234 5678', items: 'Chicken Satay, Vegetable Skewers', itemCount: 2, amount: 16000, status: 'completed', payment: 'paystack', fulfillment: 'delivery', area: 'Life Camp', placed: 'Jul 4, 2:05 PM' },
  { id: 'BG-2032', customer: 'Emeka Nwosu', email: 'emeka@example.com', phone: '0812 345 6789', items: 'Grilled Porchetta', itemCount: 1, amount: 16000, status: 'completed', payment: 'bank_transfer', fulfillment: 'pickup', area: 'Kitchen pickup', placed: 'Jul 4, 1:20 PM' },
  { id: 'BG-2031', customer: 'Amaka Obi', email: 'amaka@example.com', phone: '0801 234 5678', items: 'King Crab, Grilled Prawns', itemCount: 2, amount: 42000, status: 'completed', payment: 'paystack', fulfillment: 'delivery', area: 'Wuse 2', placed: 'Jul 3, 8:15 PM' },
  { id: 'BG-2030', customer: 'Segun Ade', email: 'segun@example.com', phone: '0813 456 7890', items: 'Royal Platter ×2', itemCount: 2, amount: 37000, status: 'completed', payment: 'paystack', fulfillment: 'delivery', area: 'Maitama', placed: 'Jul 3, 7:40 PM' },
  { id: 'BG-2029', customer: 'Rita Okon', email: 'rita@example.com', phone: '0814 567 8901', items: 'Whole Grilled Fish', itemCount: 1, amount: 15000, status: 'completed', payment: 'bank_transfer', fulfillment: 'delivery', area: 'Lokogoma', placed: 'Jul 3, 6:22 PM' },
  { id: 'BG-2028', customer: 'Yakubu Danjuma', email: 'yakubu@example.com', phone: '0815 678 9012', items: 'BBQ Ribs', itemCount: 1, amount: 14000, status: 'cancelled', payment: 'paystack', fulfillment: 'delivery', area: 'Kubwa', placed: 'Jul 3, 5:10 PM' },
  { id: 'BG-2027', customer: 'Chidi Eze', email: 'chidi@example.com', phone: '0804 567 8901', items: 'Carne Asada, Chapman', itemCount: 2, amount: 18500, status: 'completed', payment: 'paystack', fulfillment: 'pickup', area: 'Kitchen pickup', placed: 'Jul 3, 2:48 PM' },
  { id: 'BG-2026', customer: 'Grace Effiong', email: 'grace@example.com', phone: '0816 789 0123', items: 'Chicken Satay ×2', itemCount: 2, amount: 20000, status: 'completed', payment: 'bank_transfer', fulfillment: 'delivery', area: 'Apo', placed: 'Jul 3, 1:15 PM' },
]

// ---------------------------------------------------------------------------
// Customers page
// ---------------------------------------------------------------------------
export type Segment = 'vip' | 'returning' | 'new'

export interface AdminCustomer {
  id: string
  name: string
  email: string
  phone: string
  orders: number
  spent: number
  lastOrder: string
  joined: string
  segment: Segment
}

export const customers: AdminCustomer[] = [
  { id: 'c1', name: 'Amaka Obi', email: 'amaka@example.com', phone: '0801 234 5678', orders: 24, spent: 486000, lastOrder: 'Today', joined: 'Jan 2025', segment: 'vip' },
  { id: 'c2', name: 'Ngozi Okafor', email: 'ngozi@example.com', phone: '0807 890 1234', orders: 19, spent: 372500, lastOrder: 'Today', joined: 'Feb 2025', segment: 'vip' },
  { id: 'c3', name: 'Segun Ade', email: 'segun@example.com', phone: '0813 456 7890', orders: 17, spent: 341000, lastOrder: 'Yesterday', joined: 'Feb 2025', segment: 'vip' },
  { id: 'c4', name: 'Tunde Bakare', email: 'tunde@example.com', phone: '0802 345 6789', orders: 12, spent: 198000, lastOrder: 'Today', joined: 'Mar 2025', segment: 'returning' },
  { id: 'c5', name: 'Chidi Eze', email: 'chidi@example.com', phone: '0804 567 8901', orders: 11, spent: 176400, lastOrder: 'Yesterday', joined: 'Mar 2025', segment: 'returning' },
  { id: 'c6', name: 'Blessing Udo', email: 'blessing@example.com', phone: '0809 012 3456', orders: 9, spent: 152000, lastOrder: '2 days ago', joined: 'Apr 2025', segment: 'returning' },
  { id: 'c7', name: 'Ibrahim Sani', email: 'ibrahim@example.com', phone: '0808 901 2345', orders: 8, spent: 143000, lastOrder: 'Today', joined: 'Apr 2025', segment: 'returning' },
  { id: 'c8', name: 'Halima Yusuf', email: 'halima@example.com', phone: '0811 234 5678', orders: 6, spent: 96000, lastOrder: 'Today', joined: 'May 2025', segment: 'returning' },
  { id: 'c9', name: 'David Mark', email: 'david@example.com', phone: '0810 123 4567', orders: 4, spent: 78000, lastOrder: 'Today', joined: 'May 2025', segment: 'returning' },
  { id: 'c10', name: 'Fatima Bello', email: 'fatima@example.com', phone: '0805 678 9012', orders: 2, spent: 24800, lastOrder: 'Today', joined: 'Jun 2025', segment: 'new' },
  { id: 'c11', name: 'Grace Effiong', email: 'grace@example.com', phone: '0816 789 0123', orders: 1, spent: 20000, lastOrder: 'Yesterday', joined: 'Jul 2025', segment: 'new' },
  { id: 'c12', name: 'Zainab Musa', email: 'zainab@example.com', phone: '0803 456 7890', orders: 1, spent: 9400, lastOrder: 'Today', joined: 'Jul 2025', segment: 'new' },
]

// ---------------------------------------------------------------------------
// Analytics page (extra series)
// ---------------------------------------------------------------------------
export const aovTrend = [
  { period: 'W1', aov: 3871 }, { period: 'W2', aov: 3821 }, { period: 'W3', aov: 3873 },
  { period: 'W4', aov: 3761 }, { period: 'W5', aov: 4021 }, { period: 'W6', aov: 3911 },
  { period: 'W7', aov: 4048 }, { period: 'W8', aov: 3966 }, { period: 'W9', aov: 3946 },
  { period: 'W10', aov: 3992 }, { period: 'W11', aov: 4041 }, { period: 'W12', aov: 3993 },
]

export const fulfillmentSplit = [
  { name: 'Delivery', value: 68, key: 'delivery' },
  { name: 'Pickup', value: 32, key: 'pickup' },
]

export const paymentSplit = [
  { name: 'Paystack', value: 74, key: 'paystack' },
  { name: 'Bank transfer', value: 26, key: 'bank' },
]

// ---------------------------------------------------------------------------
// Reviews page
// ---------------------------------------------------------------------------
export interface AdminReview {
  id: string
  author: string
  role: string
  comment: string
  rating: number
  date: string
  source: string
  published: boolean
}

export const adminReviews: AdminReview[] = [
  { id: 'r1', author: 'T.C.B.O (Tobz)', role: 'Local Guide · 131 reviews', comment: 'Looking for the best barbecued proteins? BrightGrillz is your plug; the taste buds of King Mo Adah, Davido, E-money, Obi-Cubana and more also agree!', rating: 5, date: 'Jul 2, 2026', source: 'Google', published: true },
  { id: 'r2', author: 'Naf2 Isa', role: 'Local Guide · 91 reviews', comment: 'Nice chicken. Premium quality with perfect seasoning, every bite is worth it.', rating: 5, date: 'Jun 28, 2026', source: 'Google', published: true },
  { id: 'r3', author: 'yahaya james', role: 'Verified Guest', comment: 'The best place to be, everything is readily available. Excellent service and amazing food!', rating: 5, date: 'Jun 24, 2026', source: 'Google', published: true },
  { id: 'r4', author: 'Omar Shamsudeen', role: 'Local Guide · 15 reviews', comment: 'Tasty grill with amazing flavours. Worth every naira, highly recommended!', rating: 5, date: 'Jun 19, 2026', source: 'Google', published: true },
  { id: 'r5', author: 'Okoro Mary', role: 'Local Guide · 3 reviews', comment: 'Nice place to visit with friends and family. Great food, great service!', rating: 4, date: 'Jun 12, 2026', source: 'Google', published: true },
  { id: 'r6', author: 'Joseph Roberts', role: 'Local Guide · 168 reviews', comment: 'Awesome experience from start to finish. Food and service both top notch.', rating: 5, date: 'Jun 5, 2026', source: 'Google', published: true },
  { id: 'r7', author: 'Aisha Bello', role: 'Verified Guest', comment: 'Delivery took a little longer than expected but the food was hot and delicious when it arrived.', rating: 4, date: 'May 30, 2026', source: 'Website', published: false },
  { id: 'r8', author: 'Peter Obi', role: 'Verified Guest', comment: 'Portions could be a bit bigger for the price, but the flavour is undeniable. Will order again.', rating: 3, date: 'May 22, 2026', source: 'Website', published: false },
]
