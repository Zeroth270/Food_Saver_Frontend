import React, { useState } from 'react';
import { Search, Map, List, Filter } from 'lucide-react';
import FoodCard from '../components/FoodCard';
import Button from '../components/Button';
import { foodListings } from '../data/mockData';

const Discover = () => {
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
    const [searchTerm, setSearchTerm] = useState('');

    const filteredFood = foodListings.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container py-8">
            <div className="mb-6 flex flex-col gap-4">
                <h1 className="text-3xl font-bold">Discover Food Nearby</h1>

                <div className="flex gap-4 flex-wrap">
                    <div className="relative flex-grow max-w-[600px]">
                        <Search size={20} className="text-text-muted absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search by food name or location..."
                            className="w-full pl-12 pr-4 py-3 rounded-full border border-border text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => { }}>
                            <Filter size={18} className="mr-2" /> Initial Filter
                        </Button>

                        <div className="flex bg-border rounded-full p-1">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-4 py-2 rounded-full flex items-center gap-1 transition-all duration-200 ${viewMode === 'list' ? 'bg-white text-primary font-semibold shadow-sm' : 'bg-transparent text-text-muted hover:text-text-main'}`}
                            >
                                <List size={18} /> List
                            </button>
                            <button
                                onClick={() => setViewMode('map')}
                                className={`px-4 py-2 rounded-full flex items-center gap-1 transition-all duration-200 ${viewMode === 'map' ? 'bg-white text-primary font-semibold shadow-sm' : 'bg-transparent text-text-muted hover:text-text-main'}`}
                            >
                                <Map size={18} /> Map
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {viewMode === 'list' ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFood.map(food => (
                        <FoodCard key={food.id} food={food} />
                    ))}
                    {filteredFood.length === 0 && (
                        <p className="col-span-full text-center text-text-muted py-12 text-lg">
                            No food listings found matching your search.
                        </p>
                    )}
                </div>
            ) : (
                <div className="bg-gray-200 h-[500px] rounded-xl flex flex-col items-center justify-center text-text-muted">
                    <Map size={48} className="mb-4 opacity-50" />
                    <p className="font-semibold">Map View Placeholder</p>
                    <p className="text-sm">Show listings on a map here.</p>
                </div>
            )}
        </div>
    );
};

export default Discover;
