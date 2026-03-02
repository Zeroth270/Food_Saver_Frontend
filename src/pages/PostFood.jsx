import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils, MapPin, Clock, IndianRupee, Info, CheckCircle, AlertCircle, Leaf, Drumstick, Gift, Banknote, Send, LocateFixed, Loader2 } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import API_BASE_URL from '../config';
import { getUser } from '../utils/auth';

const PostFood = () => {
    const navigate = useNavigate();
    const user = getUser();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        foodType: 'Veg',
        quantity: '',
        price: 0,
        isFree: true,
        availableTill: '',
        location: '',
        status: 'AVAILABLE'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [coords, setCoords] = useState(null);
    const [locating, setLocating] = useState(false);
    const [locationError, setLocationError] = useState('');

    const getLocation = () => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by your browser.');
            return;
        }
        setLocating(true);
        setLocationError('');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCoords({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setLocating(false);
            },
            (err) => {
                setLocating(false);
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        setLocationError('Location permission denied. Please allow access in your browser settings.');
                        break;
                    case err.POSITION_UNAVAILABLE:
                        setLocationError('Location information is unavailable.');
                        break;
                    case err.TIMEOUT:
                        setLocationError('Location request timed out.');
                        break;
                    default:
                        setLocationError('An unknown error occurred.');
                }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'isFree') {
            const isFreeValue = value === 'true';
            setFormData(prev => ({
                ...prev,
                isFree: isFreeValue,
                price: isFreeValue ? 0 : prev.price
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        const payload = {
            title: formData.title,
            description: formData.description,
            foodType: formData.foodType,
            quantity: formData.quantity,
            price: formData.isFree ? 0.0 : parseFloat(formData.price),
            free: formData.isFree,
            availableTill: formData.availableTill,
            location: formData.location,
            latitude: coords?.latitude || null,
            longitude: coords?.longitude || null,
            status: formData.status,
            user: { userId: user?.userId || user?.id }
        };

        try {
            const response = await fetch(`${API_BASE_URL}/food/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                let msg = 'Failed to create listing.';
                try { const data = await response.json(); msg = data.message || msg; } catch (_) { }
                throw new Error(msg);
            }

            setSuccess('Food listing published successfully!');
            setFormData({
                title: '', description: '', foodType: 'Veg', quantity: '',
                price: 0, isFree: true, availableTill: '', location: '', status: 'AVAILABLE'
            });
            setCoords(null);

            setTimeout(() => navigate('/my-posts'), 2000);
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container py-10">
            <div className="max-w-[960px] mx-auto">

                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-1">Post Available Food</h1>
                    <p className="text-text-light">Share surplus food with people in your community</p>
                </div>

                {/* Messages */}
                {success && (
                    <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 flex items-center gap-3 fade-in">
                        <CheckCircle size={20} />
                        <span className="font-medium">{success}</span>
                    </div>
                )}
                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center gap-3 fade-in">
                        <AlertCircle size={20} />
                        <span className="font-medium">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid md:grid-cols-[1fr_300px] gap-6">

                        {/* ===== Main Content ===== */}
                        <div className="space-y-6">

                            {/* Food Details Card */}
                            <div className="bg-surface rounded-xl shadow-sm border border-border p-6">
                                <h3 className="text-lg font-bold text-text-main mb-5 flex items-center gap-2">
                                    <Utensils size={20} className="text-primary" /> Food Details
                                </h3>

                                <Input
                                    label="Post Title"
                                    id="title"
                                    name="title"
                                    placeholder="e.g. 5kg Vegetable Biryani"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                />

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="mb-4">
                                        <label className="font-semibold text-sm block mb-2 text-text-main">Food Type</label>
                                        <select
                                            name="foodType"
                                            value={formData.foodType}
                                            onChange={handleChange}
                                            className="w-full p-3 rounded-md border border-border bg-background text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50 text-base"
                                        >
                                            <option value="Veg">Veg</option>
                                            <option value="NonVeg">Non-Veg</option>
                                        </select>
                                    </div>

                                    <Input
                                        label="Quantity"
                                        id="quantity"
                                        name="quantity"
                                        placeholder="e.g. 10 kg / 20 packets"
                                        value={formData.quantity}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <Input
                                    label="Detailed Description"
                                    id="description"
                                    name="description"
                                    type="textarea"
                                    placeholder="Describe contents, ingredients, and preparation time."
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* Logistics & Pricing Card */}
                            <div className="bg-surface rounded-xl shadow-sm border border-border p-6">
                                <h3 className="text-lg font-bold text-text-main mb-5 flex items-center gap-2">
                                    <MapPin size={20} className="text-primary" /> Logistics & Pricing
                                </h3>

                                <Input
                                    label="Pickup Location"
                                    id="location"
                                    name="location"
                                    placeholder="Full pickup address"
                                    value={formData.location}
                                    onChange={handleChange}
                                    required
                                />

                                {/* Geolocation */}
                                <div className="mb-4">
                                    <label className="font-semibold text-sm block mb-2 text-text-main">GPS Coordinates</label>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={getLocation}
                                            disabled={locating}
                                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200 cursor-pointer ${coords
                                                ? 'border-green-300 bg-green-50 text-green-700'
                                                : 'border-border bg-background text-text-main hover:border-primary/50 hover:text-primary'
                                                }`}
                                        >
                                            {locating ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : coords ? (
                                                <CheckCircle size={16} />
                                            ) : (
                                                <LocateFixed size={16} />
                                            )}
                                            {locating ? 'Detecting...' : coords ? 'Location Detected' : 'Detect My Location'}
                                        </button>
                                        {coords && (
                                            <span className="text-xs text-text-muted">
                                                {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}
                                            </span>
                                        )}
                                    </div>
                                    {locationError && (
                                        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                                            <AlertCircle size={12} /> {locationError}
                                        </p>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="font-semibold text-sm block mb-2 text-text-main">Available Till</label>
                                    <input
                                        type="datetime-local"
                                        name="availableTill"
                                        value={formData.availableTill}
                                        onChange={handleChange}
                                        className="w-full p-3 rounded-md border border-border bg-background text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="font-semibold text-sm block mb-2 text-text-main">Offering Type</label>
                                    <div className="flex gap-4">
                                        <label
                                            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${formData.isFree
                                                ? 'border-primary bg-primary/5 text-primary font-semibold'
                                                : 'border-border bg-background text-text-light hover:border-primary/30'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="isFree"
                                                value="true"
                                                checked={formData.isFree === true}
                                                onChange={handleChange}
                                                className="sr-only"
                                            />
                                            <Gift size={16} className="mr-1" /> Free
                                        </label>
                                        <label
                                            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${!formData.isFree
                                                ? 'border-primary bg-primary/5 text-primary font-semibold'
                                                : 'border-border bg-background text-text-light hover:border-primary/30'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="isFree"
                                                value="false"
                                                checked={formData.isFree === false}
                                                onChange={handleChange}
                                                className="sr-only"
                                            />
                                            <Banknote size={16} className="mr-1" /> Paid
                                        </label>
                                    </div>
                                </div>

                                {!formData.isFree && (
                                    <Input
                                        label="Price (₹)"
                                        id="price"
                                        name="price"
                                        type="number"
                                        placeholder="0.00"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={handleChange}
                                        required
                                    />
                                )}
                            </div>
                        </div>

                        {/* ===== Right Sidebar ===== */}
                        <div className="space-y-6 md:sticky md:top-24 h-fit">

                            {/* Tips Card */}
                            <div className="bg-secondary-light rounded-xl p-5 border border-secondary/20">
                                <h4 className="flex items-center gap-2 font-bold mb-3 text-secondary-dark text-sm">
                                    <Info size={18} /> Posting Tips
                                </h4>
                                <ul className="text-sm text-secondary-dark space-y-2.5">
                                    <li className="flex items-start gap-2">
                                        <Leaf size={14} className="mt-0.5 shrink-0" />
                                        <span>Clearly mark Veg / Non-Veg</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Clock size={14} className="mt-0.5 shrink-0" />
                                        <span>Set a realistic "Available Till" time</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <MapPin size={14} className="mt-0.5 shrink-0" />
                                        <span>Provide accurate location for smooth pickup</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Info size={14} className="mt-0.5 shrink-0" />
                                        <span>Add detailed description with ingredients</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Submit Button */}
                            <Button variant="primary" size="lg" className="w-full" disabled={loading} type="submit">
                                <Send size={18} className="mr-2" />
                                {loading ? 'Publishing…' : 'Publish Listing'}
                            </Button>

                            <p className="text-xs text-text-muted text-center">
                                Your listing will be visible to nearby users immediately after publishing.
                            </p>
                        </div>

                    </div>
                </form>
            </div>
        </div>
    );
};

export default PostFood;
