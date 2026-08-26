import type {
  Service,
  Project,
  Technology,
  TechnologyCategory,
  PricingTier,
  SchoolSalesStrategy,
  ProjectBenchmark,
  FAQ,
  ProcessStep,
  Solution,
  Differentiator,
  NavItem,
} from './types';

// ─── Navigation ──────────────────────────────────────────────────
export const navItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'Solutions', href: '/solutions' },
  { label: 'Projects', href: '/projects' },
  { label: 'About', href: '/about' },
  { label: 'Process', href: '/process' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Contact', href: '/contact' },
];

// ─── Services ────────────────────────────────────────────────────
export const services: Service[] = [
  {
    slug: 'website-development',
    title: 'Website Development',
    shortTitle: 'Websites',
    description:
      'Professional responsive websites for schools, businesses, organizations, and personal brands.',
    longDescription:
      'We build fast, responsive, and professionally designed websites that represent your business accurately. From single-page sites to multi-section institutional websites, every project is built with clean code, proper SEO structure, and mobile-first design.',
    icon: 'Globe',
    features: [
      'Responsive design for all devices',
      'SEO-optimized structure',
      'Fast loading performance',
      'Content management',
      'Contact forms and enquiry systems',
      'Analytics integration',
      'SSL and security setup',
      'Domain and hosting support',
    ],
    technologies: ['HTML', 'CSS', 'JavaScript', 'React', 'Next.js'],
    useCases: [
      'School and institutional websites',
      'Business and corporate websites',
      'Portfolio and personal brand websites',
      'Landing pages and promotional sites',
    ],
  },
  {
    slug: 'web-application-development',
    title: 'Web Application Development',
    shortTitle: 'Web Apps',
    description:
      'Interactive web applications with authentication, dashboards, APIs, databases, and custom workflows.',
    longDescription:
      'We develop full-featured web applications tailored to your business processes. From user authentication and role-based dashboards to real-time data, reporting, and integrations — each application is built to handle your specific workflows reliably.',
    icon: 'LayoutDashboard',
    features: [
      'User authentication and authorization',
      'Role-based access control',
      'Interactive dashboards',
      'Database design and integration',
      'API development and integration',
      'Real-time data updates',
      'File uploads and management',
      'Reporting and analytics',
    ],
    technologies: ['React', 'Next.js', 'Java', 'Spring Boot', 'PostgreSQL', 'Supabase'],
    useCases: [
      'Internal business tools',
      'Customer portals',
      'Booking and reservation systems',
      'Data management platforms',
    ],
  },
  {
    slug: 'android-development',
    title: 'Android Application Development',
    shortTitle: 'Android Apps',
    description:
      'Native and modern Android applications for businesses, institutions, and startups.',
    longDescription:
      'We build Android applications that are reliable, performant, and designed for real users. Whether it is an internal tool for your organization or a customer-facing product, we develop applications with clean architecture, proper offline support, and smooth user experiences.',
    icon: 'Smartphone',
    features: [
      'Native Android development',
      'Material Design UI',
      'Offline functionality',
      'Push notifications',
      'API integration',
      'Secure data storage',
      'Camera, GPS, and device features',
      'Play Store deployment',
    ],
    technologies: ['Java', 'Kotlin', 'Android SDK'],
    useCases: [
      'Business management apps',
      'Institutional apps for schools and colleges',
      'Customer-facing mobile products',
      'Utility and productivity tools',
    ],
  },
  {
    slug: 'custom-software',
    title: 'Custom Software Development',
    shortTitle: 'Custom Software',
    description:
      'Software designed around specific business processes and requirements.',
    longDescription:
      'Off-the-shelf software rarely fits perfectly. We analyze your business processes and build software that handles your specific workflows, data, and requirements — without forcing you into a generic template. Every feature is planned around what you actually need.',
    icon: 'Code2',
    features: [
      'Requirements analysis',
      'Custom workflow automation',
      'Data processing and management',
      'Integration with existing systems',
      'Scalable architecture',
      'User training and documentation',
      'Ongoing maintenance',
      'Feature iterations',
    ],
    technologies: ['Java', 'Spring Boot', 'React', 'Next.js', 'PostgreSQL', 'MySQL'],
    useCases: [
      'Business process automation',
      'Industry-specific tools',
      'Data management systems',
      'Internal operations software',
    ],
  },
  {
    slug: 'school-erp',
    title: 'School ERP & Management Systems',
    shortTitle: 'School ERP',
    description:
      'Complete school management systems covering students, teachers, attendance, fees, exams, results, notices, admissions, and parent portals.',
    longDescription:
      'Our school ERP solutions help educational institutions manage their daily operations digitally. From student admissions and fee tracking to exam management and result publishing — the system is designed to reduce manual work and improve communication between school, teachers, students, and parents.',
    icon: 'GraduationCap',
    features: [
      'Student and teacher management',
      'Admissions and enrollment',
      'Attendance tracking',
      'Fee management and receipts',
      'Exam and result management',
      'Notice board and announcements',
      'Parent and student portals',
      'Reports and analytics',
    ],
    technologies: ['React', 'Next.js', 'Java', 'Spring Boot', 'PostgreSQL', 'Supabase'],
    useCases: [
      'K-12 schools',
      'Coaching institutes',
      'Colleges and universities',
      'Educational trusts',
    ],
  },
  {
    slug: 'business-solutions',
    title: 'Business Management Software',
    shortTitle: 'Business Solutions',
    description:
      'Inventory, billing, customer management, reporting, and other custom business applications.',
    longDescription:
      'We build management software that helps businesses operate more efficiently. Whether you need to track inventory, manage customers, generate invoices, or produce reports — we create solutions that fit your business model and scale as you grow.',
    icon: 'Building2',
    features: [
      'Inventory management',
      'Billing and invoicing',
      'Customer management (CRM)',
      'Employee management',
      'Reporting dashboards',
      'Workflow automation',
      'Multi-user access',
      'Data export and backup',
    ],
    technologies: ['React', 'Next.js', 'Java', 'Spring Boot', 'PostgreSQL', 'MySQL'],
    useCases: [
      'Retail and wholesale businesses',
      'Service-based companies',
      'Manufacturing units',
      'Small and medium enterprises',
    ],
  },
  {
    slug: 'api-development',
    title: 'Backend & API Development',
    shortTitle: 'API & Backend',
    description:
      'Secure APIs, databases, authentication, integrations, and backend architecture.',
    longDescription:
      'Every application needs a reliable backend. We design and build APIs, database structures, authentication systems, and backend services that power your applications securely and efficiently. Our backends are designed for reliability and scalability.',
    icon: 'Server',
    features: [
      'RESTful API design',
      'Database architecture',
      'Authentication and security',
      'Third-party integrations',
      'File storage and management',
      'Email and notification services',
      'Rate limiting and validation',
      'API documentation',
    ],
    technologies: ['Java', 'Spring Boot', 'PostgreSQL', 'MySQL', 'Supabase', 'REST APIs'],
    useCases: [
      'Mobile app backends',
      'Web application APIs',
      'Data integration services',
      'Microservice architecture',
    ],
  },
  {
    slug: 'maintenance',
    title: 'Maintenance & Technical Support',
    shortTitle: 'Maintenance',
    description:
      'Bug fixing, updates, hosting support, database maintenance, and feature improvements.',
    longDescription:
      'Software needs ongoing care. We provide maintenance and technical support to keep your applications running smoothly — from fixing bugs and applying updates to monitoring performance and adding new features as your business evolves.',
    icon: 'Wrench',
    features: [
      'Bug fixing and troubleshooting',
      'Security updates and patches',
      'Performance monitoring',
      'Database maintenance',
      'Feature additions',
      'Hosting and deployment support',
      'Backup management',
      'Technical consultation',
    ],
    technologies: ['Various — depends on the existing project stack'],
    useCases: [
      'Existing website maintenance',
      'Application updates and improvements',
      'Server and hosting management',
      'Long-term technical partnership',
    ],
  },
];

