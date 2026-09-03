import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { blogPosts, getBlogPost } from '@/lib/blog-data';
import { createPageMetadata, articleSchema, SITE_URL } from '@/lib/seo.config';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { Calendar, Clock, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

export function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: 'Article Not Found | Ekaagra Technologies' };

  return createPageMetadata({
    title: `${post.title} | Ekaagra Technologies`,
    description: post.description,
    path: `/blog/${post.slug}`,
    ogType: 'article',
    articlePublishedTime: post.datePublished,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="bg-[#FAF7F2] text-[#131B2E] min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Article Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            articleSchema({
              headline: post.title,
              description: post.description,
              url: `${SITE_URL}/blog/${slug}`,
              datePublished: post.datePublished,
              dateModified: post.dateModified,
            })
          ),
        }}
      />

      <div className="pb-6">
        <Breadcrumbs
          items={[
            { label: 'Blog', href: '/blog' },
            { label: post.title },
          ]}
        />
      </div>

      <article className="space-y-8 bg-white p-6 sm:p-12 rounded-3xl border border-[#E2E8F0] shadow-sm">
        {/* Header */}
        <header className="space-y-4 border-b border-[#E2E8F0] pb-8">
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-[#64748B] uppercase tracking-wider">
            <span className="px-2.5 py-1 bg-[#4338CA]/10 text-[#4338CA] rounded-md">
              {post.category}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(post.datePublished).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {post.readTime}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#131B2E] tracking-tight leading-tight">
            {post.title}
          </h1>

          <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
            {post.description}
          </p>

          <div className="pt-2 text-xs font-semibold text-[#131B2E]">
            Published by{' '}
            <span className="text-[#4338CA]">Ekaagra Technologies Editorial Team</span> • Motihari, Bihar
          </div>
        </header>

        {/* Content Body */}
        <div className="prose prose-slate max-w-none space-y-6 text-[#334155] text-sm sm:text-base leading-relaxed">
          {post.content.split('\n\n').map((paragraph, index) => {
            const trimmed = paragraph.trim();
            if (!trimmed) return null;

            if (trimmed.startsWith('## ')) {
              return (
                <h2
                  key={index}
                  className="text-xl sm:text-2xl font-extrabold text-[#131B2E] pt-6 pb-2 border-b border-[#E2E8F0]/60"
                >
                  {trimmed.replace('## ', '')}
                </h2>
              );
            }

            if (trimmed.startsWith('### ')) {
              return (
                <h3
                  key={index}
                  className="text-lg font-bold text-[#131B2E] pt-4 pb-1"
                >
                  {trimmed.replace('### ', '')}
                </h3>
              );
            }

            if (trimmed.startsWith('---')) {
              return <hr key={index} className="my-6 border-[#E2E8F0]" />;
            }

            if (trimmed.startsWith('- ')) {
              const items = trimmed.split('\n- ').map((item) => item.replace(/^- /, ''));
              return (
                <ul key={index} className="list-disc pl-5 space-y-1.5 text-[#334155]">
                  {items.map((it, i) => (
                    <li key={i}>{it}</li>
                  ))}
                </ul>
              );
            }

            if (/^\d+\.\s/.test(trimmed)) {
              const items = trimmed.split(/\n\d+\.\s/).map((item) => item.replace(/^\d+\.\s/, ''));
              return (
                <ol key={index} className="list-decimal pl-5 space-y-1.5 text-[#334155]">
                  {items.map((it, i) => (
                    <li key={i}>{it}</li>
                  ))}
                </ol>
              );
            }

            // Normal paragraph with basic markdown link rendering if present
            return (
              <p key={index} className="leading-relaxed">
                {trimmed}
              </p>
            );
          })}
        </div>

        {/* Related Services CTA Strip */}
        <div className="mt-12 pt-8 border-t border-[#E2E8F0] space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#64748B]">
            Related Services &amp; Next Steps
          </h3>
          <div className="flex flex-wrap gap-2">
            {post.relatedServices.map((rel, i) => (
              <Link
                key={i}
                href={rel.href}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#FAF7F2] hover:bg-[#F1ECE4] text-[#131B2E] font-semibold text-xs rounded-xl border border-[#E2E8F0] transition-colors"
              >
                <span>{rel.label}</span>
                <ArrowRight className="w-3 h-3 text-[#4338CA]" />
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom Consultation Box */}
        <div className="bg-[#FAF7F2] p-6 sm:p-8 rounded-2xl border border-[#E2E8F0] space-y-4 text-center">
          <h3 className="text-lg font-bold text-[#131B2E]">
            Planning a website or software project in Motihari?
          </h3>
          <p className="text-xs sm:text-sm text-[#64748B] max-w-lg mx-auto">
            Discuss your requirements with Ekaagra Technologies. We provide clear milestone timelines, transparent pricing, and complete code ownership.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/get-quote"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
            >
              <span>Request Free Consultation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 px-4 py-3 text-xs font-bold text-[#64748B] hover:text-[#131B2E]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to All Articles</span>
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
