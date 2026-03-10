// ─── Enums / Unions ───────────────────────────────────────────────────────────
export type ServiceCategory = 'Construction' | 'Renovation' | 'Interior' | 'Civil'
export type MaterialCategory = 'Aggregate' | 'Binding' | 'Steel' | 'Masonry' | 'Finishing' | 'Plumbing' | 'Other'
export type TransactionType = 'inward' | 'consumed'
export type WeatherCondition = 'Sunny' | 'Cloudy' | 'Rainy' | 'Stormy'
export type ProjectCategory = 'Residential' | 'Commercial' | 'Renovation' | 'Interior' | 'Civil'
export type ProjectStatus = 'planning' | 'ongoing' | 'completed' | 'on-hold'
export type MilestoneStatus = 'pending' | 'in-progress' | 'completed'
export type PaymentStatus = 'pending' | 'paid' | 'failed'
export type EnquiryStatus = 'new' | 'contacted' | 'converted' | 'closed'
export type DocumentType = 'blueprint' | 'estimate' | 'invoice' | 'completion' | 'other'
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected'
export type ExpenseCategory = 'Materials' | 'Labour' | 'Equipment' | 'Subcontractor' | 'Misc'

export interface ProjectExpense {
  id: string; projectId: string
  category: ExpenseCategory
  description: string
  amount: number
  date: string
  addedBy: string
  createdAt: string
}

export interface QuoteLineItem {
  description: string
  unit: string        // sqft, nos, RMT, cubic meters, lumpsum, bags, kg
  quantity: number
  rate: number
  amount: number      // quantity * rate
}

export interface Quote {
  id: string
  quoteNumber: string       // e.g. KCD/2025/001
  projectTitle: string
  siteAddress: string
  clientName: string
  clientPhone: string
  clientEmail?: string
  items: QuoteLineItem[]
  subtotal: number
  gstPercent: number        // default 18
  gstAmount: number
  totalAmount: number
  validityDays: number      // default 30
  notes?: string
  terms?: string
  status: QuoteStatus
  createdAt: string
  sentAt?: string
}

// ─── Core Types ───────────────────────────────────────────────────────────────

export interface CompanyInfo {
  name: string; tagline: string; description: string
  phone: string; whatsapp: string; email: string; address: string; mapEmbed?: string
  yearsExperience: number; projectsCompleted: number; happyClients: number; teamSize: number
  workingHours: { weekdays: string; saturday: string }
  socialLinks: { instagram?: string; facebook?: string; youtube?: string; linkedin?: string }
  heroImage: string; logo: string
}

export interface Client {
  id: string; uid: string; name: string; phone: string; email: string
  address: string; assignedProjects: string[]; createdAt: string
}

export interface Service {
  id: string; name: string; slug: string; description: string; longDescription: string
  icon: string; coverImage?: string; category: ServiceCategory
  features: string[]; isAvailable: boolean; sortOrder: number
}

export interface Project {
  id: string; title: string; slug: string; description: string; category: ProjectCategory
  location: string; area?: string; year: number; duration?: string
  images: string[]; coverImage: string
  clientId?: string
  assignedSupervisors?: string[]            // supervisor UIDs
  status: ProjectStatus
  startDate?: string; expectedEndDate?: string
  totalValue?: number; paidAmount?: number
  isVisible: boolean; isFeatured: boolean; sortOrder: number
}

export interface Milestone {
  id: string; projectId: string; title: string; description: string
  percentage: number; status: MilestoneStatus
  completedAt?: string; photos: string[]; sortOrder: number
}

export interface ProjectDocument {
  id: string; projectId: string; name: string; type: DocumentType
  url: string; uploadedAt: string; isClientVisible: boolean
}

export interface Payment {
  id: string; projectId: string; clientId: string
  amount: number; description: string
  paymentRef?: string
  status: PaymentStatus; paidAt?: string; createdAt: string
}

export interface TeamMember {
  id: string; name: string; role: string; bio: string
  photo: string; experience: number; isVisible: boolean; sortOrder: number
}

export interface BlogPost {
  id: string; title: string; slug: string; excerpt: string; content: string
  coverImage: string; tags: string[]; author: string
  publishedAt: string; isPublished: boolean; sortOrder: number
}

export interface Enquiry {
  id: string; name: string; phone: string; email: string
  serviceType: string; projectLocation: string; budget: string; message: string
  status: EnquiryStatus; createdAt: string
}