// ─── Solutions ───────────────────────────────────────────────────
export const solutions: Solution[] = [
  {
    title: 'School Management',
    description:
      'Complete digital management for educational institutions.',
    features: [
      'Admissions and enrollment',
      'Attendance tracking',
      'Fee management',
      'Exam and result management',
      'Notice board',
      'Parent and student portals',
    ],
    icon: 'GraduationCap',
  },
  {
    title: 'Business Management',
    description:
      'Streamline operations with software built for your business.',
    features: [
      'Customer management',
      'Inventory tracking',
      'Billing and invoicing',
      'Reports and analytics',
      'Employee management',
      'Workflow automation',
    ],
    icon: 'Building2',
  },
  {
    title: 'Digital Presence',
    description:
      'Professional online representation for your brand or organization.',
    features: [
      'Professional websites',
      'Landing pages',
      'Portfolio websites',
      'Institutional websites',
      'SEO optimization',
      'Mobile responsiveness',
    ],
    icon: 'Globe',
  },
  {
    title: 'Custom Applications',
    description:
      'Applications built specifically around your business process.',
    features: [
      'Process automation',
      'Data management',
      'User portals',
      'Reporting systems',
      'Integration services',
      'Scalable architecture',
    ],
    icon: 'Code2',
  },
];

// ─── Projects ────────────────────────────────────────────────────
export const projects: Project[] = [
  {
    slug: 'roshani-public-school-erp',
    title: 'Roshani Public School ERP',
    category: 'School ERP',
    description:
      'Enterprise School ERP solution featuring multi-role authentication (Admin, Principal, Teacher, Accountant, Parent, Student), student records, real-time attendance, fee collections & automated report card publishing.',
    overview:
      'A full-scale School Enterprise Resource Planning (ERP) web application engineered for Roshani Public School to digitize and automate daily operations. The system centralizes academic administration, live attendance tracking, fee payment processing with instant receipt generation, examination grading with automated report cards, and role-based communication across 6 dedicated user portals.',
    problem:
      'Managing academic records, fee reconciliations, daily attendance tracking, report cards compilation, and parent notices via physical registers and disconnected spreadsheets caused operational bottlenecks, communication delays, and high administrative overhead.',
    solution:
      'We engineered a comprehensive, responsive School Management ERP platform built on Next.js, React, and Supabase / PostgreSQL. With fine-grained Role-Based Access Control (RBAC), the platform provides tailored dashboards for administrators, faculty, accountants, parents, and students, automating routine processes and enabling instant data synchronization.',
    features: [
      'Multi-Role Portals (Admin, Principal, Teacher, Accountant, Parent, Student)',
      'Student & Staff Records Management with Dynamic Filters',
      'Fee Collection, Dues Tracking & Instant Receipt Engine',
      'Daily & Subject-Wise Attendance Tracking with Analytics',
      'Examination Scheduling, Result Grading & Digital Report Cards',
      'Real-Time Institutional Notice Board & Announcements',
      'Parent & Student Performance Monitoring Dashboards',
      'Secure Authentication & Role-Based Access Control (RBAC)',
    ],
    technologies: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'PostgreSQL', 'Supabase', 'Vercel'],
    image: '/images/projects/roshani-public-school-erp/roshani-erp-1.jpg',
    images: [
      '/images/projects/roshani-public-school-erp/roshani-erp-1.jpg',
    ],
    liveUrl: 'https://roshani-public-school-erp.vercel.app/login',
  },
  {
    slug: 'roshani-public-school',
    title: 'Roshani Public School',
    category: 'Website',
    description:
      'Professional school website with admissions, notices, academics, gallery, facilities, and administrative functionality.',
    overview:
      'A comprehensive school website designed to serve as the digital face of Roshani Public School. The website provides prospective parents, students, and the community with essential information about the school.',
    problem:
      'The school needed an online presence that could communicate admissions information, academic programs, notices, and school events to parents and students — replacing the reliance on physical circulars and word-of-mouth communication.',
    solution:
      'We built a professional, mobile-friendly school website with dedicated sections for admissions, academics, facilities, gallery, and a notice board. The site is designed for easy content updates by school staff.',
    features: [
      'Admissions information and process',
      'Academic programs and curriculum',
      'Notice board and announcements',
      'Photo gallery',
      'Facilities overview',
      'Contact and enquiry forms',
      'Mobile-responsive design',
    ],
    technologies: ['HTML', 'CSS', 'JavaScript', 'React'],
    image: '/images/projects/roshani-public-school/roshani-2.png',
    images: [
      '/images/projects/roshani-public-school/roshani-1.png',
      '/images/projects/roshani-public-school/roshani-2.png',
      '/images/projects/roshani-public-school/roshani-3.png',
      '/images/projects/roshani-public-school/roshani-4.jpg',
      '/images/projects/roshani-public-school/roshani-5.png',
      '/images/projects/roshani-public-school/roshani-6.png',
      '/images/projects/roshani-public-school/roshani-7.png',
    ],
    liveUrl: 'https://roshani-public-school.vercel.app/',
  },
  {
    slug: 'sparknest-academy',
    title: 'SparkNest Academy',
    category: 'Web Application',
    description:
      'Educational learning platform for students.',
    overview:
      'SparkNest Academy is an online learning platform designed to provide students with accessible educational content and a structured learning experience.',
    problem:
      'Students needed a centralized platform to access educational content, track their learning progress, and engage with study materials in a structured format.',
    solution:
      'We developed a web-based learning platform that organizes educational content into courses and topics, allowing students to learn at their own pace with a clean, distraction-free interface.',
    features: [
      'Course catalog and content organization',
      'Student learning interface',
      'Content delivery system',
      'Responsive design for mobile learning',
      'Clean and focused user experience',
    ],
    technologies: ['React', 'Next.js', 'JavaScript', 'Tailwind CSS'],
    image: '/images/projects/sparknest-academy/sparknest-1.png',
    images: [
      '/images/projects/sparknest-academy/sparknest-1.png',
      '/images/projects/sparknest-academy/sparknest-2.png',
      '/images/projects/sparknest-academy/sparknest-3.png',
      '/images/projects/sparknest-academy/sparknest-4.png',
      '/images/projects/sparknest-academy/sparknest-5.png',
    ],
    liveUrl: 'https://www.sparknestacademy.in/',
  },
  {
    slug: 'palak-enterprises',
    title: 'Palak Enterprises',
    category: 'Web Application',
    description:
      'Digital printing and online service platform featuring instant document uploads, customizable print orders, Razorpay payment gateway, real-time order tracking, and CSC services in Chakia.',
    overview:
      'A comprehensive digital printing and CSC service web application engineered for Palak Enterprises in Chakia, East Champaran, Bihar. The platform modernizes print shop workflows by enabling customers to upload files directly, choose print and binding specifications, make online payments via Razorpay or choose pay-on-pickup, and track their order status in real time — significantly reducing in-shop wait times.',
    problem:
      'Local customers experienced long counter wait times for routine document printing, urgent passport photos, online government applications, and stationery orders. Manual file transfers via USB drives and counter cash exchanges created operational bottlenecks during peak shop hours.',
    solution:
      'We designed and developed an intuitive "Send • Choose • Collect" web platform. Users can securely upload documents from mobile or desktop, select precise print settings (B&W/color, copies, paper dimensions), pay instantly with Razorpay or at pickup, and monitor order processing live. The platform also showcases wedding stationery, banner printing, and digital CSC assistance services.',
    features: [
      'Direct Document & PDF Upload Engine',
      'Streamlined "Send • Choose • Collect" Ordering Flow',
      'Integrated Razorpay Online Payment Gateway',
      'Pay Online (Skip Queue) & Pay-on-Pickup Options',
      'Live Order Tracking & Status Lookup System',
      'Digital & Offset Print Catalog (Cards, Banners, Photo Prints)',
      'CSC Citizen & Digital Government Services Hub',
      'Mobile-First Responsive Interface with Fast Performance',
    ],
    technologies: ['React', 'TypeScript', 'Tailwind CSS', 'Supabase', 'Razorpay', 'Vercel'],
    image: '/images/projects/palak-enterprises.svg',
    images: [
      '/images/projects/palak-enterprises.svg',
    ],
    liveUrl: 'https://palak-enterprises-ghit.vercel.app/',
  },
  {
    slug: 'bankgeu',
    title: 'BankGeu',
    category: 'Desktop Application',
    description:
      'Java-based banking application.',
    overview:
      'BankGeu is a desktop banking application built with Java, demonstrating core banking functionalities including account management and transaction processing.',
    problem:
      'A requirement for a banking system that could handle basic banking operations including account creation, balance management, and transaction tracking.',
    solution:
      'We developed a Java-based desktop application implementing fundamental banking operations with a focus on data integrity, transaction accuracy, and a user-friendly interface.',
    features: [
      'Account management',
      'Balance enquiry',
      'Transaction processing',
      'Transaction history',
      'User authentication',
    ],
    technologies: ['Java', 'MySQL'],
    image: '/images/projects/bankgeu.jpg',
  },
  {
    slug: 'gameverse',
    title: 'GameVerse',
    category: 'Desktop Application',
    description:
      'Java-based multi-game application.',
    overview:
      'GameVerse is a collection of classic games built as a single Java application, showcasing interactive GUI development and game logic implementation.',
    problem:
      'Creating an engaging multi-game desktop application that demonstrates Java GUI capabilities and interactive programming concepts.',
    solution:
      'We built a Java application featuring multiple classic games with smooth graphics, interactive controls, and a unified game selection interface.',
    features: [
      'Multiple classic games',
      'Interactive GUI',
      'Game selection menu',
      'Score tracking',
      'Smooth animations',
    ],
    technologies: ['Java', 'Java Swing'],
    image: '/images/projects/gameverse.png',
  },
];

