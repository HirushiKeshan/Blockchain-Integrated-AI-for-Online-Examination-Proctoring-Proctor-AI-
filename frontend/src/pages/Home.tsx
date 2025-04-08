import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ArrowRight, CheckCircle, Lock, Users, Book, Clock, Menu, X, Bell, Settings, User, MessageCircle, Send } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hi there! Welcome to ProctorAI. How can I help you today?' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const location = useLocation();
  const chatEndRef = useRef(null);

  // Handle scroll for header appearance
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll to the bottom of chat when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleAdminPanel = () => {
    setIsAdminPanelOpen(!isAdminPanelOpen);
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    // Add user message
    setMessages([...messages, { type: 'user', text: inputMessage }]);
    
    // Simulate bot response
    setTimeout(() => {
      let botResponse;
      const userMsg = inputMessage.toLowerCase();
      
      if (userMsg.includes('blockchain') || userMsg.includes('verification')) {
        botResponse = "Our blockchain verification ensures tamper-proof records of all exam results and activities. This provides enhanced security and transparency for all stakeholders.";
      } else if (userMsg.includes('ai') || userMsg.includes('monitoring')) {
        botResponse = "ProctorAI uses advanced computer vision and machine learning to monitor exam sessions in real-time, detecting suspicious activities while respecting privacy.";
      } else if (userMsg.includes('pricing') || userMsg.includes('cost')) {
        botResponse = "We offer flexible pricing plans for institutions of all sizes. Would you like me to connect you with our sales team for a personalized quote?";
      } else if (userMsg.includes('demo')) {
        botResponse = "I'd be happy to arrange a demo for you! Please provide your email, and our team will contact you to schedule a personalized demonstration.";
      } else {
        botResponse = "Thank you for your message. Can you tell me more about what you're looking for so I can better assist you with our exam proctoring solutions?";
      }
      
      setMessages(prevMessages => [...prevMessages, { type: 'bot', text: botResponse }]);
    }, 1000);
    
    // Clear input
    setInputMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Enhanced animations
  const headerVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const mobileMenuVariants = {
    open: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeInOut" } },
    closed: { opacity: 0, x: "-100%", transition: { duration: 0.3, ease: "easeInOut" } },
  };

  const adminPanelVariants = {
    open: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeInOut" } },
    closed: { opacity: 0, y: "-20px", transition: { duration: 0.3, ease: "easeInOut" } },
  };

  const chatbotVariants = {
    open: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: "easeInOut" } },
    closed: { opacity: 0, scale: 0.8, y: 20, transition: { duration: 0.3, ease: "easeInOut" } },
  };

  const featureVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { 
        delay: 0.2 + i * 0.1,
        duration: 0.5
      }
    })
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header - Enhanced with scroll behavior */}
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'py-2 bg-white/90 backdrop-blur-sm shadow-lg' : 'py-4 bg-transparent'
        }`}
        variants={headerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <Shield className={`w-6 h-6 ${isScrolled ? 'text-indigo-600' : 'text-indigo-600'}`} />
              <span className={`text-lg font-bold ${isScrolled ? 'text-gray-800' : 'text-gray-800'}`}>
                ProctorAI
              </span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/" className={`${location.pathname === '/' ? 'text-indigo-600 font-medium' : 'text-gray-700'} hover:text-indigo-600 transition-colors`}>Home</Link>
              <Link to="/features" className={`${location.pathname === '/features' ? 'text-indigo-600 font-medium' : 'text-gray-700'} hover:text-indigo-600 transition-colors`}>Features</Link>
              <Link to="/about" className={`${location.pathname === '/about' ? 'text-indigo-600 font-medium' : 'text-gray-700'} hover:text-indigo-600 transition-colors`}>About</Link>
              
              {/* Admin button with dropdown */}
              <div className="relative">
                <button 
                  onClick={toggleAdminPanel}
                  className="px-4 py-2 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition-colors flex items-center space-x-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Admin</span>
                </button>
                
                <AnimatePresence>
                  {isAdminPanelOpen && (
                    <motion.div
                      className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
                      variants={adminPanelVariants}
                      initial="closed"
                      animate="open"
                      exit="closed"
                    >
                      <div className="p-4 bg-gray-50 border-b border-gray-100">
                        <h3 className="font-medium text-gray-800">Admin Login</h3>
                      </div>
                      <div className="p-4">
                        <form>
                          <div className="mb-4">
                            <input 
                              type="email" 
                              placeholder="Admin Email" 
                              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            />
                          </div>
                          <div className="mb-4">
                            <input 
                              type="password" 
                              placeholder="Password" 
                              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            />
                          </div>
                          <button 
                            type="submit"
                            className="w-full py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
                          >
                            Login
                          </button>
                        </form>
                        <div className="mt-3 text-center">
                          <a href="#" className="text-sm text-indigo-600 hover:underline">Forgot password?</a>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <Link to="/login" className="px-4 py-2 rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors">Login</Link>
              <Link to="/register" className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-md transition-all">Register</Link>
            </nav>

            <button
              className="md:hidden p-2 rounded-lg bg-white/80 hover:bg-white transition-colors duration-200 shadow-sm"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 text-gray-800" />
              ) : (
                <Menu className="w-5 h-5 text-gray-800" />
              )}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="fixed top-0 left-0 right-0 bottom-0 bg-white z-40 pt-20 px-6"
            variants={mobileMenuVariants}
            initial="closed"
            animate="open"
            exit="closed"
          >
            <div className="flex flex-col space-y-6">
              
              <Link to="/" className="text-xl font-medium text-gray-800 hover:text-indigo-600 transition-colors" onClick={toggleMenu}>Home</Link>
              <Link to="/features" className="text-xl font-medium text-gray-800 hover:text-indigo-600 transition-colors" onClick={toggleMenu}>Features</Link>
              <Link to="/about" className="text-xl font-medium text-gray-800 hover:text-indigo-600 transition-colors" onClick={toggleMenu}>About</Link>
              
              {/* Mobile Admin Login */}
              <div className="pt-4 pb-4 border-t border-b border-gray-100">
                <h3 className="text-xl font-medium text-gray-800 mb-4">Admin Login</h3>
                <form>
                  <div className="mb-4">
                    <input 
                      type="email" 
                      placeholder="Admin Email" 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div className="mb-4">
                    <input 
                      type="password" 
                      placeholder="Password" 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                 <link rel="stylesheet" href="./Adminlogin.tsx" /> <button 
                    type="submit"
                    className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Admin Login
                  </button>
                </form>
              </div>
              
              <div className="pt-4">
                <Link to="/login" className="block w-full py-3 px-4 rounded-xl bg-gray-100 text-gray-800 text-center font-medium mb-4" onClick={toggleMenu}>Login</Link>
                <Link to="/register" className="block w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center font-medium" onClick={toggleMenu}>Register</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 pt-32 pb-16">
        {/* Hero Section - Enhanced with better layout and animations */}
        <motion.div 
          className="text-center mb-24"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div 
            className="flex items-center justify-center mb-8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-indigo-100 animate-ping opacity-25"></div>
              <div className="relative bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full p-4">
                <Shield className="w-10 h-10 text-white" />
              </div>
            </div>
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-transparent bg-clip-text">
            Blockchain Integration AI for Online Examination Proctoring
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Advanced AI-powered examination proctoring system with blockchain integration for secure, 
            reliable, and tamper-proof assessment solutions.
          </p>
          {/* Call to Action */}
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Link 
              to="/register"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium shadow-lg shadow-indigo-200 hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              Get Started
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link 
              to="/demo"
              className="inline-flex items-center px-8 py-4 bg-white text-indigo-600 border border-indigo-100 rounded-xl font-medium shadow-sm hover:shadow hover:bg-indigo-50 transition-all duration-200"
            >
              View Demo
            </Link>
          </motion.div>
          
        
        </motion.div>

        {/* Key Features Section - Enhanced with advanced cards */}
        <motion.h2 
          className="text-3xl font-bold text-gray-800 text-center mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Key Features
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {[
            {
              icon: <Lock className="w-8 h-8 text-white" />,
              title: "Blockchain Verification",
              description: "Securely store exam results and verification data on blockchain for tamper-proof assessments.",
              color: "from-indigo-600 to-indigo-500"
            },
            {
              icon: <Clock className="w-8 h-8 text-white" />,
              title: "Real-Time AI Monitoring",
              description: "Powered by advanced computer vision algorithms to detect suspicious activities during exams.",
              color: "from-purple-600 to-purple-500"
            },
            {
              icon: <Book className="w-8 h-8 text-white" />,
              title: "Comprehensive Analytics",
              description: "Detailed reports and insights to improve teaching strategies and assessment quality.",
              color: "from-pink-600 to-pink-500"
            }
          ].map((feature, index) => (
            <motion.div 
              key={index}
              className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 group hover:shadow-2xl transition-all duration-300"
              custom={index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={featureVariants}
            >
              <div className="mb-6">
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} shadow-lg transform group-hover:scale-110 transition-all duration-200`}>
                  {feature.icon}
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* How It Works Section */}
        <motion.div 
          className="mb-24"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-16">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { title: "Setup", description: "Create your exam and set proctoring parameters" },
              { title: "Verification", description: "Students verify identity with multi-factor authentication" },
              { title: "Monitoring", description: "AI monitors student behavior in real-time" },
              { title: "Results", description: "Secure and tamper-proof results stored on blockchain" }
            ].map((step, index) => (
              <motion.div 
                key={index}
                className="text-center relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 shadow-md border border-purple-100">
                  <span className="text-xl font-bold text-indigo-600">{index + 1}</span>
                </div>
                {index < 3 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-[2px] bg-purple-100"></div>
                )}
                <h3 className="text-lg font-bold text-gray-800 mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* User Sections - Educators & Students */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
          <motion.div 
            className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100 mb-6">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold mb-6 text-gray-900">For Educators</h2>
            <ul className="space-y-4">
              {[
                'Create and manage secure online assessments',
                'Real-time monitoring with AI-powered insights',
                'Comprehensive analytics and performance reports',
                'Customizable proctoring settings and policies',
                'Tamper-proof blockchain verification of results'
              ].map((feature, index) => (
                <motion.li 
                  key={index}
                  className="flex items-start space-x-3 text-gray-700"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div 
            className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 mb-6">
              <Book className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold mb-6 text-gray-900">For Students</h2>
            <ul className="space-y-4">
              {[
                'Seamless and intuitive exam experience',
                'Fair and secure testing environment',
                'Simple identity verification process',
                'Technical support available in real-time',
                'Instant feedback and verifiable results'
              ].map((feature, index) => (
                <motion.li 
                  key={index}
                  className="flex items-start space-x-3 text-gray-700"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* CTA Section */}
        <motion.div 
          className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-12 text-center text-white mb-16"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold mb-6">Ready to transform your online examinations?</h2>
          <p className="text-lg text-indigo-100 mb-8 max-w-2xl mx-auto">
            Join thousands of educators worldwide who trust ProctorAI to provide secure and reliable online assessment solutions.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/register"
              className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              Get Started Today
            </Link>
            <Link 
              to="/contact"
              className="px-8 py-4 bg-transparent text-white border border-white/30 rounded-xl font-medium hover:bg-white/10 transition-all duration-200"
            >
              Schedule a Demo
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 py-16 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <Shield className="w-6 h-6 text-indigo-600" />
                <span className="text-xl font-bold text-gray-800">ProctorAI</span>
              </div>
              <p className="text-gray-600 mb-6">
                Advanced AI-powered exam proctoring system with blockchain integration.
              </p>
              <div className="flex space-x-4">
                {['Twitter', 'LinkedIn', 'Facebook'].map((social, index) => (
                  <a key={index} href="#" className="text-gray-400 hover:text-indigo-600 transition-colors">
                    {social}
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-800 mb-4">Product</h3>
              <ul className="space-y-2">
                {['Features', 'Pricing', 'Integrations', 'Documentation'].map((item, index) => (
                  <li key={index}>
                    <a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-800 mb-4">Company</h3>
              <ul className="space-y-2">
                {['About Us', 'Blog', 'Careers', 'Contact'].map((item, index) => (
                  <li key={index}>
                    <a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-800 mb-4">Support</h3>
              <ul className="space-y-2">
                {['Help Center', 'Privacy Policy', 'Terms of Service', 'Status'].map((item, index) => (
                  <li key={index}>
                    <a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-12 pt-8 text-center">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} ProctorAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Chatbot Button */}
<div className="fixed bottom-6 right-6 z-40">
  <button
    className={`w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
      isChatOpen 
        ? 'bg-white border-2 border-indigo-600' 
        : 'bg-gradient-to-r from-indigo-600 to-purple-600'
    }`}
    onClick={toggleChat}
  >
    {isChatOpen ? (
      <X className="w-6 h-6 text-indigo-600" />
    ) : (
      <div className="relative">
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border border-white animate-pulse"></div>
        <div className="bg-white rounded-lg p-1 rotate-45">
          <div className="bg-indigo-600 rounded-md p-1 -rotate-45">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    )}
  </button>
</div>

{/* Chatbot Interface */}
<AnimatePresence>
  {isChatOpen && (
    <motion.div
      className="fixed bottom-24 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-xl z-40 overflow-hidden border border-gray-100"
      variants={chatbotVariants}
      initial="closed"
      animate="open"
      exit="closed"
    >
      {/* Chat Header */}
      <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-1.5 rounded-lg">
              <div className="bg-white rounded-md p-0.5">
                <MessageCircle className="w-4 h-4 text-indigo-600" />
              </div>
            </div>
            <div>
              <h3 className="font-medium">ProctorAI Support</h3>
              <div className="flex items-center text-xs text-indigo-100">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-1.5"></span>
                Online | Typically replies instantly
              </div>
            </div>
          </div>
          <button 
            onClick={toggleChat}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="h-80 overflow-y-auto p-4 bg-gray-50 space-y-3">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
          >
            {msg.type === 'bot' && (
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2 flex-shrink-0">
                <div className="bg-white rounded-sm p-0.5">
                  <MessageCircle className="w-4 h-4 text-indigo-600" />
                </div>
              </div>
            )}
            <div
              className={`p-3 rounded-2xl max-w-xs text-sm ${
                msg.type === 'user'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none shadow-md'
                  : 'bg-white text-gray-800 rounded-bl-none shadow-md border border-gray-100'
              }`}
            >
              {msg.text}
            </div>
            {msg.type === 'user' && (
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center ml-2 flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center space-x-2 bg-gray-50 rounded-xl p-1 border border-gray-200">
          <input
            type="text"
            value={inputMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 bg-transparent text-sm focus:outline-none"
          />
          <button
            onClick={handleSendMessage}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-2 rounded-lg hover:shadow-md transition"
            disabled={!inputMessage.trim()}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>
</div>
);
}