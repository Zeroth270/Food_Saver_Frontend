import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, MapPin, Clock, Utensils, AlertCircle, RefreshCw, LocateFixed, Loader2, Navigation } from 'lucide-react';
import Button from '../components/Button';
import FoodCard from '../components/FoodCard';
import FoodDetailModal from '../components/FoodDetailModal';
import API_BASE_URL from '../config';

// Haversine formula — returns distance in km between two lat/lng points
const getDistanceKm = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const RADIUS_OPTIONS = [
    { label: '2 km', value: 2 },
    { label: '5 km', value: 5 },
    { label: '10 km', value: 10 },
    { label: '25 km', value: 25 },
    { label: '50 km', value: 50 },
    { label: 'Any', value: Infinity },
];

const FILTERS = {
    foodType: [
        { label: 'All', value: 'all' },
        { label: 'Veg', value: 'VEG' },
        { label: 'Non-Veg', value: 'NON_VEG' },
    ],
    pricing: [
        { label: 'All', value: 'all' },
        { label: 'Free', value: 'free' },
        { label: 'Paid', value: 'paid' },
    ],
    status: [
        { label: 'Available', value: 'AVAILABLE' },
        { label: 'All', value: 'all' },
    ],
};

const Discover = () => {
    const [foods, setFoods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState({
        foodType: 'all',
        pricing: 'all',
        status: 'AVAILABLE',
    });
    const [showFilters, setShowFilters] = useState(false);
    const [selectedFood, setSelectedFood] = useState(null);

    // Location state
    const [userCoords, setUserCoords] = useState(null);
    const [locating, setLocating] = useState(false);
    const [locationError, setLocationError] = useState('');
    const [radius, setRadius] = useState(10); // default 10km

    // Request user's location
    const getLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by your browser.');
            return;
        }
        setLocating(true);
        setLocationError('');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserCoords({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setLocating(false);
            },
            (err) => {
                setLocating(false);
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        setLocationError('Location access denied.');
                        break;
                    case err.POSITION_UNAVAILABLE:
                        setLocationError('Location unavailable.');
                        break;
                    case err.TIMEOUT:
                        setLocationError('Location request timed out.');
                        break;
                    default:
                        setLocationError('Could not detect location.');
                }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    }, []);

    // Auto-detect location on mount
    useEffect(() => {
        getLocation();
    }, [getLocation]);

    // Determine if smart-search filters are active
    const hasSmartFilters = activeFilters.foodType !== 'all' || activeFilters.pricing !== 'all';

    const fetchFoods = useCallback(async () => {
        if (!userCoords) return;
        setLoading(true);
        setError('');
        try {
            let url;

            if (hasSmartFilters) {
                // Use smart-search API when type or pricing filters are active
                const params = new URLSearchParams();
                if (activeFilters.foodType !== 'all') {
                    params.set('foodType', activeFilters.foodType);
                }
                if (activeFilters.pricing === 'free') {
                    params.set('freeOnly', 'true');
                }
                url = `${API_BASE_URL}/food/smart-search?${params}`;
            } else {
                // Use discover API for location-based browsing
                const params = new URLSearchParams({
                    lat: userCoords.latitude,
                    lng: userCoords.longitude,
                    ...(radius !== Infinity && { radius: radius }),
                });
                url = `${API_BASE_URL}/food/discover?${params}`;
            }

            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch food listings.');
            const data = await response.json();
            setFoods(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || 'Could not load listings. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [userCoords, radius, activeFilters.foodType, activeFilters.pricing, hasSmartFilters]);

    useEffect(() => {
        if (userCoords) {
            fetchFoods();
        }
    }, [fetchFoods, userCoords]);

    // Compute distance for display (server already filters by radius)
    const foodsWithDistance = foods.map(food => {
        if (userCoords && food.latitude && food.longitude) {
            const dist = getDistanceKm(userCoords.latitude, userCoords.longitude, food.latitude, food.longitude);
            return { ...food, _distance: dist };
        }
        return { ...food, _distance: null };
    });

    // Client-side filtering (search and status only — type/pricing/distance handled by API)
    const filteredFoods = foodsWithDistance
        .filter(food => {
            const term = searchTerm.toLowerCase();
            const matchesSearch =
                !term ||
                (food.title || '').toLowerCase().includes(term) ||
                (food.description || '').toLowerCase().includes(term) ||
                (food.location || '').toLowerCase().includes(term);

            const matchesStatus =
                activeFilters.status === 'all' || food.status === activeFilters.status;

            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            if (a._distance === null && b._distance === null) return 0;
            if (a._distance === null) return 1;
            if (b._distance === null) return -1;
            return a._distance - b._distance;
        });

    const handleFilterChange = (category, value) => {
        setActiveFilters(prev => ({ ...prev, [category]: value }));
    };

    const activeFilterCount = Object.values(activeFilters).filter(v => v !== 'all' && v !== 'AVAILABLE').length
        + (radius !== 10 ? 1 : 0);

    const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleString('en-IN', {
            day: 'numeric', month: 'short',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const formatDistance = (dist) => {
        if (dist === null || dist === undefined) return null;
        if (dist < 1) return `${Math.round(dist * 1000)} m`;
        return `${dist.toFixed(1)} km`;
    };

    return (
        <div className="container py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-1">Discover Food Nearby</h1>
                <p className="text-text-light text-base">
                    {userCoords
                        ? 'Showing food listings sorted by distance from you'
                        : 'Allow location access to see nearby listings first'}
                </p>
            </div>

            {/* Location Banner */}
            <div className="mb-6 flex items-center gap-3 flex-wrap">
                <button
                    onClick={getLocation}
                    disabled={locating}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 cursor-pointer ${userCoords
                        ? 'border-green-300 bg-green-50 text-green-700'
                        : locationError
                            ? 'border-red-200 bg-red-50 text-red-600'
                            : 'border-border bg-surface text-text-main hover:border-primary/50'
                        }`}
                >
                    {locating ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : userCoords ? (
                        <Navigation size={16} />
                    ) : (
                        <LocateFixed size={16} />
                    )}
                    {locating
                        ? 'Detecting location...'
                        : userCoords
                            ? `Your location: ${userCoords.latitude.toFixed(4)}, ${userCoords.longitude.toFixed(4)}`
                            : locationError || 'Detect My Location'}
                </button>

                {/* Radius selector */}
                {userCoords && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-text-muted">Radius:</span>
                        <div className="flex gap-1">
                            {RADIUS_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setRadius(opt.value)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 border cursor-pointer ${radius === opt.value
                                        ? 'bg-primary text-white border-primary'
                                        : 'bg-transparent text-text-light border-border hover:border-primary/50'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Search & Filter Bar */}
            <div className="mb-6 flex flex-col gap-4">
                <div className="flex gap-3 flex-wrap items-center">
                    <div className="relative flex-grow max-w-[600px]">
                        <Search size={20} className="text-text-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            id="discover-search"
                            type="text"
                            placeholder="Search by food name, description, or location..."
                            className="w-full pl-12 pr-4 py-3 rounded-full border border-border bg-surface text-text-main text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-shadow duration-200"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <Button
                        variant={showFilters ? 'primary' : 'outline'}
                        size="md"
                        onClick={() => setShowFilters(prev => !prev)}
                    >
                        <Filter size={18} className="mr-2" />
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="ml-2 bg-white/20 text-xs rounded-full px-2 py-0.5 font-bold">
                                {activeFilterCount}
                            </span>
                        )}
                    </Button>

                    <Button variant="outline" size="md" onClick={fetchFoods} disabled={loading}>
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </Button>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div className="bg-surface border border-border rounded-xl p-5 shadow-sm fade-in">
                        <div className="flex flex-wrap gap-8">
                            {Object.entries(FILTERS).map(([category, options]) => (
                                <div key={category}>
                                    <span className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-2">
                                        {category === 'foodType' ? 'Type' : category === 'pricing' ? 'Price' : 'Status'}
                                    </span>
                                    <div className="flex gap-2 flex-wrap">
                                        {options.map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => handleFilterChange(category, opt.value)}
                                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border cursor-pointer ${activeFilters[category] === opt.value
                                                    ? 'bg-primary text-white border-primary shadow-sm'
                                                    : 'bg-transparent text-text-light border-border hover:border-primary/50 hover:text-primary'
                                                    }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Results count */}
            {!loading && !error && (
                <p className="text-sm text-text-muted mb-4">
                    Showing <strong className="text-text-main">{filteredFoods.length}</strong> listing{filteredFoods.length !== 1 ? 's' : ''}
                    {userCoords && radius !== Infinity && <> within <strong className="text-text-main">{radius} km</strong></>}
                    {searchTerm && <> for "<em>{searchTerm}</em>"</>}
                </p>
            )}

            {/* Loading */}
            {loading && (
                <div className="text-center py-20">
                    <div className="inline-block w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-text-light text-lg">Loading food listings...</p>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="mb-6 p-5 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center gap-3">
                    <AlertCircle size={22} />
                    <div>
                        <p className="font-semibold mb-0">{error}</p>
                        <button onClick={fetchFoods} className="text-sm underline mt-1 cursor-pointer">
                            Try again
                        </button>
                    </div>
                </div>
            )}

            {/* Food Grid */}
            {!loading && !error && filteredFoods.length > 0 && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFoods.map((food, index) => (
                        <div
                            key={food.foodId || index}
                            className="fade-in"
                            style={{ animationDelay: `${index * 60}ms` }}
                        >
                            <FoodCard
                                food={food}
                                formatDate={formatDate}
                                distance={formatDistance(food._distance)}
                                onViewDetails={(f) => setSelectedFood({ ...f, _distance: food._distance })}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!loading && !error && filteredFoods.length === 0 && (
                <div className="text-center py-20 bg-surface rounded-xl border border-border">
                    <Utensils size={48} className="mx-auto mb-4 text-text-muted opacity-40" />
                    <h3 className="text-xl font-bold text-text-main mb-2">No listings found</h3>
                    <p className="text-text-light mb-4">
                        {userCoords && radius !== Infinity
                            ? `No food found within ${radius} km. Try increasing the radius.`
                            : searchTerm || activeFilterCount > 0
                                ? 'Try adjusting your search or filters.'
                                : 'No food has been posted yet. Check back soon!'}
                    </p>
                    {(searchTerm || activeFilterCount > 0 || (userCoords && radius !== Infinity)) && (
                        <Button
                            variant="outline"
                            size="md"
                            onClick={() => {
                                setSearchTerm('');
                                setActiveFilters({ foodType: 'all', pricing: 'all', status: 'AVAILABLE' });
                                setRadius(Infinity);
                            }}
                        >
                            Clear all filters
                        </Button>
                    )}
                </div>
            )}
            {/* Food Detail Modal */}
            {selectedFood && (
                <FoodDetailModal
                    food={selectedFood}
                    formatDate={formatDate}
                    distance={formatDistance(selectedFood._distance)}
                    onClose={() => setSelectedFood(null)}
                />
            )}
        </div>
    );
};

export default Discover;
