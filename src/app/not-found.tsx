import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gray-50 py-16 px-4 sm:px-6 lg:px-8 text-center">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-9xl font-extrabold text-blue-600 tracking-tight">404</h1>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Page Not Found
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            The page you're looking for doesn't exist or may have moved.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Link 
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Back to Home
          </Link>
          <Link 
            href="/services"
            className="inline-flex items-center justify-center rounded-md bg-white border border-gray-300 px-6 py-3 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            View Services
          </Link>
        </div>
      </div>
    </div>
  );
}
