import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    X, MapPin, Clock, Package, Utensils, Leaf, Drumstick,
    Navigation, User, Phone, Mail, MessageCircle, IndianRupee,
    Calendar, Info, Send
} from 'lucide-react';
import Button from './Button';

const FoodDetailModal = ({ food, formatDate, distance, onClose }) => {
    const navigate = useNavigate();
    if (!food) return null;

    const donor = food.user || {};
    const donorName = donor.name || food.postedBy || 'Anonymous';
    const donorEmail = donor.email || null;
    const donorPhone = donor.phone || donor.phoneNumber || null;

    const typeColor = food.foodType === 'Veg'
        ? 'bg-green-100 text-green-700'
        : 'bg-red-100 text-red-700';

    const statusColor = (() => {
        switch (food.status) {
            case 'AVAILABLE': return 'bg-green-100 text-green-700';
            case 'CLAIMED': return 'bg-yellow-100 text-yellow-700';
            case 'EXPIRED': return 'bg-red-100 text-red-700';
            default: return 'bg-border text-text-muted';
        }
    })();

    const priceLabel = food.free ? 'Free' : `₹ ${food.price}`;
    const priceColor = food.free
        ? 'bg-primary-light text-primary-dark'
        : 'bg-secondary-light text-secondary-dark';

    const imageUrl = food.image || null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-surface rounded-2xl shadow-2xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 bg-surface/90 backdrop-blur-sm rounded-full w-9 h-9 flex items-center justify-center cursor-pointer hover:bg-border/50 transition-colors shadow-sm border border-border"
                >
                    <X size={18} />
                </button>

                {/* Image / Placeholder */}
                <div className="relative">
                    {imageUrl ? (
                        <img src={imageUrl} alt={food.title} className="w-full h-[240px] object-cover rounded-t-2xl" />
                    ) : (
                        <div className="w-full h-[200px] bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center rounded-t-2xl">
                            <Utensils size={56} className="text-primary/25" />
                        </div>
                    )}
                    <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${statusColor}`}>
                        {food.status}
                    </span>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${typeColor}`}>
                            {food.foodType === 'Veg' ? <><Leaf size={13} /> Veg</> : <><Drumstick size={13} /> Non-Veg</>}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${priceColor}`}>
                            {food.free ? priceLabel : <><IndianRupee size={12} /> {food.price}</>}
                        </span>
                        {distance && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                                <Navigation size={12} /> {distance} away
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-text-main mb-4">{food.title}</h2>

                    {/* Description */}
                    <div className="mb-6">
                        <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Description</h4>
                        <p className="text-text-main text-sm leading-relaxed">
                            {food.description || 'No description provided.'}
                        </p>
                    </div>

                    {/* Details Grid */}
                    <div className="grid sm:grid-cols-2 gap-3 mb-6">
                        {food.location && (
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border">
                                <MapPin size={18} className="text-primary mt-0.5 shrink-0" />
                                <div>
                                    <span className="text-xs text-text-muted block">Pickup Location</span>
                                    <span className="text-sm font-medium text-text-main">{food.location}</span>
                                </div>
                            </div>
                        )}
                        {food.availableTill && (
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border">
                                <Clock size={18} className="text-primary mt-0.5 shrink-0" />
                                <div>
                                    <span className="text-xs text-text-muted block">Available Till</span>
                                    <span className="text-sm font-medium text-text-main">{formatDate ? formatDate(food.availableTill) : food.availableTill}</span>
                                </div>
                            </div>
                        )}
                        {food.quantity && (
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border">
                                <Package size={18} className="text-primary mt-0.5 shrink-0" />
                                <div>
                                    <span className="text-xs text-text-muted block">Quantity</span>
                                    <span className="text-sm font-medium text-text-main">{food.quantity}</span>
                                </div>
                            </div>
                        )}
                        {food.createdAt && (
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border">
                                <Calendar size={18} className="text-primary mt-0.5 shrink-0" />
                                <div>
                                    <span className="text-xs text-text-muted block">Posted On</span>
                                    <span className="text-sm font-medium text-text-main">{formatDate ? formatDate(food.createdAt) : food.createdAt}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Donor / Contact Section */}
                    <div className="border-t border-border pt-5">
                        <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Donor Information</h4>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                                {donorName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-semibold text-text-main">{donorName}</p>
                                {donorEmail && (
                                    <p className="text-sm text-text-light">{donorEmail}</p>
                                )}
                            </div>
                        </div>

                        {/* Contact Actions */}
                        <div className="flex flex-wrap gap-3">
                            {/* In-App Message */}
                            {donorEmail && (
                                <button
                                    onClick={() => {
                                        onClose();
                                        navigate(`/messages?name=${encodeURIComponent(donorName)}&email=${encodeURIComponent(donorEmail)}`);
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors cursor-pointer"
                                >
                                    <Send size={16} />
                                    Message Donor
                                </button>
                            )}
                            {donorPhone && (
                                <a
                                    href={`tel:${donorPhone}`}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-background text-text-main text-sm font-medium hover:border-primary/50 transition-colors no-underline"
                                >
                                    <Phone size={16} />
                                    Call
                                </a>
                            )}
                            {donorPhone && (
                                <a
                                    href={`https://wa.me/${donorPhone.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors no-underline"
                                >
                                    <MessageCircle size={16} />
                                    WhatsApp
                                </a>
                            )}
                            {donorEmail && (
                                <a
                                    href={`mailto:${donorEmail}?subject=Regarding your food listing: ${food.title}`}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-background text-text-main text-sm font-medium hover:border-primary/50 transition-colors no-underline"
                                >
                                    <Mail size={16} />
                                    Email
                                </a>
                            )}
                            {!donor.userId && !donorPhone && !donorEmail && (
                                <div className="flex items-center gap-2 text-sm text-text-muted p-3 bg-background rounded-lg border border-border w-full">
                                    <Info size={16} />
                                    <span>Contact information is not available for this donor.</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .animate-in {
                    animation: modalIn 0.25s ease-out;
                }
                @keyframes modalIn {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default FoodDetailModal;
