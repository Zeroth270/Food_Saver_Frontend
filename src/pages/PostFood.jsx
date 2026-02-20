import React, { useState } from 'react';
import { Upload, Info } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';

const PostFood = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        foodType: 'Veg', // 'Veg' or 'NonVeg'
        quantity: '',
        price: 0,
        isFree: true,
        availableTill: '',
        location: '',
        status: 'AVAILABLE' // Default status
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        // Handle isFree toggle logic specifically
        if (name === 'isFree') {
            const isFreeValue = value === 'true'; // Convert string "true"/"false" to boolean
            setFormData(prev => ({
                ...prev,
                isFree: isFreeValue,
                price: isFreeValue ? 0 : prev.price // Reset price if free
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Add createdAt timestamp on submit
        const submissionData = {
            ...formData,
            createdAt: new Date(),
            price: formData.isFree ? 0.0 : parseFloat(formData.price) // Ensure double
        };

        console.log('Listing created:', submissionData);
        alert('Listing created successfully! (Mock)');
    };

    return (
        <div className="container py-8">
            <div className="max-w-[800px] mx-auto">
                <h1 className="text-3xl font-bold mb-6">Post Available Food</h1>

                <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-8">

                    {/* Left Section - Form Fields */}
                    <div className="md:col-span-2 flex flex-col">
                        <div className="bg-surface p-6 rounded-xl shadow-sm border border-border">
                            <h3 className="text-xl font-bold mb-4">Food Details</h3>

                            <Input
                                label="Post Title"
                                id="title"
                                name="title"
                                placeholder="e.g. 5kg Vegetable Biryani"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <div className="mb-4">
                                    <label className="font-semibold text-sm block mb-2 text-text-main">Food Type</label>
                                    <select
                                        name="foodType"
                                        value={formData.foodType}
                                        onChange={handleChange}
                                        className="w-full p-3 rounded-md border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-base"
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

                            <h3 className="text-xl font-bold my-4">Logistics & Pricing</h3>

                            <Input
                                label="Location"
                                id="location"
                                name="location"
                                placeholder="Pickup address"
                                value={formData.location}
                                onChange={handleChange}
                                required
                            />

                            <div className="mb-4">
                                <label className="font-semibold text-sm block mb-2 text-text-main">Available Till</label>
                                <input
                                    type="datetime-local"
                                    name="availableTill"
                                    value={formData.availableTill}
                                    onChange={handleChange}
                                    className="w-full p-3 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="font-semibold text-sm block mb-2 text-text-main">Offering Type</label>
                                <div className="flex gap-8">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="isFree"
                                            value="true"
                                            checked={formData.isFree === true}
                                            onChange={handleChange}
                                            className="text-primary focus:ring-primary"
                                        />
                                        Free
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="isFree"
                                            value="false"
                                            checked={formData.isFree === false}
                                            onChange={handleChange}
                                            className="text-primary focus:ring-primary"
                                        />
                                        Paid
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

                    {/* Right Section - Upload */}
                    <div className="flex flex-col gap-4">
                        <div className="bg-surface p-6 rounded-xl shadow-sm border-2 border-dashed border-border text-center cursor-pointer flex flex-col items-center justify-center min-h-[200px] hover:border-primary/50 transition-colors group">
                            <Upload size={32} className="text-text-muted mb-2 group-hover:text-primary transition-colors" />
                            <span className="font-semibold text-primary">Upload Photos</span>
                            <span className="text-sm text-text-muted">Drag and drop or click to browse</span>
                        </div>

                        <div className="bg-secondary-light p-6 rounded-xl text-secondary-dark">
                            <h4 className="flex items-center gap-2 font-bold mb-2">
                                <Info size={18} /> Posting Tips
                            </h4>
                            <ul className="list-disc pl-5 text-sm space-y-1">
                                <li>Clearly mark Veg/Non-Veg.</li>
                                <li>Set a realistic 'Available Till' time.</li>
                                <li>Provide accurate location for smooth pickup.</li>
                            </ul>
                        </div>

                        <Button variant="primary" size="lg" className="mt-auto w-full">Publish Listing</Button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default PostFood;
