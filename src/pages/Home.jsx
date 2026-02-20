import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight, ShieldCheck, Users, HeartHandshake } from 'lucide-react';
import Button from '../components/Button';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div>
            {/* Hero Section */}
            <section className="relative h-[80vh] flex items-center justify-center text-center text-white p-4">
                {/* Background Image with Overlay */}
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center"
                    style={{
                        backgroundImage: 'url("https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&q=80&w=1600")'
                    }}
                >
                    <div className="absolute inset-0 bg-black/50"></div>
                </div>

                <div className="container relative z-10 max-w-3xl fade-in">
                    <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white">
                        Don't Waste, Share the Joy.
                    </h1>
                    <p className="text-lg md:text-xl text-white/90 mb-8">
                        Connect surplus food from weddings, parties, and canteens with those who need it.
                        Join our mission to bridge the gap between waste and want.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={() => navigate('/discover')}
                            className="px-8 text-lg"
                        >
                            <MapPin size={20} className="mr-2" />
                            Find Food Near Me
                        </Button>
                        <Button
                            variant="secondary"
                            size="lg"
                            onClick={() => navigate('/post-food')}
                            className="px-8 text-lg"
                        >
                            Post Surplus Food
                        </Button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 bg-background">
                <div className="container">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-2">How It Works</h2>
                        <p className="text-text-light">Simple steps to make a big difference</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-surface p-8 rounded-xl shadow-sm border border-border text-center hover:shadow-md transition-shadow">
                            <div className="text-primary mb-4 flex justify-center">
                                <ShieldCheck size={48} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Save Surplus</h3>
                            <p className="mb-0">Have extra food? Post details about quantity and pickup time easily.</p>
                        </div>

                        <div className="bg-surface p-8 rounded-xl shadow-sm border border-border text-center hover:shadow-md transition-shadow">
                            <div className="text-secondary-dark mb-4 flex justify-center">
                                <Users size={48} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Local Sharing</h3>
                            <p className="mb-0">Connect with local NGOs, volunteers, and people nearby.</p>
                        </div>

                        <div className="bg-surface p-8 rounded-xl shadow-sm border border-border text-center hover:shadow-md transition-shadow">
                            <div className="text-primary mb-4 flex justify-center">
                                <HeartHandshake size={48} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Direct Connect</h3>
                            <p className="mb-0">Coordinate details directly and ensure food reaches the right hands.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-16 bg-primary-light/30">
                <div className="container grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-primary-dark mb-4">Bridging the Gap Between Waste and Want</h2>
                        <p className="text-text-main text-lg mb-6 leading-relaxed">
                            Every day, tons of fresh food go to waste while millions face hunger.
                            FoodShare Connect empowers communities to redistribute surplus food efficiently
                            and safely using technology.
                        </p>
                        <Button variant="primary">
                            Learn How It Works <ArrowRight size={18} className="ml-2" />
                        </Button>
                    </div>
                    <div>
                        <img
                            src="https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=800"
                            alt="Community sharing food"
                            className="rounded-2xl shadow-xl w-full"
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
