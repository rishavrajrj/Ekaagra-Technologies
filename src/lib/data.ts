import type {
  Service,
  Project,
  TechnologyCategory,
  WebsitePlan,
  AdditionalPageTier,
  MaintenanceCoverageInfo,
  DomainExtensionOption,
  PricingTier,
  SchoolSalesStrategy,
  ProjectBenchmark,
  FAQ,
  ProcessStep,
  Solution,
  Differentiator,
  NavItem,
} from './types';

// --- Navigation --------------------------------------------------
export const navItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Our Work', href: '/projects' },
  { label: 'Services', href: '/services' },
  { label: 'Schools', href: '/schools' },
  { label: 'Solutions', href: '/solutions' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

// --- Services ----------------------------------------------------
export const services: Service[] = [
  {
    slug: 'website-development',
    title: 'Website Design & Development',
    shortTitle: 'Websites',
    description:
      'Custom, fast, and conversion-focused websites designed around your business — not generic templates.',
    longDescription:
      'We build fast, responsive, and professionally designed websites that represent your business with authority. From single-page landing sites to multi-section institutional web platforms, every project is built with clean code, proper search foundation, and mobile-first design.',
    icon: 'Globe',
    features: [
      'Custom UI/UX crafted for your brand',
      'Mobile-first responsive architecture',
      'Direct WhatsApp lead capture & inquiry forms',
      'Google Search SEO metadata & clean structure',
    ],
    technologies: ['HTML', 'CSS', 'JavaScript', 'React', 'Next.js', 'Tailwind CSS'],
    useCases: [
      'School and institutional websites',
      'Business, corporate, and service websites',
      'Product and brand showcase websites',
      'Landing pages and promotional campaigns',
    ],
  },
  {
    slug: 'web-application-development',
    title: 'Web Applications & Portals',
    shortTitle: 'Web Apps',
    description:
      'Interactive web applications featuring role-based dashboards, authentication, databases, and automated workflows.',
    longDescription:
      'We develop full-featured web applications tailored to your business processes. From user authentication and role-based admin panels to live database updates, reporting, and external integrations — each application is engineered to handle your specific operations reliably.',
    icon: 'LayoutDashboard',
    features: [
      'Role-based access control & authentication',
      'Interactive admin control panels & user dashboards',
      'Real-time database synchronization & API pipelines',
      'Secure document uploads & automated workflows',
    ],
    technologies: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'PostgreSQL', 'Supabase'],
    useCases: [
      'Internal operations & administrative portals',
      'Customer & client management portals',
      'Booking, reservation & ordering platforms',
      'Data management & reporting systems',
    ],
  },
  {
    slug: 'android-development',
    title: 'Android Applications',
    shortTitle: 'Android Apps',
    description:
      'Native and modern Android mobile applications for businesses, educational institutions, and digital products.',
    longDescription:
      'We build Android applications that are dependable, performant, and designed for real smartphone users. Whether it is an internal management tool for your team or an official app published on the Google Play Store, we build with clean architecture, offline capabilities, and smooth touch interactions.',
    icon: 'Smartphone',
    features: [
      'Native Android architecture (Kotlin & Java)',
      'Push notifications & instant announcements',
      'Google Play Store release preparation & listing',
      'Offline local storage & fast touch interactions',
    ],
    technologies: ['Java', 'Kotlin', 'Android SDK', 'REST APIs'],
    useCases: [
      'Institutional mobile apps for schools & colleges',
      'Field management & employee mobile tools',
      'Customer-facing digital products & apps',
      'Brand companion & notification apps',
    ],
  },
  {
    slug: 'school-erp',
    title: 'School ERP Systems',
    shortTitle: 'School ERP',
    description:
      'Comprehensive school management platforms covering admissions, attendance, fees, exams, notices, and parent portals.',
    longDescription:
      'Our School ERP platform enables educational institutions to manage daily academic and administrative operations digitally. From student admissions and instant fee receipts to attendance tracking, examination grading, and report card publishing — the platform eliminates manual bottlenecks and connects administration, teachers, students, and parents in real time.',
    icon: 'GraduationCap',
    features: [
      'Multi-role access (Admin, Principal, Teacher, Parent, Student)',
      'Fee collection, dues tracking & instant receipt engine',
      'Attendance tracking, examination grading & report cards',
      'Live institutional notice board & parent communication',
    ],
    technologies: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'PostgreSQL', 'Supabase'],
    useCases: [
      'K-12 schools & high schools',
      'Coaching academies & tuition institutes',
      'Colleges & vocational training centers',
      'Educational foundations & multi-branch trusts',
    ],
  },
  {
    slug: 'custom-software',
    title: 'Custom Business Software',
    shortTitle: 'Custom Software',
    description:
      'Bespoke software systems engineered specifically around your organization’s unique operational workflows.',
    longDescription:
      'Off-the-shelf software often forces your business to adapt to its limitations. We analyze your exact business model and engineer custom software that handles your specific workflows, data, and reporting — giving your organization a tailored system that scales with growth.',
    icon: 'Code2',
    features: [
      'Operational workflow automation modules',
      'Custom database design & reporting pipelines',
      'Multi-user role permissions & audit trails',
      'Staff training, documentation & ongoing enhancements',
    ],
    technologies: ['React', 'Next.js', 'Java', 'Spring Boot', 'PostgreSQL', 'MySQL'],
    useCases: [
      'Business process automation platforms',
      'Coaching & institute management systems',
      'Distributor & inventory operations software',
      'Specialized enterprise workflow tools',
    ],
  },
  {
    slug: 'business-solutions',
    title: 'Business Solutions',
    shortTitle: 'Business Solutions',
    description:
      'Practical software solutions including inventory tracking, custom billing, CRM, and management dashboards.',
    longDescription:
      'We build practical management software that helps businesses operate with clarity. If you need to track stock levels, manage customer relationships, generate GST invoices, or monitor daily sales, we build software tailored around your exact operations.',
    icon: 'Building2',
    features: [
      'Custom billing & GST-ready invoicing',
      'Real-time inventory & stock tracking',
      'Customer relationship management (CRM)',
      'Employee records & activity tracking',
      'Daily sales & financial overview dashboards',
      'Multi-user access with permission controls',
      'Data backup & export capabilities',
      'Connected WhatsApp customer communication',
    ],
    technologies: ['React', 'Next.js', 'TypeScript', 'PostgreSQL', 'MySQL', 'Supabase'],
    useCases: [
      'Retailers, hardware stores & wholesalers',
      'Service businesses & consulting agencies',
      'Manufacturing & distribution units',
      'Growing small and medium enterprises',
    ],
  },
  {
    slug: 'api-development',
    title: 'Backend & API Development',
    shortTitle: 'API & Backend',
    description:
      'Secure APIs, database architecture, authentication systems, and cloud backend services.',
    longDescription:
      'Every dependable application requires a stable, secure backend. We architect and build RESTful APIs, database structures, authentication mechanisms, and integration pipelines that power web and mobile applications smoothly.',
    icon: 'Server',
    features: [
      'RESTful API architecture & documentation',
      'Relational database design (PostgreSQL / MySQL)',
      'Authentication & token authorization',
      'Third-party API & payment integrations',
      'Secure file storage & cloud asset management',
      'Transactional email & notification services',
      'Data validation & security safeguards',
      'Scalable cloud deployment & monitoring',
    ],
    technologies: ['Java', 'Spring Boot', 'PostgreSQL', 'MySQL', 'Supabase', 'REST APIs'],
    useCases: [
      'Mobile application backends',
      'Web application APIs & integrations',
      'Data synchronization services',
      'Microservice & backend infrastructure',
    ],
  },
  {
    slug: 'maintenance',
    title: 'Maintenance & Technical Support',
    shortTitle: 'Maintenance',
    description:
      'Ongoing technical care, security updates, bug fixing, hosting support, and feature improvements.',
    longDescription:
      'Digital products require continuous care to stay secure and fast. We provide dependable technical maintenance to keep your websites and software running reliably — handling updates, monitoring uptime, resolving issues promptly, and adding new features as your needs evolve.',
    icon: 'Wrench',
    features: [
      'Proactive security updates & dependency patches',
      'Bug fixes & technical troubleshooting',
      'Performance monitoring & speed optimization',
      'Database maintenance & automated backups',
      'Hosting & domain management assistance',
      'Feature iterations & page additions',
      'Direct technical consultation & support',
      'Clear annual maintenance agreements (AMC)',
    ],
    technologies: ['Modern Web Stacks', 'Cloud Infrastructure', 'Hosting Platforms'],
    useCases: [
      'Ongoing website maintenance & updates',
      'Web application support & enhancements',
      'Server, hosting & domain management',
      'Long-term digital technology partnership',
    ],
  },
];

