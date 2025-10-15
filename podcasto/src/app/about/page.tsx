import { MainLayout } from "@/components/layout/main-layout";

export const metadata = {
  title: "About Podcasto",
  description: "Learn about Podcasto - your audio content platform",
};

export default function AboutPage() {
  return (
    <MainLayout>
      <section className="relative h-full bg-gradient-to-br from-indigo-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 text-center">
            About Podcasto
          </h1>
          
          <div className="bg-white rounded-lg shadow-md p-6 md:p-8 mb-8">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4">
              Our Mission
            </h2>
            <p className="text-gray-600 mb-6">
              Podcasto transforms news and content from Telegram channels into professional podcasts, 
              delivering information directly to you in an accessible audio format.
            </p>

            <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4">
              What We Offer
            </h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
              <li>Personalized podcast content based on your interests</li>
              <li>High-quality audio conversion from text sources</li>
              <li>Accessible listening experience across devices</li>
              <li>Regular content updates from your favorite channels</li>
            </ul>

            <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4">
              Contact
            </h2>
            <p className="text-gray-600">
              Have questions or feedback? Reach out to our team at 
              <a href="mailto:support@Podcasto.org" className="text-indigo-600 hover:text-indigo-800 ml-1">
                support@Podcasto.org
              </a>
            </p>
          </div>
        </div>
      </section>
    </MainLayout>
  );
} 