// ─── Technologies ────────────────────────────────────────────────
export const technologyCategories: TechnologyCategory[] = [
  {
    name: 'Frontend',
    key: 'frontend',
    technologies: [
      { name: 'HTML', category: 'frontend' },
      { name: 'CSS', category: 'frontend' },
      { name: 'JavaScript', category: 'frontend' },
      { name: 'React', category: 'frontend' },
      { name: 'Next.js', category: 'frontend' },
    ],
  },
  {
    name: 'Backend',
    key: 'backend',
    technologies: [
      { name: 'Java', category: 'backend' },
      { name: 'Spring Boot', category: 'backend' },
      { name: 'REST APIs', category: 'backend' },
    ],
  },
  {
    name: 'Database',
    key: 'database',
    technologies: [
      { name: 'MySQL', category: 'database' },
      { name: 'PostgreSQL', category: 'database' },
      { name: 'Supabase', category: 'database' },
    ],
  },
  {
    name: 'Mobile',
    key: 'mobile',
    technologies: [
      { name: 'Android', category: 'mobile' },
      { name: 'Java', category: 'mobile' },
      { name: 'Kotlin', category: 'mobile' },
    ],
  },
  {
    name: 'Tools & Deployment',
    key: 'tools',
    technologies: [
      { name: 'Git', category: 'tools' },
      { name: 'GitHub', category: 'tools' },
      { name: 'Vercel', category: 'tools' },
      { name: 'Cloud Platforms', category: 'tools' },
    ],
  },
];

