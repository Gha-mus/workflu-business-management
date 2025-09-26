/**
 * Landing page component
 */

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            WorkFlu Business Management
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Comprehensive business management system for handling capital, purchases, 
            warehouse operations, shipping, and more.
          </p>
          <div className="space-x-4">
            <a
              href="/login"
              className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Get Started
            </a>
            <a
              href="/dashboard"
              className="inline-block px-8 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
            >
              View Demo
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}