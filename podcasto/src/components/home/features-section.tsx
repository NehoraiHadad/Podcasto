"use client";

import { motion } from 'framer-motion';
import { Send, Headphones, Globe } from 'lucide-react';

const features = [
  {
    icon: <Send className="h-8 w-8 sm:h-10 sm:w-10 text-white" />,
    title: 'Telegram Based',
    description: 'Effortlessly create podcasts directly from your favorite Telegram channels.',
  },
  {
    icon: <Headphones className="h-8 w-8 sm:h-10 sm:w-10 text-white" />,
    title: 'High-Quality Audio',
    description: 'Enjoy crystal-clear audio with our professional-grade sound processing.',
  },
  {
    icon: <Globe className="h-8 w-8 sm:h-10 sm:w-10 text-white" />,
    title: 'Multi-Language Support',
    description: 'Reach a global audience with support for a wide range of languages.',
  },
];

const cardVariants = {
  offscreen: {
    y: 50,
    opacity: 0,
  },
  onscreen: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      bounce: 0.4,
      duration: 0.8,
    },
  },
};

const FeatureCard = ({ icon, title, description, index }: (typeof features[0] & { index: number })) => (
  <motion.div
    className="bg-gray-900/50 p-6 sm:p-8 rounded-2xl shadow-lg flex flex-col items-center text-center"
    initial="offscreen"
    whileInView="onscreen"
    viewport={{ once: true, amount: 0.5 }}
    variants={cardVariants}
    transition={{ delay: index * 0.2 }}
    whileHover={{ y: -10, transition: { type: 'spring', stiffness: 300 } }}
  >
    <div className="mb-4 p-3 sm:p-4 bg-purple-600/20 rounded-full">
      {icon}
    </div>
    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{title}</h3>
    <p className="text-white/70 text-sm sm:text-base">{description}</p>
  </motion.div>
);

export function FeaturesSection() {
  return (
    <section className="bg-black py-16 sm:py-20 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          className="text-3xl sm:text-4xl font-bold text-center mb-10 sm:mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
        >
          Behind the Scenes
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} {...feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