// ─── Pricing ─────────────────────────────────────────────────────
// ─── Pricing ─────────────────────────────────────────────────────
export const pricingTiers: PricingTier[] = [
  {
    title: 'Website Development',
    startingFrom: '₹15,000',
    description: 'Professional 5–10 page responsive static websites for schools, institutions, and businesses.',
    badge: 'Entry Package 🟢',
    scopeAlignment: 'Ideal for 5–10 page static websites with responsive design, fast load speeds, and clean structure.',
    features: [
      '5–10 Page Responsive Layout',
      'Contact & Enquiry Forms',
      'CBSE Compliance & Disclosure Ready',
      'Mobile & Speed Optimization',
      'Basic SEO & Security Setup',
      'Upgrade Path to Web App Available',
    ],
    cta: 'Get a Quote',
  },
  {
    title: 'Web Applications',
    startingFrom: '₹30,000',
    description: 'Interactive web applications with admin control panel, dynamic notices, gallery, and Supabase database.',
    highlighted: true,
    badge: 'Most Popular 🟢',
    scopeAlignment:
      'Interactive web applications with admin portal, dynamic content management, role permissions, and database backend.',
    features: [
      'Public Portal + Admin Control Panel',
      'Live Notice Board & Dynamic Gallery',
      'Parent Enquiries & Leads Database',
      'Supabase / Modern Database Backend',
      'Role-based Admin Permissions',
      'Fast & Modern Tech Stack',
    ],
    cta: 'Get a Quote',
  },
  {
    title: 'Android Applications',
    startingFrom: '₹30,000',
    description: 'Native Android apps and official Google Play Store listings for institutions and enterprise clients.',
    badge: 'Prestige Package 🟡',
    scopeAlignment: 'Native Android applications or WebView-based institutional app packages.',
    pricingOptions: [
      'Native Android App: Starting ₹30,000',
      'WebView Add-on (with Web App): +₹8,000 to +₹12,000',
    ],
    features: [
      'Official Google Play Store Listing',
      'Native Android Architecture',
      'Push Notifications & Announcements',
      'WebView App Wrapper Option',
      'Official Brand Presence',
    ],
    cta: 'Get a Quote',
  },
  {
    title: 'Custom Software',
    startingFrom: '₹40,000',
    description: 'Bespoke software systems for coaching institutes, private hospitals, distributors, and businesses.',
    badge: 'Enterprise Choice 🟢',
    scopeAlignment: 'Bespoke software engineered around custom business processes and operational workflows.',
    features: [
      'Custom Workflow Automation',
      'Coaching & Hospital Management Modules',
      'Distributor & Inventory Workflows',
      'Custom Database & API Architecture',
      'Staff Training & Documentation',
    ],
    cta: 'Get a Quote',
  },
  {
    title: 'School ERP',
    startingFrom: '₹80,000 / Flexible Model',
    description: 'Complete school management software covering admissions, fee collection, exams, and parent portals.',
    badge: 'Flexible ERP Models 🟢',
    scopeAlignment: 'Complete school management: student admissions, fee receipts, attendance, exams, report cards, parent portals.',
    pricingOptions: [
      'Option A (One-Time): ₹80,000 upfront for large institutions (1,000+ students)',
      'Option B (SaaS / Per-Student): ₹15 – ₹25 per student / month',
      'Option C (Hybrid AMC): ₹25,000 upfront + ₹10,000 / year AMC',
    ],
    features: [
      'Student & Staff Profiles',
      'Fee Collection & Receipt Engine',
      'Attendance, Exams & Report Cards',
      'Parent & Student Mobile Portals',
      'Flexible SaaS or One-time Pricing',
    ],
    cta: 'Get a Quote',
  },
  {
    title: 'Business Applications',
    startingFrom: 'Custom Quote',
    description: 'Tailored billing, inventory tracking, CRM, and multi-user solutions for stores, wholesalers, and pharmacies.',
    badge: 'Tailored Solution 🟢',
    scopeAlignment: 'Tailored billing systems, inventory tracking, CRM, and multi-user business tools.',
    features: [
      'Custom Billing & Invoicing',
      'Hardware Store & Pharmacy Modules',
      'Stock & Inventory Tracking',
      'Customer Management (CRM)',
      'Multi-user Access & Daily Reports',
    ],
    cta: 'Contact Us',
  },
];