// --- Solutions (Industry-Specific) --------------------------------
export const solutions: Solution[] = [
  {
    id: 'education',
    title: 'Schools & Education',
    industry: 'Education & Academics',
    tagline: 'Inspire parents and streamline admissions, notices, and academics.',
    description:
      'Complete school web platforms and ERP systems featuring online admissions, mandatory CBSE disclosures, dynamic notice boards, fee collection, and parent portals.',
    businessProblem:
      'Schools often struggle with manual paperwork, disjointed parent communication, and difficulty keeping circulars, admissions guidelines, and compliance documents up to date.',
    features: [
      'Online Admissions & Parent Inquiries',
      'CBSE Mandatory Disclosure Ready',
      'Dynamic Notice Board & Circulars',
      'Campus Facilities & Photo Gallery',
      'Fee Collection & Digital Receipts',
      'Parent & Student Mobile Portals',
    ],
    icon: 'GraduationCap',
    badge: 'High Demand',
    accent: 'bg-indigo-500/10 text-[#4338CA] border-[#4338CA]/20',
    exampleProjectSlug: 'roshani-public-school',
  },
  {
    id: 'business',
    title: 'Business & Corporate',
    industry: 'Corporate & Services',
    tagline: 'Build authority, showcase capabilities, and capture qualified leads.',
    description:
      'Professional corporate websites and B2B platforms designed to establish instant trust, showcase verified service catalogs, and capture client inquiries directly on WhatsApp.',
    businessProblem:
      'Businesses frequently lose potential clients due to outdated websites, slow mobile load times, unclear service offerings, and complicated inquiry forms.',
    features: [
      'Verified Service & Product Showcase',
      'Direct WhatsApp & Click-to-Call Lead Capture',
      'GST Invoicing & Workflow Tools',
      'Client Testimonials & Case Studies',
      'Google Maps & Location Integration',
      'Mobile-First Responsive Layout',
    ],
    icon: 'Building2',
    badge: 'Conversion Focused',
    accent: 'bg-teal-500/10 text-teal-700 border-teal-500/20',
    exampleProjectSlug: 'palak-enterprises',
  },
  {
    id: 'healthcare',
    title: 'Healthcare & Clinics',
    industry: 'Healthcare & Medical',
    tagline: 'Build patient trust with doctor profiles and online appointment requests.',
    description:
      'Reassuring, clear websites for clinics, hospitals, and practitioners featuring doctor specialties, OPD consultation schedules, patient guidance, and emergency contact links.',
    businessProblem:
      'Patients need immediate clarity on doctor availability, OPD timings, specialties, and emergency lines without navigating complicated, cluttered interfaces.',
    features: [
      'Doctor Specialties & Qualification Profiles',
      'OPD Timings & Direct Appointment Requests',
      'Patient Guidelines & Pre-Visit FAQs',
      'Emergency Contact & Ambulance Direct Dial',
      'Diagnostic Services & Department Overviews',
      'Location, Landmarks & Directions',
    ],
    icon: 'Stethoscope',
    badge: 'Trust Building',
    accent: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  },
  {
    id: 'restaurant',
    title: 'Restaurants & Cafes',
    industry: 'Dining & Hospitality',
    tagline: 'Engage food lovers with interactive menus, reservations, and takeout orders.',
    description:
      'Appetizing websites for restaurants, cafes, and dining outlets featuring categorized digital food menus with prices, online table booking, and direct WhatsApp ordering.',
    businessProblem:
      'Dining customers want to quickly browse food menus, check prices, see photos of the ambiance, reserve a table, or place a takeout order from their phone.',
    features: [
      'Interactive Digital Menu with Prices',
      'Table Reservation & Booking Engine',
      'Direct WhatsApp Takeaway Ordering',
      'Opening Hours, Google Maps & Directions',
      'Chef Specials & Seasonal Highlights',
      'Customer Reviews & Photo Highlights',
    ],
    icon: 'Utensils',
    badge: 'Appetizing UI',
    accent: 'bg-orange-500/10 text-[#F97360] border-[#F97360]/20',
  },
  {
    id: 'retail',
    title: 'Retail & Local Stores',
    industry: 'Retail & Wholesale',
    tagline: 'Showcase inventory and drive foot traffic and direct WhatsApp orders.',
    description:
      'Modern product showcase websites for boutiques, hardware suppliers, stationery stores, and wholesalers with digital catalogs, festival offers, and direct stock inquiries.',
    businessProblem:
      'Local retailers miss out on customers who research products online before visiting or who want to check stock availability and wholesale rates remotely.',
    features: [
      'Digital Product Showcase & Categorized Catalog',
      'Direct WhatsApp Stock & Price Inquiries',
      'Store Location, Landmark & Business Hours',
      'Festival Offers & Promotional Announcements',
      'B2B Wholesale Inquiry Options',
      'Send & Pick Up in Shop Workflow',
    ],
    icon: 'ShoppingBag',
    badge: 'Product Catalog',
    accent: 'bg-amber-500/10 text-amber-800 border-amber-500/20',
  },
  {
    id: 'coaching',
    title: 'Coaching & Institutes',
    industry: 'Coaching & Academies',
    tagline: 'Attract students with proven results, faculty profiles, and course schedules.',
    description:
      'High-impact websites for competitive exam academies and coaching centers to showcase topper results, faculty credentials, batch timetables, and demo class registrations.',
    businessProblem:
      'Institutes need to present their academic track record, faculty authority, and upcoming batch details clearly to convince prospective students and parents.',
    features: [
      'Upcoming Batch Timetables & Fee Details',
      'Topper Results Wall & Testimonials',
      'Downloadable Syllabus & Study Material',
      'Free Demo Class & Scholarship Registration',
      'Faculty Profiles & Subject Expertise',
      'Direct WhatsApp Academic Counseling',
    ],
    icon: 'BookOpen',
    badge: 'Lead Magnet',
    accent: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  },
  {
    id: 'startup',
    title: 'Startups & Modern Tech',
    industry: 'Startups & Digital Tech',
    tagline: 'Present your product clearly and convert visitors into active users.',
    description:
      'Sleek landing pages and web applications for innovative tech products featuring interactive feature previews, transparent pricing comparisons, and fast onboarding.',
    businessProblem:
      'Early-stage products need to explain their value proposition in seconds, demonstrate credibility, and provide a friction-free conversion funnel.',
    features: [
      'Product Storytelling & Benefit Cards',
      'Interactive Product Demos & Feature Highlights',
      'Transparent Pricing Tier Comparisons',
      'Fast User Onboarding & Waitlist Signups',
      'Modern Tech Stack & Sub-500ms Load Times',
      'Clean Analytics & Lead Attribution',
    ],
    icon: 'Rocket',
    badge: 'High Impact',
    accent: 'bg-purple-500/10 text-purple-700 border-purple-200',
    exampleProjectSlug: 'sparknest-academy',
  },
];

