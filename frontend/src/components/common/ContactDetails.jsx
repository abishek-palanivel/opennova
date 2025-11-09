import React, { useState } from 'react';

const ContactDetails = () => {
    const [showContactForm, setShowContactForm] = useState(false);
    const [expandedSections, setExpandedSections] = useState({});
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });

    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle form submission
        console.log('Contact form submitted:', formData);
        setShowContactForm(false);
        setFormData({ name: '', email: '', message: '' });
    };

    const ContactModal = () => {
        if (!showContactForm) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-900">Contact Us</h3>
                        <button
                            onClick={() => setShowContactForm(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="input-field"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="input-field"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleInputChange}
                                rows="4"
                                className="input-field"
                                required
                            ></textarea>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                type="button"
                                onClick={() => setShowContactForm(false)}
                                className="flex-1 btn-outline"
                            >
                                Cancel
                            </button>
                            <button type="submit" className="flex-1 btn-primary">
                                Send Message
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="card">
                <div className="relative z-10">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                            <span className="text-white text-3xl">📞</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Get in Touch</h2>
                        <p className="text-slate-600 font-medium">We're here to help you 24/7</p>
                    </div>
                </div>

                <div className="relative z-10 space-y-6">
                    {/* Email Section */}
                    <div className="expandable-section" onClick={() => toggleSection('email')}>
                        <div className="bg-gradient-to-r from-blue-50 via-blue-50/50 to-indigo-50 p-8 rounded-3xl border border-blue-100/50 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-lg">
                                        <span className="text-white text-2xl">📧</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 text-xl">Email Support</p>
                                        <p className="text-blue-600 font-semibold text-lg">abishekopennova@gmail.com</p>
                                    </div>
                                </div>
                                <div className="text-blue-600 text-2xl">
                                    {expandedSections.email ? '−' : '+'}
                                </div>
                            </div>
                            <div className={`section-content mt-6 ${expandedSections.email ? 'section-expanded' : 'section-collapsed'}`}>
                                <div className="bg-white/70 p-6 rounded-2xl">
                                    <h4 className="font-bold text-slate-900 mb-4">Contact Information</h4>
                                    <div className="space-y-3">
                                        <p className="text-slate-700"><strong>Primary Email:</strong> abishekopennova@gmail.com</p>
                                        <p className="text-slate-700"><strong>Response Time:</strong> Within 2-4 hours</p>
                                        <p className="text-slate-700"><strong>Best for:</strong> General inquiries, support requests, partnerships</p>
                                        <div className="mt-4">
                                            <a href="mailto:abishekopennova@gmail.com" className="btn-primary inline-block">
                                                Send Email →
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* LinkedIn Section */}
                    <div className="expandable-section" onClick={() => toggleSection('linkedin')}>
                        <div className="bg-gradient-to-r from-blue-50 via-indigo-50/50 to-purple-50 p-8 rounded-3xl border border-indigo-100/50 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-lg">
                                        <span className="text-white text-2xl">💼</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 text-xl">LinkedIn Profile</p>
                                        <p className="text-indigo-600 font-semibold text-lg">Professional Network</p>
                                    </div>
                                </div>
                                <div className="text-indigo-600 text-2xl">
                                    {expandedSections.linkedin ? '−' : '+'}
                                </div>
                            </div>
                            <div className={`section-content mt-6 ${expandedSections.linkedin ? 'section-expanded' : 'section-collapsed'}`}>
                                <div className="bg-white/70 p-6 rounded-2xl">
                                    <h4 className="font-bold text-slate-900 mb-4">Professional Connect</h4>
                                    <div className="space-y-3">
                                        <p className="text-slate-700"><strong>Platform:</strong> LinkedIn Professional Network</p>
                                        <p className="text-slate-700"><strong>Best for:</strong> Business partnerships, professional networking</p>
                                        <p className="text-slate-700"><strong>Response Time:</strong> 1-2 business days</p>
                                        <div className="mt-4">
                                            <a href="https://www.linkedin.com/in/abishek-p-9ab80a326?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3Bs3vPSDQzRUu1Vq3KZGI6Ew%3D%3D" className="btn-primary inline-block" target="_blank" rel="noopener noreferrer">
                                                Connect on LinkedIn →
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Phone Section */}
                    <div className="expandable-section" onClick={() => toggleSection('phone')}>
                        <div className="bg-gradient-to-r from-green-50 via-green-50/50 to-emerald-50 p-8 rounded-3xl border border-green-100/50 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-3xl flex items-center justify-center shadow-lg">
                                        <span className="text-white text-2xl">📞</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 text-xl">Phone Support</p>
                                        <p className="text-green-600 font-semibold text-lg">+91 98765 43210</p>
                                    </div>
                                </div>
                                <div className="text-green-600 text-2xl">
                                    {expandedSections.phone ? '−' : '+'}
                                </div>
                            </div>
                            <div className={`section-content mt-6 ${expandedSections.phone ? 'section-expanded' : 'section-collapsed'}`}>
                                <div className="bg-white/70 p-6 rounded-2xl">
                                    <h4 className="font-bold text-slate-900 mb-4">Call Support</h4>
                                    <div className="space-y-3">
                                        <p className="text-slate-700"><strong>Phone:</strong> +91 98765 43210</p>
                                        <p className="text-slate-700"><strong>Available:</strong> Mon-Fri, 9 AM - 6 PM IST</p>
                                        <p className="text-slate-700"><strong>Best for:</strong> Urgent support, technical issues</p>
                                        <div className="mt-4">
                                            <a href="tel:+919876543210" className="btn-primary inline-block">
                                                Call Now →
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Location Section */}
                    <div className="expandable-section" onClick={() => toggleSection('location')}>
                        <div className="bg-gradient-to-r from-purple-50 via-purple-50/50 to-pink-50 p-8 rounded-3xl border border-purple-100/50 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg">
                                        <span className="text-white text-2xl">📍</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 text-xl">Visit Us</p>
                                        <p className="text-purple-600 font-semibold text-lg">OpenNova Headquarters</p>
                                    </div>
                                </div>
                                <div className="text-purple-600 text-2xl">
                                    {expandedSections.location ? '−' : '+'}
                                </div>
                            </div>
                            <div className={`section-content mt-6 ${expandedSections.location ? 'section-expanded' : 'section-collapsed'}`}>
                                <div className="bg-white/70 p-6 rounded-2xl">
                                    <h4 className="font-bold text-slate-900 mb-4">Office Location</h4>
                                    <div className="space-y-3">
                                        <p className="text-slate-700"><strong>Address:</strong> 123 Business District, Tech City</p>
                                        <p className="text-slate-700"><strong>Hours:</strong> Mon-Fri, 9 AM - 6 PM</p>
                                        <p className="text-slate-700"><strong>Best for:</strong> In-person meetings, demos</p>
                                        <div className="mt-4">
                                            <button className="btn-primary">
                                                Get Directions →
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setShowContactForm(true)}
                            className="btn-primary text-sm py-3"
                        >
                            💬 Contact Us
                        </button>
                        <button className="btn-outline text-sm py-3">
                            📚 Help Center
                        </button>
                    </div>

                    <div className="mt-4 text-center">
                        <p className="text-xs text-gray-500">
                            Average response time: <span className="font-medium text-green-600">2 minutes</span>
                        </p>
                    </div>
                </div>
            </div>

            <ContactModal />
        </>
    );
};

export default ContactDetails;