export const projectPricingBenchmark: ProjectBenchmark = {
  projectName: 'Roshani Public School Project',
  category: 'Web Applications (Tier 2)',
  scope: '23 Total Pages (12 Public + 11 Admin Portal) + Supabase DB + Live Notices / Gallery / Enquiries',
  fairPrice: '₹32,000 – ₹38,000 Base',
  amcRate: '₹6,000 / year AMC',
  highlights: [
    '12 Public pages (Home, About, Academics, Mandatory Disclosure, Admissions, Gallery, Contact, etc.)',
    '11 Admin Portal pages for notice management, photo gallery upload, student enquiries & system settings',
    'Supabase Real-Time DB integration for instant notice publishing without writing code',
    'Modern tech stack (HTML/JS + React/Next + Supabase) delivering high speed & fast turnaround',
  ],
};

export const schoolSalesStrategies: SchoolSalesStrategy[] = [
  {
    title: 'The "Prestige Combo" Bundle',
    subtitle: 'Website + Play Store App Bundle',
    badge: 'FEATURED BUNDLE 🚀',
    priceTag: '₹38,000 Bundle Offer',
    description:
      'Combine a full Web Application (₹30,000) with an official Play Store Android App add-on (₹12,000) into a single high-impact institutional package.',
    whyItWorks:
      'Gives educational institutions and businesses maximum visibility across both Web and Mobile app platforms on Google Play Store.',
    icon: 'Smartphone',
  },
  {
    title: 'CBSE Compliance Audit',
    subtitle: 'Mandatory Disclosure Inspection',
    badge: 'FREE AUDIT 📋',
    priceTag: 'Complimentary Audit',
    description:
      'We offer a complimentary compliance check for school websites to verify alignment with official CBSE Mandatory Disclosure guidelines.',
    whyItWorks:
      'Ensures your school meets all regulatory mandatory disclosure rules hassle-free with proper documentation.',
    icon: 'ShieldCheck',
  },
  {
    title: 'Low Upfront + Annual AMC Model',
    subtitle: 'Flexible Budget Model',
    badge: 'FLEXIBLE AMC 🔄',
    priceTag: '₹25,000 Upfront + ₹8,000/yr AMC',
    description:
      'Opt for a lower initial investment of ₹25,000 upfront combined with an annual ₹8,000 AMC plan for ongoing updates and support.',
    whyItWorks:
      'Provides predictable annual maintenance and ongoing technical support without requiring a large initial capital outlay.',
    icon: 'Clock',
  },
];



