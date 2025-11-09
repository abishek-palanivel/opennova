import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronRightIcon, 
  CheckCircleIcon,
  MapPinIcon,
  ClockIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import OpenNovaLogo from './OpenNovaLogo';

const NewLandingPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);


  const heroSlides = [
    {
      title: "Discover Amazing Places",
      subtitle: "Book your perfect dining, shopping, and healthcare experiences",
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      cta: "Start Exploring"
    },
    {
      title: "Seamless Booking Experience",
      subtitle: "Reserve tables, appointments, and services with just a few clicks",
      image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      cta: "Book Now"
    },
    {
      title: "Trusted by Thousands",
      subtitle: "Join our community of satisfied customers and business owners",
      image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      cta: "Join Today"
    }
  ];

  const features = [
    {
      icon: <MapPinIcon className="h-8 w-8" />,
      title: "Location-Based Discovery",
      description: "Find the best establishments near you with our smart location services"
    },
    {
      icon: <ClockIcon className="h-8 w-8" />,
      title: "Real-Time Availability",
      description: "Check live availability and book instantly without waiting"
    },
    {
      icon: <UserGroupIcon className="h-8 w-8" />,
      title: "Community Reviews",
      description: "Read authentic reviews from verified customers to make informed decisions"
    },
    {
      icon: <ShieldCheckIcon className="h-8 w-8" />,
      title: "Secure Payments",
      description: "Your transactions are protected with bank-level security"
    }
  ];



  const stats = [
    { number: "10,000+", label: "Happy Customers" },
    { number: "500+", label: "Partner Establishments" },
    { number: "50,000+", label: "Successful Bookings" },
    { number: "4.9/5", label: "Average Rating" }
  ];



  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[data-animate]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100' 
          : 'bg-white/80 backdrop-blur-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <OpenNovaLogo className="h-10 w-10 animate-pulse-glow" />
                <SparklesIcon className="h-4 w-4 text-yellow-400 absolute -top-1 -right-1 animate-bounce" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  OpenNova
                </span>
                <span className="text-xs text-gray-500 font-medium tracking-wider">
                  BOOKING PLATFORM
                </span>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="relative text-gray-700 hover:text-blue-600 transition-all duration-300 font-medium group">
                <span className="relative z-10">Features</span>
                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                <span className="absolute inset-0 bg-blue-50 rounded-lg transform scale-0 group-hover:scale-100 transition-transform duration-300 -z-10"></span>
              </a>
              <a href="#contact" className="relative text-gray-700 hover:text-blue-600 transition-all duration-300 font-medium group">
                <span className="relative z-10">Contact</span>
                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                <span className="absolute inset-0 bg-blue-50 rounded-lg transform scale-0 group-hover:scale-100 transition-transform duration-300 -z-10"></span>
              </a>
              <Link 
                to="/login" 
                className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl overflow-hidden group"
              >
                <span className="relative z-10 flex items-center">
                  Get Started
                  <ChevronRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </Link>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-blue-50"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        <div className={`md:hidden transition-all duration-300 ${
          mobileMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
        } overflow-hidden bg-white/95 backdrop-blur-md border-t border-gray-100`}>
          <div className="px-4 py-6 space-y-4">
            <a 
              href="#features" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-gray-700 hover:text-blue-600 transition-colors font-medium py-2"
            >
              Features
            </a>
            <a 
              href="#contact" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-gray-700 hover:text-blue-600 transition-colors font-medium py-2"
            >
              Contact
            </a>
            <Link 
              to="/login" 
              onClick={() => setMobileMenuOpen(false)}
              className="block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold text-center"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden pt-20">
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="absolute inset-0 bg-black/40 z-10"></div>
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 z-20 flex items-center justify-center">
              <div className="text-center text-white max-w-4xl px-4">
                <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in-up">
                  {slide.title}
                </h1>
                <p className="text-xl md:text-2xl mb-8 opacity-90 animate-fade-in-up animation-delay-200">
                  {slide.subtitle}
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transform hover:scale-105 transition-all duration-300 animate-fade-in-up animation-delay-400"
                >
                  {slide.cta}
                  <ChevronRightIcon className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        ))}
        
        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 flex space-x-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center"
                data-animate
                id={`stat-${index}`}
              >
                <div className={`transform transition-all duration-700 ${
                  isVisible[`stat-${index}`] ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                }`}>
                  <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
                    {stat.number}
                  </div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose OpenNova?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the future of booking with our innovative platform designed for modern consumers and businesses
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-xl hover:shadow-xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-105 bg-white border border-gray-100 hover:border-blue-200 group"
                data-animate
                id={`feature-${index}`}
              >
                <div className={`transform transition-all duration-700 delay-${index * 100} ${
                  isVisible[`feature-${index}`] ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                }`}>
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 text-blue-600 rounded-full mb-4 group-hover:from-blue-200 group-hover:to-purple-200 transition-all duration-300 animate-float">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who have already discovered the convenience of OpenNova
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transform hover:scale-105 transition-all duration-300"
            >
              Start Booking Now
              <ChevronRightIcon className="ml-2 h-5 w-5" />
            </Link>
            <a
              href="#contact"
              className="inline-flex items-center justify-center border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Get in Touch
            </h2>
            <p className="text-xl text-gray-600">
              Have questions? We'd love to hear from you
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="space-y-8">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <EnvelopeIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Email</h3>
                    <a 
                      href="mailto:abishekopennova@gmail.com"
                      className="text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      abishekopennova@gmail.com
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <GlobeAltIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">LinkedIn</h3>
                    <a 
                      href="https://www.linkedin.com/in/abishek-p-9ab80a326?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3Bs3vPSDQzRUu1Vq3KZGI6Ew%3D%3D"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Connect with Abishek
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Support</h3>
                    <p className="text-gray-600">24/7 customer support available</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-xl border border-blue-100 shadow-lg">
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-full mb-4">
                  <EnvelopeIcon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Connect with Us
                </h3>
                <p className="text-gray-600 mb-6">
                  Ready to get started? Reach out through any of these channels
                </p>
                
                <div className="space-y-4">
                  <a
                    href="mailto:abishekopennova@gmail.com"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 inline-flex items-center justify-center gap-2"
                  >
                    <EnvelopeIcon className="w-5 h-5" />
                    Send Email
                  </a>
                  
                  <a
                    href="https://www.linkedin.com/in/abishek-p-9ab80a326?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3Bs3vPSDQzRUu1Vq3KZGI6Ew%3D%3D"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-300 inline-flex items-center justify-center gap-2"
                  >
                    <GlobeAltIcon className="w-5 h-5" />
                    Connect on LinkedIn
                  </a>
                </div>
                
                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    We'll get back to you within 24 hours
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <OpenNovaLogo className="h-8 w-8 text-white" />
                <span className="text-xl font-bold">OpenNova</span>
              </div>
              <p className="text-gray-400 mb-4">
                Revolutionizing the way you discover, book, and experience services. 
                Your trusted partner for seamless reservations and exceptional experiences.
              </p>
              <div className="flex space-x-4">
                <a 
                  href="mailto:abishekopennova@gmail.com"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <EnvelopeIcon className="h-6 w-6" />
                </a>
                <a 
                  href="https://www.linkedin.com/in/abishek-p-9ab80a326?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3Bs3vPSDQzRUu1Vq3KZGI6Ew%3D%3D"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <GlobeAltIcon className="h-6 w-6" />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><Link to="/login" className="text-gray-400 hover:text-white transition-colors">Login</Link></li>
                <li><Link to="/register" className="text-gray-400 hover:text-white transition-colors">Register</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#contact" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 OpenNova. All rights reserved. Built with ❤️ by Abishek P.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NewLandingPage;