export interface Testimonial {
  id: string; clientName: string; comment: string; rating: number
  projectType: string; location: string; photo?: string; isVisible: boolean
}

// ─── Site Operations Types ────────────────────────────────────────────────────

export interface Supervisor {
  id: string; uid: string                   // Firebase Auth UID
  name: string; phone: string; email: string
  assignedProjects: string[]                // project IDs
  isActive: boolean; createdAt: string
}

export interface SiteTeamMember {
  id: string; projectId: string
  name: string
  role: string                              // "Site Engineer" | "Foreman" | "Mason" | "Labor" | etc.
  phone: string
  supervisorUid?: string                    // if this member has a supervisor login
  joinedDate?: string
}

export interface ProjectMaterial {
  id: string; projectId: string
  name: string                              // "Sand", "Cement 53 Grade", "Steel Rods 12mm"
  unit: string                              // "loads", "bags", "kg", "sqft", "pieces", "cubic meters"
  category: MaterialCategory
  lowStockThreshold: number                 // alert when balance < this
  totalInward: number                       // running total (updated on each transaction)
  totalConsumed: number                     // running total
  sortOrder: number
}

export interface MaterialTransaction {
  id: string; projectId: string
  materialId: string; materialName: string
  type: TransactionType
  quantity: number; unit: string
  date: string                              // "2024-03-15"
  supervisorName: string; supervisorId: string
  notes?: string
  photos?: string[]                         // proof photos (lorry, delivery challan, etc.)
  createdAt: string
}

export interface DailyReport {
  id: string; projectId: string
  date: string                              // "2024-03-15"
  supervisorName: string; supervisorId: string
  workDone: string
  laborCount: number
  weatherCondition: WeatherCondition
  issuesReported?: string
  materialsHighlight?: string               // brief summary of key materials used today
  createdAt: string
}

// ─── Default Material Templates ───────────────────────────────────────────────

export const DEFAULT_CONSTRUCTION_MATERIALS: Omit<ProjectMaterial, 'id' | 'projectId'>[] = [
  { name: 'Sand', unit: 'loads', category: 'Aggregate', lowStockThreshold: 5, totalInward: 0, totalConsumed: 0, sortOrder: 1 },
  { name: 'Cement (53 Grade)', unit: 'bags', category: 'Binding', lowStockThreshold: 50, totalInward: 0, totalConsumed: 0, sortOrder: 2 },
  { name: 'Coarse Aggregate (Jelly)', unit: 'cubic meters', category: 'Aggregate', lowStockThreshold: 10, totalInward: 0, totalConsumed: 0, sortOrder: 3 },
  { name: 'Steel Rods 8mm', unit: 'kg', category: 'Steel', lowStockThreshold: 500, totalInward: 0, totalConsumed: 0, sortOrder: 4 },
  { name: 'Steel Rods 10mm', unit: 'kg', category: 'Steel', lowStockThreshold: 500, totalInward: 0, totalConsumed: 0, sortOrder: 5 },
  { name: 'Steel Rods 12mm', unit: 'kg', category: 'Steel', lowStockThreshold: 500, totalInward: 0, totalConsumed: 0, sortOrder: 6 },
  { name: 'Steel Rods 16mm', unit: 'kg', category: 'Steel', lowStockThreshold: 200, totalInward: 0, totalConsumed: 0, sortOrder: 7 },
  { name: 'Bricks', unit: 'pieces', category: 'Masonry', lowStockThreshold: 2000, totalInward: 0, totalConsumed: 0, sortOrder: 8 },
  { name: 'Hollow Blocks', unit: 'pieces', category: 'Masonry', lowStockThreshold: 500, totalInward: 0, totalConsumed: 0, sortOrder: 9 },
  { name: 'Binding Wire', unit: 'kg', category: 'Steel', lowStockThreshold: 20, totalInward: 0, totalConsumed: 0, sortOrder: 10 },
  { name: 'Shuttering Plates', unit: 'pieces', category: 'Other', lowStockThreshold: 10, totalInward: 0, totalConsumed: 0, sortOrder: 11 },
  { name: 'Water', unit: 'tankers', category: 'Other', lowStockThreshold: 2, totalInward: 0, totalConsumed: 0, sortOrder: 12 },
]

// ─── Demo Data ────────────────────────────────────────────────────────────────

