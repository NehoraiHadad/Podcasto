import { Send, BrainCircuit, Globe } from "lucide-react";
import React from "react";

const features = [
  {
    icon: <Send className="w-10 h-10 text-primary" />,
    title: "From Telegram to Podcast",
    description: "Effortlessly transform your favorite Telegram channel content into a high-quality, listenable podcast.",
  },
  {
    icon: <BrainCircuit className="w-10 h-10 text-primary" />,
    title: "Professional AI Narration",
    description: "Experience crystal-clear audio with our advanced AI voices, bringing a professional touch to every episode.",
  },
  {
    icon: <Globe className="w-10 h-10 text-primary" />,
    title: "Multi-Language Support",
    description: "Reach a global audience with podcasts generated in multiple languages, breaking down communication barriers.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-16 sm:py-20 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold">Why Podcasto?</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to create, manage, and grow your podcast.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="text-center p-6 border border-muted/30 rounded-lg transition-all duration-300 hover:shadow-lg hover:border-primary/30"
            >
              <div className="flex items-center justify-center h-16 w-16 bg-primary/10 rounded-full mx-auto mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}