// --- Projects (Real Work Showcase) -------------------------------
export const projects: Project[] = [
  {
    slug: 'roshani-public-school',
    title: 'Roshani Public School',
    shortLabel: 'Roshani',
    category: 'Website',
    badge: 'Education Portal',
    description:
      'Institutional school website featuring admissions guidelines, academic programs, CBSE mandatory disclosures, dynamic notice board, and photo galleries.',
    overview:
      'A comprehensive school website designed to serve as the digital face of Roshani Public School. The website provides prospective parents, students, and the community with essential institutional information, academics, facilities, and direct admissions workflows.',
    problem:
      'The school needed an official digital presence to communicate admissions criteria, academic programs, circulars, and mandatory regulatory disclosures to parents — eliminating reliance on physical circulars.',
    solution:
      'We built a professional, mobile-friendly school website with dedicated sections for admissions, academics, campus facilities, photo gallery, and a live notice board. School staff can update notices and announcements independently.',
    approach:
      'We selected a modern Next.js static site architecture paired with Tailwind CSS and cloud edge hosting rather than a generic WordPress theme. This was engineered for sub-second loading speeds on local 4G mobile networks, zero plugin security vulnerabilities, and an intuitive hierarchy for CBSE mandatory compliance documentation.',
    outcome:
      'Successfully launched a 12-section institutional web portal providing verified CBSE public disclosure archives, an active digital notice board, and online admission enquiry workflows connecting parents directly with school administration.',
    features: [
      'Admissions guidelines & online enquiry workflow',
      'Academic curriculum & faculty overviews',
      'CBSE compliance & mandatory disclosure repository',
      'Real-time digital notice board & announcements',
      'Campus facilities tour & high-resolution photo gallery',
      'Direct contact, phone & WhatsApp enquiry links',
      'Mobile-first responsive design with fast page loads',
    ],
    technologies: ['HTML', 'CSS', 'JavaScript', 'React', 'Next.js', 'Tailwind CSS'],
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
    shortLabel: 'SparkNest',
    category: 'Web Application',
    badge: 'EdTech Web App',
    description:
      'Modern tech learning platform featuring course catalogs, student learning interfaces, curriculum previews, and enrollment workflows.',
    overview:
      'SparkNest Academy is an online educational web platform designed to provide students with structured technical learning content, interactive curriculum roadmaps, and a clear path toward industry skill development.',
    problem:
      'Students and learners required a clean, distraction-free platform to explore courses, view detailed curriculum modules, and understand learning pathways.',
    solution:
      'We developed a responsive web application that organizes technical education content into structured courses, allowing prospective students to explore curriculum details, mentors, and program outcomes with ease.',
    approach:
      'Engineered a modern React and Next.js frontend with clean typography, fast asset loading, and distraction-free module previews tailored for technical course exploration.',
    outcome:
      'Successfully launched a student curriculum preview platform that presents educational course roadmaps and captures prospective learner counseling requests.',
    features: [
      'Course catalog & curriculum roadmap organization',
      'Student learning interface & program details',
      'Clean distraction-free user experience',
      'Mobile-responsive layout optimized for fast reading',
      'Direct enrollment & inquiry conversion paths',
    ],
    technologies: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
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
    shortLabel: 'Palak',
    category: 'Web Application',
    badge: 'B2B & Print Shop',
    description:
      'Digital printing and online service platform featuring document uploads, customizable print orders, Razorpay payment gateway, and order tracking.',
    overview:
      'A comprehensive digital printing and CSC service web application engineered for Palak Enterprises in Chakia, Bihar. The platform modernizes print shop workflows by enabling customers to upload files directly, choose print specifications, make online payments, and track order status in real time — reducing in-shop counter wait times.',
    problem:
      'Local customers experienced long counter wait times for routine document printing, urgent photos, and online services. Manual file sharing via USB drives created operational bottlenecks during peak hours.',
    solution:
      'We designed and developed an intuitive "Send • Choose • Collect" web platform. Users can securely upload documents from mobile or desktop, select precise print settings (B&W/color, copies, paper size), pay via Razorpay or at pickup, and monitor order processing live.',
    approach:
      'Designed a mobile-first "Send • Choose • Collect" workflow using TypeScript, React, and Supabase cloud storage. Integrated Razorpay payment gateway to allow customers to pre-pay and bypass counter queues.',
    outcome:
      'Modernized print shop workflows in Chakia by replacing manual USB drive handovers with direct document uploads, instant online payments, and live order tracking.',
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
    image: '/images/projects/palak-enterprises/palak-1.png',
    images: [
      '/images/projects/palak-enterprises/palak-1.png',
    ],
    liveUrl: 'https://www.palakenterprises.shop/',
  },
  {
    slug: 'palak-id-studio',
    title: 'Palak ID Studio',
    shortLabel: 'ID Studio',
    category: 'Web Application',
    badge: 'ID Card Design SaaS',
    description:
      'Cloud-based ID card design and batch production platform featuring drag-and-drop template editing, dynamic student data fields, Excel roster import, and automated print sheet generation.',
    overview:
      'Palak ID Studio is an advanced cloud-based identity card design and batch production platform engineered for institutional printing and corporate ID management. The studio empowers schools, colleges, and print enterprises to create pixel-perfect ID card templates, import student rosters via Excel, bind live dynamic photos and barcodes, and export industrial-grade 600 DPI print sheets ready for dual-sided PVC printing.',
    problem:
      'Designing and printing hundreds of institutional identity cards individually was manual, error-prone, and caused major production bottlenecks. Formatting student records, cropping photos, aligning barcodes, and ensuring precise print bleed margins across custom cards delayed delivery schedules.',
    solution:
      'We engineered Palak ID Studio — an intuitive, browser-based vector design suite with 0.5mm precision snapping, Excel roster data binding, dual-sided rendering (front and back), dynamic QR/barcode generation, and one-click bulk print sheet compilation ready for industrial press.',
    approach:
      'Built a responsive HTML5 vector canvas studio with real-time state persistence, IndexedDB offline support, instant Excel file parsing, and 600 DPI print output generation with automated bleed and alignment guides.',
    outcome:
      'Streamlined institutional card production by reducing turnaround time from days to minutes, eliminating manual layout errors across thousands of student ID cards.',
    features: [
      'Interactive Vector Template Studio with 0.5mm Precision Snapping',
      'Excel Roster Import & Dynamic Custom Field Mapping',
      'Dual-Sided Card Design (Portrait & Landscape Support)',
      'Automated Student Photo, Logo & Signature Placement',
      'Dynamic QR Code & Barcode Verification Engine',
      'High-Resolution 600 DPI Print Sheet & PDF Export',
      'Offline-Ready Editing with Local IndexedDB State Persistence',
      'Instant Print-Readiness Scoring & Automated Safety Bleed Guides',
    ],
    technologies: ['React', 'TypeScript', 'Tailwind CSS', 'IndexedDB', 'HTML5 Canvas', 'SheetJS', 'Vercel'],
    image: '/images/projects/palak-id-studio/palak-id-studio-1.png',
    images: [
      '/images/projects/palak-id-studio/palak-id-studio-1.png',
    ],
    liveUrl: 'https://idcard.palakenterprises.shop/',
  },
  {
    slug: 'roshani-public-school-erp',
    title: 'Roshani Public School ERP',
    shortLabel: 'ERP',
    category: 'School ERP',
    badge: 'Institutional ERP',
    description:
      'School management ERP platform featuring multi-role authentication (Admin, Principal, Teacher, Accountant, Parent, Student), student records, attendance tracking, and fee management.',
    overview:
      'A full-scale School Enterprise Resource Planning (ERP) web application engineered for Roshani Public School to digitize and automate daily operational workflows. The system centralizes academic administration, live attendance tracking, fee payment processing with instant receipt generation, examination grading with digital report cards, and role-based communication across 6 dedicated user portals.',
    problem:
      'Managing academic records, fee reconciliations, daily attendance tracking, report cards compilation, and parent notices via physical registers and disconnected spreadsheets caused operational bottlenecks and administrative delays.',
    solution:
      'We engineered a comprehensive, responsive School Management ERP platform built on Next.js, React, and Supabase / PostgreSQL. With fine-grained Role-Based Access Control (RBAC), the platform provides tailored dashboards for administrators, faculty, accountants, parents, and students, automating routine processes and enabling instant data synchronization.',
    approach:
      'Architected a robust 6-role Role-Based Access Control (RBAC) structure separating Admin, Principal, Teacher, Accountant, Parent, and Student modules on a PostgreSQL / Supabase backend.',
    outcome:
      'Successfully digitized administrative and academic operations, eliminating manual paperwork across student records, daily attendance tracking, fee receipts, and examination grading.',
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
    image: '/images/projects/roshani-public-school-erp/roshani-erp-1.png',
    images: [
      '/images/projects/roshani-public-school-erp/roshani-erp-1.png',
    ],
    liveUrl: 'https://roshani-public-school-erp.vercel.app/login',
    isFrameRestricted: true,
  },
  {
    slug: 'bankgeu',
    title: 'BankGeu',
    category: 'Desktop Application',
    description:
      'Java-based banking application demonstrating account management, balance inquiries, and secure transaction workflows.',
    overview:
      'BankGeu is a desktop banking management application built with Java and MySQL, demonstrating core banking workflows including account creation, balance management, and transaction history tracking.',
    problem:
      'Demonstrating reliable transactional processing, data integrity, and structured account balance management in a desktop environment.',
    solution:
      'We developed a Java-based desktop application implementing fundamental banking operations with a focus on data integrity, transaction accuracy, and a clear user interface.',
    features: [
      'Account creation and profile management',
      'Balance inquiry and account statement generation',
      'Transaction processing with ledger updates',
      'Transaction history log with search filters',
      'Secure user authentication and credentials check',
    ],
    technologies: ['Java', 'MySQL', 'JDBC'],
    image: '/images/projects/bankgeu.jpg',
  },
  {
    slug: 'gameverse',
    title: 'GameVerse',
    category: 'Desktop Application',
    description:
      'Java-based multi-game application demonstrating interactive GUI architecture and game logic implementation.',
    overview:
      'GameVerse is a desktop application built with Java Swing that consolidates multiple classic interactive games into a single desktop experience, showcasing clean OOP architecture and graphical interface design.',
    problem:
      'Building an engaging multi-game desktop application that demonstrates modular Java GUI capabilities, responsive controls, and unified score tracking.',
    solution:
      'We built a Java application featuring multiple classic games with smooth graphics, keyboard controls, and a unified game selection menu.',
    features: [
      'Multiple classic games in a single suite',
      'Interactive Java Swing graphical interface',
      'Unified game selection launcher',
      'Real-time score tracking and state management',
      'Smooth keyboard controls and animations',
    ],
    technologies: ['Java', 'Java Swing', 'AWT'],
    image: '/images/projects/gameverse.png',
  },
];