export const DEFAULT_COMPANY: CompanyInfo = {
  name: 'Kiriti Constructions & Developers Pvt. Ltd.',
  tagline: 'Building Infrastructure, Delivering Excellence',
  description: 'Kiriti Constructions & Developers Pvt. Ltd. is a trusted infrastructure and construction company based in Hyderabad, delivering high-quality residential, commercial, and civil projects since 2020. With a team of experienced engineers, skilled supervisors, and committed workers, we combine modern construction techniques with quality materials to build structures that stand the test of time. Our client-first approach ensures transparency, timely delivery, and zero compromises on quality.',
  phone: '+91 93866 55555',
  whatsapp: '919386655555',
  email: 'info@kiriticonstructions.com',
  address: '12-3-45, Road No. 2, Banjara Hills, Hyderabad, Telangana – 500034',
  mapEmbed: '',
  yearsExperience: 6,
  projectsCompleted: 48,
  happyClients: 42,
  teamSize: 35,
  workingHours: {
    weekdays: 'Mon – Sat: 9:00 AM – 6:00 PM',
    saturday: 'Sunday: By Appointment Only',
  },
  socialLinks: {
    instagram: 'https://instagram.com/kiriticonstructions',
    facebook: 'https://facebook.com/kiriticonstructions',
    linkedin: 'https://linkedin.com/company/kiriticonstructions',
  },
  heroImage: 'https://images.unsplash.com/photo-1590856029826-c7a73142bbf1?w=1400&q=80',
  logo: '/images/logo.png',
}

export const DEFAULT_SERVICES: Service[] = [
  {
    id: '1', name: 'Residential Construction', slug: 'residential-construction',
    description: 'End-to-end construction of independent houses, villas, and apartment blocks.',
    longDescription: 'We manage every stage of residential construction — from site preparation and foundation work to structural RCC, brick masonry, plumbing, electrical, tiling, painting, and final handover. Our team ensures Vastu compliance, structural integrity verified by a licensed engineer, and use of ISI-marked materials throughout. Every project comes with a dedicated site supervisor and a 5-year structural warranty.',
    icon: 'FiHome', category: 'Construction',
    features: ['Free site visit & BOQ estimate', 'Vastu-compliant design', 'Licensed structural engineer on site', '5-year structural warranty', 'ISI-marked materials only', 'Dedicated project supervisor'],
    isAvailable: true, sortOrder: 1,
  },
  {
    id: '2', name: 'Commercial Construction', slug: 'commercial-construction',
    description: 'Offices, showrooms, warehouses, and commercial complexes built to specification.',
    longDescription: 'From small office fit-outs to large commercial complexes, we deliver commercial construction projects with precision and speed. We handle complete turnkey projects including civil work, MEP (mechanical, electrical & plumbing), false ceilings, glass facades, and exterior cladding. We understand commercial timelines and budget constraints — our team is built for efficiency.',
    icon: 'FiGrid', category: 'Construction',
    features: ['Detailed BOQ with unit rates', 'Fast-track construction schedule', 'MEP coordination included', 'Safety compliance & PPE mandatory', 'Post-handover defect liability'],
    isAvailable: true, sortOrder: 2,
  },
  {
    id: '3', name: 'Home Renovation', slug: 'home-renovation',
    description: 'Complete home makeovers — structural changes, tiling, painting, and upgrades.',
    longDescription: 'Whether you need to knock down a wall, redo the bathroom, re-tile the entire floor, or refresh with fresh paint — our renovation team handles it all. We work with minimal disruption to your daily life and ensure a clean, dust-controlled work site. Our licensed plumbers and electricians handle all utility work safely.',
    icon: 'FiTool', category: 'Renovation',
    features: ['Minimal disruption approach', 'Licensed electricians & plumbers', 'Old material disposal included', '1-year workmanship warranty', 'Dust-controlled work environment'],
    isAvailable: true, sortOrder: 3,
  },
  {
    id: '4', name: 'Interior Design & Fit-out', slug: 'interior-design',
    description: 'False ceilings, modular kitchens, wardrobes, flooring, and complete fit-outs.',
    longDescription: 'Our interior fit-out team transforms raw spaces into beautiful, functional homes and offices. We specialise in gypsum and POP false ceilings, modular kitchen design and installation, custom wardrobes, wooden flooring, wall cladding, and ambient lighting. We use trusted brands and provide a 3D preview before execution.',
    icon: 'FiLayers', category: 'Interior',
    features: ['3D design preview before execution', 'Brands: Greenply, Sleek, Hettich', 'Modular kitchen with 5-year warranty', 'Custom wardrobe solutions', 'Ambient & task lighting design'],
    isAvailable: true, sortOrder: 4,
  },
  {
    id: '5', name: 'Civil & Structural Work', slug: 'civil-work',
    description: 'Foundation work, RCC structures, compound walls, drains, and civil repairs.',
    longDescription: 'Our civil team handles all heavy structural and civil infrastructure work — foundation laying with soil testing, RCC frame construction, retaining walls, storm drains, borewell structures, and compound wall construction. We also take up structural repair and strengthening of existing buildings.',
    icon: 'FiAnchor', category: 'Civil',
    features: ['Soil testing before foundation', 'RCC design by licensed engineer', 'Compound wall & gate construction', 'Storm drain and borewell work', 'Structural audit & repair'],
    isAvailable: true, sortOrder: 5,
  },
  {
    id: '6', name: 'Painting & Waterproofing', slug: 'painting-waterproofing',
    description: 'Interior & exterior painting with premium brands, and comprehensive waterproofing.',
    longDescription: 'A quality paint job protects your building and keeps it looking fresh for years. We use Asian Paints, Dulux, and Berger professional-grade paints for interior and exterior surfaces. Our waterproofing services cover terrace waterproofing, bathroom wet area treatment, basement waterproofing, and external wall coatings — all with a 3-year warranty.',
    icon: 'FiDroplet', category: 'Renovation',
    features: ['Brands: Asian Paints, Dulux, Berger', 'Surface prep & putty finishing', 'Terrace & bathroom waterproofing', 'External wall treatment', '3-year waterproofing warranty'],
    isAvailable: true, sortOrder: 6,
  },
]