// ─── FAQs ────────────────────────────────────────────────────────
export const faqs: FAQ[] = [
  {
    question: 'How much does a website cost?',
    answer:
      'Pricing depends on the number of pages, functionality, design complexity, integrations, and backend requirements. We provide a detailed quote after understanding your specific needs.',
  },
  {
    question: 'Can you build custom software?',
    answer:
      'Yes. We analyze your business requirements first and then plan a custom solution. Every project is scoped, quoted, and built around your actual needs.',
  },
  {
    question: 'Do you develop Android apps?',
    answer:
      'Yes. We develop native Android applications using Java and Kotlin, with proper architecture, testing, and Play Store deployment support.',
  },
  {
    question: 'Do you provide maintenance after delivery?',
    answer:
      'Yes. We offer maintenance and support through annual or project-based plans, covering bug fixes, updates, security patches, and feature additions.',
  },
  {
    question: 'Can you build a School ERP system?',
    answer:
      'Yes. Our school ERP solutions can include modules for admissions, student management, attendance, fees, exams, results, notices, and parent/student portals.',
  },
  {
    question: 'How long does development take?',
    answer:
      'Timeline depends on the project complexity, features, and requirements. A simple website may take 1–2 weeks, while a full ERP system could take 2–4 months. We provide realistic timelines after scoping.',
  },
];

