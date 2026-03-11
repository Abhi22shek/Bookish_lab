"use client"

import Image from "next/image"
import Link from "next/link"

const steps = [
    {
        number: 1,
        title: "Upload PDF",
        description: "Add your book file",
    },
    {
        number: 2,
        title: "AI Processing",
        description: "We analyze the content",
    },
    {
        number: 3,
        title: "Voice Chat",
        description: "Discuss with AI",
    },
]

const HeroSection = () => {
    return (
        <section className="library-hero-card mb-8 md:mb-12" id="hero-section">
            <div className="library-hero-content">
                {/* Left – Heading, description, CTA */}
                <div className="library-hero-text">
                    <h1 className="library-hero-title">Your Library</h1>
                    <p className="library-hero-description">
                        Convert your books into interactive AI conversations.
                        <br className="hidden md:block" />
                        Listen, learn, and discuss your favorite reads.
                    </p>
                    <Link href="/books/new" className="library-cta-primary">
                        <span className="text-xl leading-none">+</span>
                        Add new book
                    </Link>
                </div>

                {/* Center – Hero illustration (mobile + tablet shown above, desktop inline) */}
                <div className="library-hero-illustration">
                    <Image
                        src="/assets/hero-illustration.png"
                        alt="Vintage books, globe and desk lamp illustration"
                        width={280}
                        height={210}
                        className="object-contain"
                        priority
                    />
                </div>
                <div className="library-hero-illustration-desktop">
                    <Image
                        src="/assets/hero-illustration.png"
                        alt="Vintage books, globe and desk lamp illustration"
                        width={340}
                        height={255}
                        className="object-contain"
                        priority
                    />
                </div>

                {/* Right – Steps card */}
                <div className="library-steps-card hidden lg:block">
                    <div className="flex flex-col gap-4">
                        {steps.map((step) => (
                            <div key={step.number} className="library-step-item">
                                <span className="library-step-number">{step.number}</span>
                                <div className="flex flex-col">
                                    <span className="library-step-title">{step.title}</span>
                                    <span className="library-step-description">
                                        {step.description}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default HeroSection