export const DEFAULT_PROJECTS: Project[] = [
  {
    id: '1', title: '4BHK Independent Villa — Jubilee Hills', slug: '4bhk-villa-jubilee-hills',
    description: 'A premium 4BHK independent villa with basement parking, home theatre, and landscaped garden. Delivered in 10 months, fully turnkey.',
    category: 'Residential', location: 'Jubilee Hills, Hyderabad', area: '4,800 sqft', year: 2024, duration: '10 months',
    images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80'], coverImage: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    clientId: 'client-1', status: 'completed', totalValue: 7200000, paidAmount: 7200000,
    isVisible: true, isFeatured: true, sortOrder: 1,
  },
  {
    id: '2', title: 'Commercial Office Complex — Hitech City', slug: 'office-complex-hitech-city',
    description: 'A G+4 commercial office complex with 22 independent units, covered parking, and central air conditioning. Completed on schedule.',
    category: 'Commercial', location: 'Hitech City, Hyderabad', area: '18,000 sqft', year: 2023, duration: '14 months',
    images: ['https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80'], coverImage: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80',
    status: 'completed', totalValue: 24000000, paidAmount: 24000000,
    isVisible: true, isFeatured: true, sortOrder: 2,
  },
  {
    id: '3', title: 'G+3 Apartment Block — Miyapur', slug: 'g3-apartment-miyapur',
    description: 'Ground + 3 floor apartment block with 12 units, lift provision, and covered parking. Currently in finishing stage.',
    category: 'Residential', location: 'Miyapur, Hyderabad', area: '9,600 sqft', year: 2024, duration: '16 months',
    images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80'], coverImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
    clientId: 'client-2', status: 'ongoing', totalValue: 15000000, paidAmount: 9000000,
    isVisible: true, isFeatured: true, sortOrder: 3,
  },
  {
    id: '4', title: 'Luxury Showroom Fit-out — Banjara Hills', slug: 'showroom-fitout-banjara-hills',
    description: 'A 5,500 sqft luxury automotive showroom with glass facades, polished stone flooring, and custom LED lighting installations.',
    category: 'Commercial', location: 'Banjara Hills, Hyderabad', area: '5,500 sqft', year: 2024, duration: '4 months',
    images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80'], coverImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
    status: 'completed', totalValue: 6500000, paidAmount: 6500000,
    isVisible: true, isFeatured: false, sortOrder: 4,
  },
  {
    id: '5', title: 'Full Home Renovation — Kondapur', slug: 'home-renovation-kondapur',
    description: 'Complete renovation of a 2,200 sqft 3BHK flat — new flooring, kitchen remodel, two bathroom upgrades, false ceiling, and full painting.',
    category: 'Renovation', location: 'Kondapur, Hyderabad', area: '2,200 sqft', year: 2024, duration: '7 weeks',
    images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80'], coverImage: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
    status: 'completed', totalValue: 1800000, paidAmount: 1800000,
    isVisible: true, isFeatured: false, sortOrder: 5,
  },
  {
    id: '6', title: 'Compound Wall & Security Gate — Shamshabad', slug: 'compound-wall-shamshabad',
    description: 'RCC compound wall spanning 480 metres with decorative stone cladding, steel gate fabrication, and security cabin construction for an industrial plot.',
    category: 'Civil', location: 'Shamshabad, Hyderabad', area: '480 Rm', year: 2023, duration: '6 weeks',
    images: ['https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80'], coverImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
    status: 'completed', totalValue: 2200000, paidAmount: 2200000,
    isVisible: true, isFeatured: false, sortOrder: 6,
  },
]