// ─── Process Steps ───────────────────────────────────────────────
export const processSteps: ProcessStep[] = [
  {
    number: '01',
    title: 'Understand',
    description:
      'We discuss your requirements, business goals, and the problem you need solved.',
  },
  {
    number: '02',
    title: 'Plan',
    description:
      'Define features, architecture, timeline, and the right technology for your project.',
  },
  {
    number: '03',
    title: 'Design',
    description:
      'Create the user experience and interface design that serves your users effectively.',
  },
  {
    number: '04',
    title: 'Develop',
    description:
      'Build and integrate the application with clean, tested, and maintainable code.',
  },
  {
    number: '05',
    title: 'Test',
    description:
      'Test functionality, responsiveness, security, and performance before delivery.',
  },
  {
    number: '06',
    title: 'Deploy & Support',
    description:
      'Launch the product and provide ongoing maintenance and support.',
  },
];

// ─── Differentiators ─────────────────────────────────────────────
export const differentiators: Differentiator[] = [
  {
    title: 'Requirement First',
    description:
      'We understand the business problem before writing a single line of code.',
    icon: 'Target',
  },
  {
    title: 'Custom Development',
    description:
      'No unnecessary one-size-fits-all solutions. Every project is built around your needs.',
    icon: 'Puzzle',
  },
  {
    title: 'Transparent Process',
    description:
      'Clear communication, realistic timelines, and no hidden surprises throughout development.',
    icon: 'Eye',
  },
  {
    title: 'Scalable Architecture',
    description:
      'Solutions designed to grow with your requirements without needing a complete rebuild.',
    icon: 'TrendingUp',
  },
  {
    title: 'Responsive Support',
    description:
      'Post-launch assistance, maintenance, and continued technical support when you need it.',
    icon: 'Headphones',
  },
];

// ─── Form Options ────────────────────────────────────────────────
export const serviceOptions = [
  'Website',
  'Web Application',
  'Android App',
  'Custom Software',
  'School ERP',
  'Business Software',
  'API/Backend',
  'Maintenance',
  'Other',
];

export const budgetOptions = [
  'Under ₹25,000',
  '₹25,000 – ₹50,000',
  '₹50,000 – ₹1,00,000',
  '₹1,00,000 – ₹2,00,000',
  '₹2,00,000+',
  'Not sure',
];

export const timelineOptions = [
  'ASAP',
  '1 month',
  '2–3 months',
  '3–6 months',
  'Flexible',
];

export const contactMethods = [
  'Phone',
  'Email',
  'WhatsApp',
];