// --- Technologies ------------------------------------------------
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
      { name: 'Tailwind CSS', category: 'frontend' },
    ],
  },
  {
    name: 'Backend',
    key: 'backend',
    technologies: [
      { name: 'Java', category: 'backend' },
      { name: 'Spring Boot', category: 'backend' },
      { name: 'REST APIs', category: 'backend' },
      { name: 'Node.js', category: 'backend' },
    ],
  },
  {
    name: 'Database',
    key: 'database',
    technologies: [
      { name: 'PostgreSQL', category: 'database' },
      { name: 'Supabase', category: 'database' },
      { name: 'MySQL', category: 'database' },
    ],
  },
  {
    name: 'Mobile',
    key: 'mobile',
    technologies: [
      { name: 'Android SDK', category: 'mobile' },
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

// --- Maintenance Coverage Definition -----------------------------
export const maintenanceCoverage: MaintenanceCoverageInfo = {
  tagline: 'Keeping your website properly deployed, live, and operational.',
  definition:
    'Maintenance means keeping the existing website properly deployed, live, and operational during the active plan period.',
  included: [
    'Deployment issue resolution and continuous uptime monitoring',
    'Website availability and server connectivity troubleshooting',
    'Basic hosting, cloud platform, and SSL certificate support',
    'Existing functionality bug fixes and code stability checks',
    'Basic production technical fixes and browser compatibility checks',
    'Keeping the existing project live, operational, and accessible',
    'Basic technical and security dependency updates where appropriate',
  ],
  notIncluded: [
    'New pages, layout additions, or content creation',
    'New custom features or advanced application logic',
    'Major visual redesigns or brand makeovers',
    'E-commerce systems, inventory engines, or payment gateways',
    'Custom backend software or external API buildouts',
    'Advanced monthly SEO campaigns or link-building outreach',
  ],
  disclaimer:
    'Maintenance keeps your current project stable and operational. New features, extra pages, or structural redesigns are priced transparently as separate add-ons.',
};

// --- Additional Page Tiers ----------------------------------------
export const additionalPageTiers: AdditionalPageTier[] = [
  {
    id: 'simple-info',
    type: 'Simple Information Page',
    price: 199,
    priceDisplay: '₹199',
    badge: 'Basic',
    description: 'Clean, structured informational pages for fundamental business context or compliance disclosures.',
    examples: ['About Us', 'Contact Page', 'Privacy Policy', 'Terms of Service', 'Basic FAQ Page'],
  },
  {
    id: 'standard-designed',
    type: 'Standard Designed Page',
    price: 299,
    priceDisplay: '₹299',
    badge: 'Popular',
    description: 'Custom-designed presentation pages showcasing core offerings, customer proof, or visual highlights.',
    examples: ['Services Overview', 'Products Showcase', 'Photo Gallery', 'Our Team', 'Client Testimonials'],
  },
  {
    id: 'advanced-custom',
    type: 'Advanced / Custom Page',
    price: 499,
    priceDisplay: '₹499',
    badge: 'Custom',
    description: 'Specialized page structures featuring multi-section content, interactive elements, or structured tables.',
    examples: ['Detailed Pricing Tables', 'Interactive Filter Grid', 'Multi-Step Inquiry Form', 'Resource Center'],
  },
  {
    id: 'professional-animated',
    type: 'Professional / Animated Page',
    price: 999,
    priceDisplay: '₹999',
    badge: 'Premium UI',
    description: 'High-impact visual pages engineered with bespoke styling, fluid micro-interactions, and premium motion.',
    examples: ['Interactive Product Showcase', 'Storytelling Brand Presentation', 'Dynamic Portfolio Experience', 'Interactive Roadmap'],
  },
];

export const additionalPagesDisclaimer =
  'Highly complex functionality, custom applications, or advanced interactive systems may require a separate quotation.';

// --- Configurable Domain Allowances ------------------------------
export const planDomainAllowances: Record<string, number> = {
  'free-launch': 0,
  'launch-plus': 300,
  'starter': 500,
  'website-development': 500,
  'school-website': 300,
  'school-website-cms': 500,
  'school-erp': 500,
  'school-complete': 750,
};

// --- Domain Extensions Context & Suitability ---------------------
export const domainExtensionOptions: DomainExtensionOption[] = [
  {
    extension: '.in',
    category: 'india',
    suitability: 'India-focused businesses, schools, and local enterprises.',
    description: 'The premier national standard domain for Indian organizations.',
  },
  {
    extension: '.co.in',
    category: 'india',
    suitability: 'Indian commercial brands and registered companies.',
    description: 'Established commercial domain extension in India.',
  },
  {
    extension: '.com',
    category: 'global',
    suitability: 'Global branding, multi-market ventures, and universal recognition.',
    description: 'The world’s most recognized and trusted top-level domain.',
  },
  {
    extension: '.org',
    category: 'institutional',
    suitability: 'Institutions, schools, academies, trusts, and non-profits.',
    description: 'Trusted extension for institutions and community organizations.',
  },
  {
    extension: '.co',
    category: 'tech',
    suitability: 'Modern startups, tech companies, and innovative brands.',
    description: 'Sleek, global brand extension popular among tech ventures.',
  },
];

export const domainPricingStrategy = {
  startingFromText: 'Domains starting from ₹150/year*',
  paidPlanAllowanceNote: 'Choose any available domain within your plan\'s included price allowance.',
  upgradeHeadline: 'Want a higher-tier domain? Upgrade and pay only the difference.',
  disclaimer:
    'Domain pricing depends on extension, availability, registrar pricing, promotions, premium status, and renewal rates.',
};

// --- Website Launch & Growth Plans -------------------------------
export const websitePlans: WebsitePlan[] = [
  {
    id: 'free-launch',
    name: 'Free Launch',
    price: 0,
    priceDisplay: '₹0',
    duration: '3 months',
    pages: '1',
    badge: 'Special Launch Offer',
    tagline: 'Get your professional business landing page live for 3 months with ₹0 upfront cost.',
    description:
      'Perfect for new businesses, local shops, and independent professionals establishing their first verified online presence.',
    domainIncluded: false,
    domainAllowance: planDomainAllowances['free-launch'],
    domainDetails: 'Basic production hosting on an Ekaagra-provided URL (e.g. business.ekaagratechnologies.site). Custom domain not included.',
    seoIncluded: false,
    maintenanceIncluded: true,
    maintenanceNote: 'Basic maintenance required to keep the existing project live and operational.',
    features: [
      '1 Professional Responsive Landing Page',
      'Mobile and Desktop Fluid Optimization',
      'Verified Business Information & Intro',
      'Services & Products Highlight Section',
      'Contact Section & Direct Inquiries',
      'Direct WhatsApp CTA & Click-to-Call Buttons',
      'Fast Production Hosting on Ekaagra Subdomain',
      '✓ Maintenance Included (Uptime & Deployment Stability)',
    ],
    notIncluded: [
      'Custom Domain (Ekaagra URL provided)',
      'Basic SEO (Titles, Meta, Sitemap, Schema)',
      'Advanced SEO Campaigns',
      'Additional Pages',
      'Major Redesigns & Custom Software',
    ],
    ctaText: 'Claim Free Landing Page',
    ctaHref: '/get-quote?plan=free-launch',
    upgradeNote: 'Enjoyed your free landing page? Keep it online for a full year with a standard domain allowance for just ₹499.',
  },
  {
    id: 'launch-plus',
    name: 'Launch Plus',
    price: 499,
    priceDisplay: '₹499/year',
    duration: '1 year',
    pages: '1',
    badge: 'Best Annual Value',
    tagline: 'Keep your landing page live for a full year with an official custom domain.',
    description:
      'The direct upgrade from Free Launch. Designed for businesses ready for an annual digital home on their own domain.',
    domainIncluded: true,
    domainAllowance: planDomainAllowances['launch-plus'],
    domainDetails: '1 Standard Domain Included — Choose any available domain within your plan\'s ₹300/year allowance. Upgrade and pay only difference.',
    seoIncluded: false,
    maintenanceIncluded: true,
    maintenanceNote: 'Basic maintenance ensuring existing website remains live and operational all year.',
    features: [
      '1 Professional Responsive Landing Page',
      '1-Year Fast Production Cloud Hosting',
      '1 Standard Domain Included (Within Plan Allowance)',
      'Mobile and Desktop Device Optimization',
      'Complete Business Profile & Offerings',
      'Contact Section with Direct Lead Capture',
      'WhatsApp CTA & Direct Phone Triggers',
      '✓ Maintenance Included (Deployments & Availability Fixes)',
    ],
    notIncluded: [
      'Basic SEO (On-page search optimization)',
      'Advanced SEO Campaigns',
      'Additional Pages',
      'Major Redesign & Bespoke Functionality',
    ],
    ctaText: 'Keep My Website for ₹499',
    ctaHref: '/get-quote?plan=launch-plus',
    upgradeNote: 'Need 3–5 pages with search engine setup? Upgrade to the Starter Website for ₹999/yr.',
  },
  {
    id: 'starter',
    name: 'Starter Website',
    price: 999,
    priceDisplay: '₹999/year',
    duration: '1 year',
    pages: '3–5',
    badge: 'Recommended',
    highlighted: true,
    tagline: 'Comprehensive 3–5 page business website with basic search engine setup and domain included.',
    description:
      'The gold standard starting package for local companies, schools, clinics, and professional firms building credibility.',
    domainIncluded: true,
    domainAllowance: planDomainAllowances['starter'],
    domainDetails: '1 Standard Domain Included — Choose any available domain within your plan\'s ₹500/year allowance. Upgrade and pay only difference.',
    seoIncluded: true,
    seoDetails: [
      'SEO-friendly semantic HTML structure',
      'Optimized page titles and meta descriptions',
      'Proper heading hierarchy (H1, H2, H3)',
      'Descriptive image alt text & clean URL slugs',
      'Canonical URLs, dynamic sitemap, and robots.txt',
      'Basic Schema.org structured data markup',
      'Mobile-friendly responsive implementation',
      'Basic Search Console setup/verification where technically appropriate',
    ],
    maintenanceIncluded: true,
    maintenanceNote: 'Basic maintenance keeping the existing website properly deployed, live, and operational.',
    features: [
      '3–5 Professional Custom Pages',
      '1-Year Production Cloud Hosting & SSL',
      '1 Standard Domain Included (Within Plan Allowance)',
      'Responsive Mobile & Desktop Architecture',
      'Professional Business Website Structure',
      '✓ Basic SEO Included (On-page, Sitemap, Meta, Schema)',
      '✓ Maintenance Included (Operational Stability & Bug Fixes)',
      'Interactive WhatsApp & Lead Capture Integration',
    ],
    notIncluded: [
      'Guaranteed Google Rankings (No artificial ranking guarantees)',
      'Advanced Monthly SEO Link-Building Campaigns',
      'Custom Database Portals or E-Commerce Engines',
      'Unlimited New Feature Engineering',
    ],
    ctaText: 'Get Started for ₹999',
    ctaHref: '/get-quote?plan=starter',
    upgradeNote: 'Looking for dynamic databases or portals? Explore our Web Applications package.',
  },
];

// --- Pricing Tiers (Higher-Tier & Bespoke Packages) -------------
export const pricingTiers: PricingTier[] = [
  {
    title: 'Website Design & Development',
    startingFrom: '₹15,000',
    description: 'Professional responsive websites for schools, institutions, local brands, and businesses.',
    badge: 'Custom Corporate Package',
    scopeAlignment: 'Ideal for 5–10 page custom websites with bespoke branding, fast load speeds, and clean structure.',
    features: [
      '5–10 Page Custom Responsive Layout',
      '1 Standard Domain & Production Hosting Support',
      '✓ Maintenance Included (Deployments & Operational Fixes)',
      '✓ Basic SEO & Security Header Configuration',
      'Contact & WhatsApp Enquiry Systems',
      'CBSE Compliance / Disclosure Ready (for schools)',
      'Upgrade Path to Dynamic Web App Available',
    ],
    cta: 'Get a Quote',
  },
  {
    title: 'Web Applications',
    startingFrom: '₹30,000',
    description: 'Interactive web applications with admin control panel, dynamic notices, gallery, and cloud database.',
    highlighted: true,
    badge: 'Most Popular',
    scopeAlignment:
      'Interactive web applications with admin portal, dynamic content management, role permissions, and database backend.',
    features: [
      'Public Portal + Admin Control Panel',
      'Live Notice Board & Dynamic Photo Gallery',
      'Enquiries & Leads Database Management',
      'Supabase / PostgreSQL Database Backend',
      'Role-Based Admin Permissions',
      'Fast Modern Tech Stack & Edge Hosting',
    ],
    cta: 'Get a Quote',
  },
  {
    title: 'Android Applications',
    startingFrom: '₹30,000',
    description: 'Native Android mobile applications and Google Play Store listings for institutions and businesses.',
    badge: 'Mobile Package',
    scopeAlignment: 'Native Android applications or WebView-based institutional app packages.',
    pricingOptions: [
      'Native Android App: Starting ₹30,000',
      'WebView Add-on (with Web App): +₹8,000 to +₹12,000',
    ],
    features: [
      'Google Play Store Listing Preparation',
      'Native Android Architecture (Java/Kotlin)',
      'Push Notifications & Announcements',
      'WebView App Companion Option',
      'Official Mobile Brand Presence',
    ],
    cta: 'Get a Quote',
  },
  {
    title: 'Custom Software',
    startingFrom: '₹40,000',
    description: 'Bespoke software systems engineered around specific operational workflows and business requirements.',
    badge: 'Bespoke Solution',
    scopeAlignment: 'Bespoke software engineered around custom business processes and operational workflows.',
    features: [
      'Custom Workflow Automation Modules',
      'Coaching & Institute Management Modules',
      'Distributor & Inventory Workflows',
      'Custom Database & API Architecture',
      'Staff Training & System Documentation',
    ],
    cta: 'Get a Quote',
  },
  {
    title: 'School ERP',
    startingFrom: '₹80,000 / Flexible Model',
    description: 'Complete school management software covering admissions, fee receipts, attendance, exams, and parent portals.',
    badge: 'Flexible ERP Models',
    scopeAlignment: 'Complete school management: student admissions, fee receipts, attendance, exams, report cards, parent portals.',
    pricingOptions: [
      'Option A (One-Time License): Starting ₹80,000 for full institutional deployment',
      'Option B (Per-Student SaaS): ₹15 – ₹25 per student / month',
      'Option C (Hybrid AMC): ₹25,000 setup + annual maintenance agreement',
    ],
    features: [
      'Student & Staff Profile Management',
      'Fee Collection & Instant Receipt Engine',
      'Attendance Tracking, Exams & Report Cards',
      'Parent & Student Mobile Portals',
      'Flexible SaaS or One-Time Purchase Models',
    ],
    cta: 'Get a Quote',
  },
  {
    title: 'Business Solutions',
    startingFrom: 'Custom Quote',
    description: 'Tailored billing, inventory tracking, CRM, and multi-user systems for stores, distributors, and enterprises.',
    badge: 'Tailored Solution',
    scopeAlignment: 'Tailored billing systems, inventory tracking, CRM, and multi-user business tools.',
    features: [
      'Custom Billing & GST Invoicing Modules',
      'Real-Time Stock & Inventory Tracking',
      'Customer Relationship Management (CRM)',
      'Multi-User Access & Permission Roles',
      'Daily Financial & Operations Reports',
    ],
    cta: 'Get a Quote',
  },
];

export const projectPricingBenchmark: ProjectBenchmark = {
  projectName: 'Roshani Public School Project',
  category: 'Web Applications (Tier 2)',
  scope: '23 Total Pages (12 Public + 11 Admin Portal) + Supabase DB + Live Notices / Gallery / Enquiries',
  fairPrice: '₹32,000 – ₹38,000 Base',
  amcRate: '₹6,000 / year AMC',
  highlights: [
    '12 Public pages (Home, About, Academics, Mandatory Disclosure, Admissions, Gallery, Contact)',
    '11 Admin Portal pages for notice management, photo gallery upload, student enquiries & settings',
    'Supabase database integration for instant notice publishing without editing code',
    'Modern tech stack delivering high performance, fast loading, and zero code overhead for client',
  ],
};

export const schoolSalesStrategies: SchoolSalesStrategy[] = [
  {
    title: 'The "Prestige Combo" Bundle',
    subtitle: 'Website + Google Play Store App',
    badge: 'FEATURED BUNDLE 🚀',
    priceTag: '₹38,000 Bundle Offer',
    description:
      'Combine a full institutional Web Application (₹30,000) with an official Google Play Store Android App add-on (₹12,000) into a single high-impact institutional package.',
    whyItWorks:
      'Gives educational institutions and businesses maximum visibility across both Web and Mobile platforms on Google Play Store.',
    icon: 'Smartphone',
  },
  {
    title: 'CBSE Compliance Audit',
    subtitle: 'Mandatory Disclosure Review',
    badge: 'FREE AUDIT 📋',
    priceTag: 'Complimentary Audit',
    description:
      'We provide a complimentary compliance check for school websites to verify alignment with official CBSE Mandatory Disclosure guidelines.',
    whyItWorks:
      'Ensures your school meets all regulatory mandatory disclosure rules hassle-free with proper documentation structure.',
    icon: 'ShieldCheck',
  },
  {
    title: 'Low Upfront + Annual AMC Model',
    subtitle: 'Flexible Budget Model',
    badge: 'FLEXIBLE AMC 🔄',
    priceTag: '₹25,000 Upfront + ₹8,000/yr AMC',
    description:
      'Opt for a lower initial investment combined with an annual AMC plan for ongoing updates, backups, and technical support.',
    whyItWorks:
      'Provides predictable annual maintenance and ongoing technical support without requiring a large initial capital outlay.',
    icon: 'Clock',
  },
];

// --- FAQs --------------------------------------------------------
export const faqs: FAQ[] = [
  {
    question: 'Who owns the website and source code after launch?',
    answer:
      'You have 100% full ownership of your custom website, source code, and registered domain. We never lock you into proprietary closed platforms or hostage contracts.',
  },
  {
    question: 'Do you configure the domain, cloud hosting, and SSL certificate?',
    answer:
      'Yes, we provide end-to-end setup. We assist with domain registration/pointing, configure secure SSL certificates, and deploy your site to fast global cloud networks.',
  },
  {
    question: 'How long does the entire development process take?',
    answer:
      'A custom responsive website typically takes 1–2 weeks. Web applications take 2–4 weeks, while full-scale School ERP systems take 1–2 months depending on required modules.',
  },
  {
    question: 'How do revisions and project reviews work?',
    answer:
      'We work in transparent milestones. Before anything goes live, you test the complete system on a private live staging link and request adjustments until you give final sign-off.',
  },
  {
    question: 'Do you provide maintenance and support after launch?',
    answer:
      'Yes. Every launch includes post-go-live care. We also offer predictable Annual Maintenance Contracts (AMC) covering software updates, backups, security patches, and ongoing feature additions.',
  },
  {
    question: 'Can you redesign our existing outdated website?',
    answer:
      'Yes. We rebuild outdated or slow websites with modern UI/UX, mobile-first performance, and SEO structure while safeguarding your existing brand equity and URL indexation.',
  },
];

// --- Process Steps -----------------------------------------------
export const processSteps: ProcessStep[] = [
  {
    number: '01',
    title: 'Discover',
    description:
      'We understand your business model, target audience, brand vision, and exact requirements.',
  },
  {
    number: '02',
    title: 'Direction',
    description:
      'Define the sitemap, page hierarchy, key conversion triggers, and functional scope.',
  },
  {
    number: '03',
    title: 'Design',
    description:
      'Craft the visual interface, typography, color palette, and tailored UI layouts.',
  },
  {
    number: '04',
    title: 'Develop',
    description:
      'Build the application with clean, responsive, and maintainable code with database integration.',
  },
  {
    number: '05',
    title: 'Review & Approval',
    description:
      'You test the complete system on a private live staging link and give final approval.',
  },
  {
    number: '06',
    title: 'Launch & Support',
    description:
      'Deploy to fast edge hosting, configure SSL, link your custom domain, and provide ongoing care.',
  },
];

// --- Differentiators ---------------------------------------------
export const differentiators: Differentiator[] = [
  {
    title: 'Requirement First',
    description:
      'We understand the business problem before writing code, ensuring the website solves real operational needs.',
    icon: 'Target',
  },
  {
    title: 'Custom Craftsmanship',
    description:
      'Every layout is designed specifically for your brand and audience — zero generic boilerplate templates.',
    icon: 'Puzzle',
  },
  {
    title: 'Transparent Process',
    description:
      'Clear communication, realistic timelines, and client review checkpoints before anything goes live.',
    icon: 'Eye',
  },
  {
    title: 'Scalable Architecture',
    description:
      'Built on modern foundations that can grow from a simple website into portals, ERP, or mobile apps.',
    icon: 'TrendingUp',
  },
  {
    title: 'Dedicated Support',
    description:
      'Post-launch assistance, maintenance agreements, and responsive technical help when you need it.',
    icon: 'Headphones',
  },
];

// --- Form Options ------------------------------------------------
export const serviceOptions = [
  'Free Launch Landing Page (₹0 / 3 Mo)',
  'Launch Plus Website (₹499/yr)',
  'Starter Website (₹999/yr)',
  'Website Design & Development',
  'Web Applications',
  'Android Applications',
  'Custom Software',
  'School ERP',
  'Business Solutions',
  'Backend & API Development',
  'Maintenance & Support',
  'Other',
];

export const budgetOptions = [
  'Free Launch (₹0 for 3 Months)',
  '₹499 – ₹999 (Launch Plus / Starter Website)',
  '₹1,000 – ₹5,000 (Starter with Add-ons)',
  '₹15,000 – ₹25,000',
  '₹25,000 – ₹50,000',
  '₹50,000 – ₹1,00,000',
  '₹1,00,000 – ₹2,00,000',
  '₹2,00,000+',
  'Not sure / Request Quote',
];

export const timelineOptions = [
  'Immediate (ASAP)',
  'Within 2–4 weeks',
  '1–2 months',
  '2–3 months',
  'Flexible',
];

export const contactMethods = [
  'Phone Call',
  'WhatsApp',
  'Email',
];

export const contactMethodOptions = contactMethods;