export const DEFAULT_TEAM: TeamMember[] = [
  { id: '1', name: 'T. Kiriti Babu', role: 'Managing Director', bio: 'Founder of Kiriti Constructions & Developers with 15+ years in construction and civil engineering. Kiriti has personally overseen 40+ major projects across Hyderabad.', photo: '', experience: 15, isVisible: true, sortOrder: 1 },
  { id: '2', name: 'P. Ravi Kumar', role: 'Chief Civil Engineer', bio: 'B.Tech Civil from JNTU Hyderabad with 12 years of structural design and site execution experience. Ravi leads all RCC and civil works.', photo: '', experience: 12, isVisible: true, sortOrder: 2 },
  { id: '3', name: 'M. Srinivas', role: 'Senior Site Supervisor', bio: 'Diploma in Civil with 8 years of on-site supervision. Srinivas manages day-to-day site activities, material tracking, and labour coordination.', photo: '', experience: 8, isVisible: true, sortOrder: 3 },
  { id: '4', name: 'K. Anitha', role: 'Interior Design Lead', bio: 'Interior design specialist with 6 years of experience in modular kitchen, wardrobe, and false ceiling fit-outs. Anitha brings precision and creativity to every interior project.', photo: '', experience: 6, isVisible: true, sortOrder: 4 },
]

