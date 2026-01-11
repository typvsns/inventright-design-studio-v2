import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';

export default function Home() {
  const services = [
    {
      title: 'Sell Sheet',
      price: '$249',
      description: 'This is a one-page marketing piece for your product idea. There are different styles and templates available depending on your needs.',
      image: 'https://inventright.com/wp-content/uploads/2023/02/sellsheetsmple.png',
      link: createPageUrl('JobIntake')
    },
    {
      title: 'Virtual Prototype',
      price: '$499',
      description: 'This is a life-like 3D rendering of your product idea created by our designers. Available with an Augmented-Reality upgrade for an interactive 360 view.',
      image: 'https://inventright.com/wp-content/uploads/2023/02/vpsample.png',
      link: createPageUrl('JobIntake')
    },
    {
      title: 'Design Package',
      price: '$669',
      description: 'Save over $75 When Combined. This premium design package includes a Virtual Prototype and Sell Sheet.',
      badge: 'Best Value',
      image: 'https://inventright.com/wp-content/uploads/2023/02/designpkg.png',
      link: createPageUrl('DesignPackageOrder')
    },
    {
      title: 'Line Drawings',
      price: '$30 Each',
      description: 'Work with a designer to create clear, concise illustrations that show the features and details of your product. Each order has a 3 drawing minimum.',
      image: 'https://inventright.com/wp-content/uploads/2023/02/linedrawsmple.jpg',
      link: createPageUrl('JobIntake')
    }
  ];

  const prototypeImages = [
    'https://inventright.com/wp-content/uploads/2025/02/treadmill.jpg',
    'https://inventright.com/wp-content/uploads/2025/02/phone.jpg',
    'https://inventright.com/wp-content/uploads/2025/02/hammer.jpg',
    'https://inventright.com/wp-content/uploads/2025/02/P22.jpg',
    'https://inventright.com/wp-content/uploads/2025/02/P21.jpg',
    'https://inventright.com/wp-content/uploads/2025/02/P20.jpg'
  ];

  const testimonials = [
    {
      text: "I recently finished my provisional patent application, phew 😅 it was rough. I agonized and sweated it and had late nights of worry. With the encouragement of Terry my coach, It's done! My next big win is I just received my video with the voice over and the sell sheet. WOW! It's really happening! My very own commercial! It's so exciting to see it come to life.",
      author: 'Andrea T'
    },
    {
      text: "I've worked with an array of freelance engineers and designers over the years. Nothing has compared to my experience with your Design Studio! The completed designs of my virtual prototype are beyond extraordinary. The team did a remarkable job on execution. Absolute home run!",
      author: 'Nathan S'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#4791FF] to-[#3680ee] text-white py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Turn Your Ideas Into Reality
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-4xl mx-auto">
            Have a great product idea but don't know where to start? We create custom physical prototypes tailored to your specifications—whether a "looks-like" or "works-like" model. Bring your idea to life and showcase its market potential.
          </p>
          <Link to={createPageUrl('JobIntake')}>
            <Button size="lg" className="bg-white text-[#4791FF] hover:bg-white/90 text-lg px-8 py-6">
              Get Started Today
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Our Services Header */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-[#4791FF] mb-16">
            Our Services
          </h2>

          {/* From Sketch to Digital Prototype */}
          <div className="grid md:grid-cols-2 gap-8 items-center mb-16">
            <div className="bg-[#4791FF] text-white rounded-2xl p-12">
              <h3 className="text-3xl font-bold mb-4">
                From Sketch to Digital Prototype
              </h3>
              <p className="text-lg mb-6 text-white/90">
                Got an idea on a napkin? We'll turn it into a high-quality 3D computer-generated prototype, giving you a clear vision of your product.
              </p>
              <a href="https://inventright.com/virtual-prototype-samples/" target="_blank" rel="noopener noreferrer">
                <Button 
                  className="bg-white text-[#4791FF] hover:text-white font-semibold border-2 border-white"
                >
                  VIEW MORE SAMPLES
                </Button>
              </a>
            </div>
            
            <div className="overflow-hidden relative h-64">
              <style>{`
                @keyframes scrollHorizontal {
                  from {
                    transform: translateX(0);
                  }
                  to {
                    transform: translateX(-50%);
                  }
                }
                .carousel-scroll-horizontal {
                  display: flex;
                  gap: 1rem;
                  animation: scrollHorizontal 15s linear infinite;
                  width: max-content;
                }
              `}</style>
              <div className="carousel-scroll-horizontal">
                {[...prototypeImages, ...prototypeImages].map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Prototype sample ${idx + 1}`}
                    className="h-64 w-auto object-cover rounded-lg shadow-lg flex-shrink-0"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Service Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {services.map((service, idx) => (
              <GlassCard key={idx} className="text-center relative">
                {service.badge && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {service.badge}
                  </div>
                )}
                <div className="w-full h-64 flex items-center justify-center mb-4">
                  <img 
                    src={service.image} 
                    alt={service.title}
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                </div>
                <h3 className="text-2xl font-bold text-black mb-2">{service.title}</h3>
                <p className="text-gray-700 mb-4 text-sm min-h-20">{service.description}</p>
                <div className="text-3xl font-bold text-[#4791FF] mb-4">{service.price}</div>
                <Link to={service.link}>
                  <Button className="w-full bg-[#4791FF] hover:bg-[#3680ee] text-white">
                    Get Started
                  </Button>
                </Link>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gradient-to-br from-gray-50 to-gray-100 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, idx) => (
              <GlassCard key={idx} variant="strong">
                <p className="text-gray-700 italic mb-4 leading-relaxed">
                  "{testimonial.text}"
                </p>
                <p className="text-black font-bold text-right">— {testimonial.author}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#4791FF] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Let's turn your vision into a reality.
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Contact us today to get started!
          </p>
          <p className="text-2xl font-semibold mb-8">
            Call us at 1-800-701-7993 to Talk About Your Prototype!
          </p>
          <a href="https://inventright.com/contact/" target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="bg-white text-[#4791FF] hover:bg-white/90 text-lg px-8 py-6">
              Contact Us Today
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
}