import type { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, ArrowRight, Calendar, Clock, BookOpen } from 'lucide-react';
import { blogPosts } from '@/lib/blog-data';
import { createPageMetadata, webPageSchema, SITE_URL } from '@/lib/seo.config';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = createPageMetadata({
  title: 'Blog & Web Development Guides | Ekaagra Technologies Motihari',
  description:
    'Helpful guides on website development costs, school websites, digital strategies, and software architecture for businesses and schools in Motihari, Bihar.',
  path: '/blog',
});

export default function BlogPage() {
  return (
    <div className="bg-[#FAF7F2] text-[#131B2E] min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webPageSchema({
              name: 'Blog & Resources — Ekaagra Technologies',
              description:
                'Educational guides and resources on web development, school technology, and digital strategy in Motihari, Bihar.',
              url: `${SITE_URL}/blog`,
            })
          ),
        }}
      />
      <div className="site-container pt-6 pb-2">
        <Breadcrumbs items={[{ label: 'Blog & Guides' }]} />
      </div>

      {/* Hero */}
      <section className="py-12 sm:py-16 border-b border-[#E2E8F0] bg-warm-grid relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4338CA]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="site-container text-center space-y-3 relative z-10">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
            <BookOpen className="w-3.5 h-3.5 text-[#F97360]" />
            INSIGHTS &amp; STRATEGY
          </span>
          <h1 className="fluid-hero-headline font-extrabold text-[#131B2E] tracking-tight">
            Resources for Local Businesses &amp; Schools
          </h1>
          <p className="text-sm sm:text-base text-[#64748B] max-w-2xl mx-auto leading-relaxed">
            Honest advice, pricing breakdowns, and practical digital roadmaps to help you make informed decisions about your technology investments.
          </p>
        </div>
      </section>

      {/* Article Grid */}
      <section className="py-12 sm:py-16 border-b border-[#E2E8F0] bg-[#FAF7F2]">
        <div className="site-container max-w-5xl">
          <div className="grid md:grid-cols-3 gap-6">
            {blogPosts.map((post) => (
              <article
                key={post.slug}
                className="bg-white rounded-2xl border border-[#E2E8F0] p-6 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                    <span className="px-2 py-0.5 bg-[#4338CA]/10 text-[#4338CA] rounded-md">
                      {post.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </span>
                  </div>

                  <h2 className="text-base font-extrabold text-[#131B2E] leading-snug line-clamp-3 hover:text-[#4338CA] transition-colors">
                    <Link href={`/blog/${post.slug}`}>
                      {post.title}
                    </Link>
                  </h2>

                  <p className="text-xs text-[#64748B] leading-relaxed line-clamp-3">
                    {post.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                  <span className="text-[#94A3B8] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(post.datePublished).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="font-bold text-[#4338CA] hover:text-[#3730A3] inline-flex items-center gap-1"
                  >
                    <span>Read Article</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-b from-[#FAF7F2] to-[#F1ECE4] text-center border-b border-[#E2E8F0]">
        <div className="site-container max-w-2xl space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#131B2E]">
            Have a Specific Question?
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            We are always happy to answer technical or pricing questions for businesses and schools in Motihari and Bihar.
          </p>
          <div className="pt-2">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
            >
              <span>Talk to Our Team</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