export const DEFAULT_BLOG: BlogPost[] = [
  {
    id: '1',
    title: '5 Things to Check Before Starting Your House Construction',
    slug: '5-things-before-house-construction',
    excerpt: 'Starting a house construction is one of the biggest investments of your life. Here are 5 critical things to verify before breaking ground.',
    content: `## 1. Get Your Soil Test Done\n\nBefore laying the foundation, always get a soil bearing capacity test done. In Hyderabad, the soil type varies widely across areas. A black cotton soil foundation requires a different approach than hard rock or murrum soil. Skipping this step can lead to differential settlement and cracks in the future.\n\n## 2. Verify Your Plan Approval\n\nEnsure your building plan is approved by GHMC (Greater Hyderabad Municipal Corporation) or the relevant local authority. Never start construction without a valid plan approval — you risk demolition orders and legal issues.\n\n## 3. Set a Realistic Budget with Contingency\n\nMost constructions run 15–20% over the initial estimate due to design changes, material price fluctuations, and unforeseen conditions. Always keep a contingency buffer of at least 15% over your approved BOQ estimate.\n\n## 4. Check the Contractor's Track Record\n\nAsk for at least 3 completed project references. Visit the sites if possible. Check if the contractor has a permanent team or relies entirely on daily labour — a stable team produces better quality work.\n\n## 5. Get Everything in Writing\n\nA detailed contract must cover: scope of work, material specifications (brand, grade, type), payment schedule, timeline with milestones, penalty clauses for delays, and warranty terms. Never rely on verbal agreements.`,
    coverImage: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80', tags: ['Tips', 'Construction', 'Guide'],
    author: 'T. Kiriti Babu', publishedAt: '2024-11-15', isPublished: true, sortOrder: 1,
  },
  {
    id: '2',
    title: 'Why Material Tracking is Critical for Large Construction Projects',
    slug: 'material-tracking-construction-projects',
    excerpt: 'Material theft and wastage account for 10–15% of construction costs on unmonitored sites. Here is how systematic tracking saves money.',
    content: `## The Problem with Unmonitored Sites\n\nOn most construction sites, materials arrive and get consumed without any systematic tracking. Supervisors rely on memory or rough notebooks. This leads to three major problems: material theft, over-ordering, and billing disputes.\n\n## What We Track and Why\n\nAt Kiriti Constructions & Developers, every site has a digital material register. Each delivery is logged with date, quantity, vehicle number, and supplier challan number. Each day's consumption is recorded by the supervisor.\n\nThis gives us:\n- Real-time stock balance for every material\n- Automatic alerts when stock falls below threshold\n- Full audit trail for client billing\n- Evidence to resolve disputes with suppliers\n\n## Common Materials That Go Missing\n\nSand and aggregate are the most commonly stolen materials on sites — they are easy to load at night and hard to verify by volume. Steel rods are another high-risk item. Cement bags are frequently pilfered in smaller quantities over time.\n\n## How Technology Helps\n\nOur supervisor portal allows site supervisors to log every inward delivery and daily consumption on their phone. The admin sees real-time inventory and gets WhatsApp alerts when stock drops below the minimum threshold — before the site runs out.`,
    coverImage: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80', tags: ['Management', 'Tips', 'Operations'],
    author: 'P. Ravi Kumar', publishedAt: '2024-10-22', isPublished: true, sortOrder: 2,
  },
  {
    id: '3',
    title: 'Steel vs Concrete: Understanding Your Structural Options',
    slug: 'steel-vs-concrete-structural-options',
    excerpt: 'When building in Hyderabad, should you go for RCC construction or steel frame construction? Here is a practical comparison for homeowners.',
    content: `## Reinforced Cement Concrete (RCC)\n\nRCC is the most common construction method in Hyderabad and across India. It uses a combination of concrete (which resists compression) and steel rebars (which resist tension) to create strong, durable structural members.\n\n**Advantages of RCC:**\n- Proven technology — widely understood by contractors and engineers\n- Low maintenance over decades\n- Better fire resistance\n- Better acoustic insulation\n- Lower initial cost for residential buildings\n\n## Steel Frame Construction\n\nSteel frame construction is increasingly popular for commercial buildings, warehouses, and industrial structures where large spans and fast construction are priorities.\n\n**Advantages of Steel Frame:**\n- Faster construction (30–40% faster than RCC)\n- Lighter structure — suitable for weaker soil conditions\n- Easier to modify or expand later\n- Better for large column-free spans (warehouses, showrooms)\n\n## Our Recommendation for Hyderabad\n\nFor residential construction (villas, apartments, independent houses), we always recommend RCC — it is cost-effective, proven, and performs excellently in Hyderabad's climate. For commercial showrooms, warehouses, and industrial sheds above 5,000 sqft, steel frame with RCC mezzanine floors offers the best value.`,
    coverImage: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=80', tags: ['Technical', 'Construction', 'Guide'],
    author: 'P. Ravi Kumar', publishedAt: '2024-09-08', isPublished: true, sortOrder: 3,
  },
]

export const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    id: '1', clientName: 'Suresh Reddy', comment: 'Kiriti Constructions built our 4BHK villa exactly as planned. The quality of work, especially the structural work and tiling, is outstanding. They delivered on time and within budget. The client portal was very helpful — I could see every milestone update from my office.',
    rating: 5, projectType: 'Residential Villa', location: 'Jubilee Hills', isVisible: true,
  },
  {
    id: '2', clientName: 'Annapurna Enterprises', comment: 'We hired them for our commercial showroom fit-out in Banjara Hills. The glass facade and stone flooring came out exactly as the 3D design showed. Professional team, clean site, and zero delays. Highly recommended for commercial projects.',
    rating: 5, projectType: 'Commercial Fit-out', location: 'Banjara Hills', isVisible: true,
  },
  {
    id: '3', clientName: 'Kavitha & Mohan', comment: 'Our 3BHK flat renovation was completed in 7 weeks — kitchen, two bathrooms, all flooring, and painting. The supervisor WhatsApp group kept us updated daily. Very transparent about costs. Will definitely use them for our second property.',
    rating: 5, projectType: 'Home Renovation', location: 'Kondapur', isVisible: true,
  },
  {
    id: '4', clientName: 'Sri Balaji Industries', comment: 'The compound wall and gate for our industrial plot was done very professionally. The stone cladding looks great. Work started and finished on the committed dates. Pricing was fair and competitive.',
    rating: 4, projectType: 'Civil Work', location: 'Shamshabad', isVisible: true,
  },
]
