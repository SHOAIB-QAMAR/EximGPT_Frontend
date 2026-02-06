import React, { useState, useEffect } from 'react';
import { FaChevronDown, FaChevronUp } from "react-icons/fa6";

const faqData = [
    {
        question: "What are freight rates and how are they calculated?",
        answer:
            "Freight rates represent the cost of transporting goods via sea, air, or land. They are calculated based on cargo weight, volume, distance, transport mode, carrier type, fuel surcharges, seasonal demand, and current market conditions."
    },
    {
        question: "What is the difference between air freight and sea freight?",
        answer:
            "Air freight is faster and suitable for urgent or high-value goods, while sea freight is more cost-effective for large volumes and non-urgent shipments."
    },
    {
        question: "What is an HSN code and why is it required for trade?",
        answer:
            "An HSN (Harmonized System of Nomenclature) code is a standardized product classification used worldwide for customs clearance, duty calculation, GST application, and regulatory compliance."
    },
    {
        question: "How do I find the correct HSN code for my product?",
        answer:
            "The correct HSN code can be identified based on product material, usage, and composition using customs tariff schedules, government portals, or professional classification tools."
    },
    {
        question: "What information does a vessel schedule provide?",
        answer:
            "A vessel schedule provides details such as vessel name, departure and arrival dates, port rotation, transit time, cut-off dates, and service routes to help plan shipments efficiently."
    },
    {
        question: "What is the difference between FCL and LCL shipments?",
        answer:
            "FCL (Full Container Load) is used when one shipper occupies an entire container, while LCL (Less than Container Load) combines multiple shippers' cargo into a single container."
    },
    {
        question: "How is import duty calculated on imported goods?",
        answer:
            "Import duty is calculated based on the assessable value of goods, applicable HSN code, basic customs duty, IGST, social welfare surcharge, and country of origin benefits under trade agreements."
    },
    {
        question: "What documents are required for import and export?",
        answer:
            "Common documents include Commercial Invoice, Packing List, Bill of Lading or Airway Bill, Shipping Bill, Certificate of Origin, and any product-specific regulatory certificates."
    },
    {
        question: "What are Incoterms and why are they important?",
        answer:
            "Incoterms define the responsibilities of buyers and sellers in international trade, including cost, risk, and delivery obligations, helping avoid disputes and misunderstandings."
    },
    {
        question: "How does real-time shipment tracking work?",
        answer:
            "Real-time tracking uses GPS devices, carrier systems, port updates, and logistics platforms to provide continuous visibility into shipment location and status."
    },
    {
        question: "What is export drawback and who can claim it?",
        answer:
            "Export drawback is a government incentive that refunds certain customs duties and taxes paid on exported goods, allowing eligible exporters to reduce overall costs."
    },
    {
        question: "What are common causes of shipment delays?",
        answer:
            "Shipment delays may occur due to port congestion, customs inspections, weather conditions, documentation errors, vessel rollovers, or peak season demand."
    },
    {
        question: "What is customs clearance and how long does it take?",
        answer:
            "Customs clearance is the process of submitting documents and paying duties to release goods from customs. The timeline varies based on shipment type, compliance, and inspection requirements."
    },
    {
        question: "How do trade agreements affect import duties?",
        answer:
            "Trade agreements reduce or eliminate import duties between participating countries, provided goods meet origin and documentation requirements."
    },
    {
        question: "What is demurrage and detention in shipping?",
        answer:
            "Demurrage is charged for using port storage beyond free time, while detention applies when containers are held outside the port longer than allowed."
    }
];


const FAQ = ({ onFeatureClick }) => {
    const [loaded, setLoaded] = useState(false);
    const [openIndex, setOpenIndex] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => setLoaded(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const toggleItem = (idx) => {
        setOpenIndex(openIndex === idx ? null : idx);
    };

    return (
        <div className="faq-section w-full max-w-4xl mx-auto mt-8 px-4">
            {/* Header */}
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">Frequently asked questions</h3>

            {/* FAQ List */}
            <div className={`flex flex-col border-t border-[var(--border-color)] max-h-[250px] overflow-y-auto custom-scrollbar pr-2 transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
                {faqData.map((item, idx) => {
                    const isOpen = openIndex === idx;
                    return (
                        <div
                            key={idx}
                            className="faq-item border-b border-[var(--border-color)] transition-all duration-300"
                        >
                            {/* Question Header */}
                            <button
                                className="w-full flex items-center justify-between py-5 text-left group"
                                onClick={() => toggleItem(idx)}
                            >
                                <span className={`text-base font-medium transition-colors ${isOpen ? 'text-[var(--brand-primary)]' : 'text-[var(--text-primary)] group-hover:text-[var(--brand-primary)]'}`}>
                                    {item.question}
                                </span>
                                <span className="text-[var(--text-secondary)] text-sm ml-4 transition-transform duration-300">
                                    {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                                </span>
                            </button>

                            {/* Answer Content */}
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-40 opacity-100 mb-5' : 'max-h-0 opacity-0'}`}>
                                <p className="text-base text-[var(--text-secondary)] leading-relaxed">
                                    {item.answer}
                                </p>
                                <button
                                    className="mt-3 text-sm text-[var(--brand-primary)] font-medium hover:underline flex items-center gap-1 opacity-90 hover:opacity-100"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onFeatureClick(item.question);
                                    }}
                                >
                                    Ask about this
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


export default FAQ;
''