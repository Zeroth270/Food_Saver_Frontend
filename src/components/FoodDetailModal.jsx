import React, { useState, useEffect } from 'react';
import { getUser } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import {
    X, MapPin, Clock, Package, Utensils, Leaf, Drumstick,
    Navigation, User, Phone, Mail, MessageCircle, IndianRupee,
    Calendar, Info, Send, CheckCircle2, AlertCircle, Loader2,
    XCircle, Hourglass
} from 'lucide-react';
import Button from './Button';
import API_BASE_URL from '../config';

const FoodDetailModal = ({ food, formatDate, distance, onClose }) => {
    const navigate = useNavigate();

    // Request State
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [requestMessage, setRequestMessage] = useState('');
    const [requestLoading, setRequestLoading] = useState(false);
    const [requestSuccess, setRequestSuccess] = useState(false);
    const [requestError, setRequestError] = useState('');

    // Existing request status check
    const [existingRequestStatus, setExistingRequestStatus] = useState(null); // null | 'PENDING' | 'ACCEPT' | 'REJECT'
    const [statusCheckLoading, setStatusCheckLoading] = useState(false);

    const currentUser = getUser();

    // Check if this receiver already has a request for this food post
    useEffect(() => {
        if (!food?.foodId || !currentUser) return;

        const receiverId = currentUser.userId || currentUser.id;
        if (!receiverId) return;

        const donor = food.user || {};
        const donorEmail = donor.email || null;
        // Don't check if the current user is the donor
        if (currentUser.email && donorEmail && currentUser.email === donorEmail) return;

        const checkExistingRequest = async () => {
            setStatusCheckLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/contact/food/${food.foodId}`);
                if (response.ok) {
                    const requests = await response.json();
                    // Find if this receiver already sent a request
                    const myRequest = requests.find(
                        req => req.receiver?.userId === receiverId ||
                            req.receiver?.id === receiverId ||
                            req.receiver?.email === currentUser.email
                    );
                    if (myRequest) {
                        setExistingRequestStatus(myRequest.status);
                    }
                }
            } catch (err) {
                console.error('Error checking existing request:', err);
            } finally {
                setStatusCheckLoading(false);
            }
        };

        checkExistingRequest();
    }, [food?.foodId]);

    if (!food) return null;

    const donor = food.user || {};
    const donorName = donor.name || food.postedBy || 'Anonymous';
    const donorEmail = donor.email || null;
    const donorPhone = donor.phone || donor.phoneNumber || null;

    // Check if the current logged-in user is the donor
    const isDonor = currentUser?.email && donorEmail && currentUser.email === donorEmail;

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

    // Helper to render the request status banner
    const renderRequestStatusBanner = () => {
        if (!existingRequestStatus) return null;

        const bannerConfig = {
            PENDING: {
                icon: <Hourglass size={20} className="shrink-0" />,
                title: 'Request Pending',
                message: 'You have already requested this food. The donor will review your request soon.',
                bgColor: 'bg-yellow-50',
                borderColor: 'border-yellow-200',
                textColor: 'text-yellow-700',
                iconColor: 'text-yellow-500',
            },
            ACCEPT: {
                icon: <CheckCircle2 size={20} className="shrink-0" />,
                title: 'Request Accepted!',
                message: 'The donor has accepted your request. You can now contact them to arrange pickup.',
                bgColor: 'bg-green-50',
                borderColor: 'border-green-200',
                textColor: 'text-green-700',
                iconColor: 'text-green-500',
            },
            REJECT: {
                icon: <XCircle size={20} className="shrink-0" />,
                title: 'Request Declined',
                message: 'Unfortunately, the donor has declined your request for this food item.',
                bgColor: 'bg-red-50',
                borderColor: 'border-red-200',
                textColor: 'text-red-700',
                iconColor: 'text-red-500',
            },
        };

        const config = bannerConfig[existingRequestStatus];
        if (!config) return null;

        return (
            <div className={`flex items-start gap-3 p-4 rounded-xl border ${config.bgColor} ${config.borderColor} w-full`}>
                <div className={config.iconColor}>{config.icon}</div>
                <div>
                    <p className={`font-semibold text-sm ${config.textColor}`}>{config.title}</p>
                    <p className={`text-sm mt-0.5 ${config.textColor} opacity-80`}>{config.message}</p>
                </div>
            </div>
        );
    };

    const handleSendRequest = async () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        const receiverId = currentUser.userId || currentUser.id;
        if (!receiverId) {
            setRequestError('User ID not found. Please log in again.');
            return;
        }

        if (!food.foodId) {
            setRequestError('Invalid food listing.');
            return;
        }

        setRequestLoading(true);
        setRequestError('');

        const url = `${API_BASE_URL}/contact/send/${food.foodId}/${receiverId}`;
        const payload = { message: requestMessage };
        console.log('=== SENDING REQUEST ===');
        console.log('URL:', url);
        console.log('Payload:', payload);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            console.log('=== RESPONSE STATUS ===', response.status);
            const responseText = await response.text();
            console.log('=== RESPONSE BODY ===', responseText);

            if (!response.ok) {
                throw new Error(responseText || 'Failed to send request');
            }

            setRequestSuccess(true);
            setExistingRequestStatus('PENDING');
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err) {
            console.error('=== REQUEST ERROR ===', err);
            setRequestError(err.message || 'An error occurred while sending the request.');
        } finally {
            setRequestLoading(false);
        }
    };

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
                        {!currentUser ? (
                            <div className="flex flex-col items-center gap-3 p-5 bg-background rounded-xl border border-border w-full text-center">
                                <Info size={22} className="text-primary" />
                                <p className="text-sm text-text-main font-medium">Login to contact Donor</p>
                                <p className="text-xs text-text-muted">You need to be logged in to view donor details and send requests.</p>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => {
                                        onClose();
                                        navigate('/login');
                                    }}
                                >
                                    Log In
                                </Button>
                            </div>
                        ) : (
                            <>
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
                                {isDonor ? (
                                    <div className="flex items-center gap-2 text-sm text-primary p-3 bg-primary/5 rounded-lg border border-primary/20 w-full">
                                        <Info size={16} />
                                        <span>This is your listing. Contact options are shown to receivers only.</span>
                                    </div>
                                ) : statusCheckLoading ? (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2 size={20} className="animate-spin text-primary mr-2" />
                                        <span className="text-sm text-text-muted">Checking request status...</span>
                                    </div>
                                ) : existingRequestStatus ? (
                                    <div className="space-y-3">
                                        {renderRequestStatusBanner()}
                                        {/* Show contact options for accepted requests */}
                                        {existingRequestStatus === 'ACCEPT' && (
                                            <div className="flex flex-wrap gap-3 pt-1">
                                                {donorEmail && (
                                                    <button
                                                        onClick={() => {
                                                            onClose();
                                                            navigate(`/messages?name=${encodeURIComponent(donorName)}&email=${encodeURIComponent(donorEmail)}&foodTitle=${encodeURIComponent(food.title || '')}&foodId=${encodeURIComponent(food.foodId || '')}`);
                                                        }}
                                                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-background text-text-main text-sm font-medium hover:border-primary/50 transition-colors cursor-pointer w-full sm:w-auto"
                                                    >
                                                        <MessageCircle size={16} />
                                                        Chat with Donor
                                                    </button>
                                                )}
                                                {donorPhone && (
                                                    <a
                                                        href={`tel:${donorPhone}`}
                                                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-background text-text-main text-sm font-medium hover:border-primary/50 transition-colors no-underline w-full sm:w-auto"
                                                    >
                                                        <Phone size={16} />
                                                        Call
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : showRequestForm ? (
                                    <div className="bg-background border border-border rounded-xl p-4 animate-in">
                                        {requestSuccess ? (
                                            <div className="flex flex-col items-center justify-center py-4 text-green-600">
                                                <CheckCircle2 size={48} className="mb-2" />
                                                <p className="font-medium text-center">Request sent successfully!</p>
                                                <p className="text-sm opacity-80 mt-1">The donor will review your request.</p>
                                            </div>
                                        ) : (
                                            <>
                                                <h4 className="font-semibold text-text-main mb-2 flex items-center gap-2">
                                                    <Utensils size={18} className="text-primary" />
                                                    Request this Food
                                                </h4>
                                                <p className="text-sm text-text-muted mb-4">
                                                    Send a request to the donor to claim this item. You can include an optional message here.
                                                </p>
                                                <textarea
                                                    value={requestMessage}
                                                    onChange={(e) => setRequestMessage(e.target.value)}
                                                    placeholder="E.g., I'd love to pick this up! When are you available?"
                                                    rows={3}
                                                    className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-main placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all mb-3"
                                                />

                                                {requestError && (
                                                    <div className="flex items-start gap-2 text-sm text-red-500 mb-3 bg-red-50 p-2 rounded-lg border border-red-100">
                                                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                                        <span>{requestError}</span>
                                                    </div>
                                                )}

                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="primary"
                                                        className="flex-1"
                                                        onClick={handleSendRequest}
                                                        disabled={requestLoading}
                                                    >
                                                        {requestLoading ? (
                                                            <><Loader2 size={16} className="animate-spin mr-2" /> Sending...</>
                                                        ) : (
                                                            <><Send size={16} className="mr-2" /> Send Request</>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => {
                                                            setShowRequestForm(false);
                                                            setRequestError('');
                                                        }}
                                                        disabled={requestLoading}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-3">
                                        {/* Formal Request Button */}
                                        <Button
                                            variant="primary"
                                            onClick={() => {
                                                if (!currentUser) navigate('/login');
                                                else setShowRequestForm(true);
                                            }}
                                            className="!w-full sm:!w-auto"
                                        >
                                            <Utensils size={16} className="mr-2" />
                                            Request Food
                                        </Button>

                                        {/* In-App Message */}
                                        {donorEmail && (
                                            <button
                                                onClick={() => {
                                                    onClose();
                                                    navigate(`/messages?name=${encodeURIComponent(donorName)}&email=${encodeURIComponent(donorEmail)}&foodTitle=${encodeURIComponent(food.title || '')}&foodId=${encodeURIComponent(food.foodId || '')}`);
                                                }}
                                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-background text-text-main text-sm font-medium hover:border-primary/50 transition-colors cursor-pointer w-full sm:w-auto"
                                            >
                                                <MessageCircle size={16} />
                                                Chat
                                            </button>
                                        )}
                                        {donorPhone && (
                                            <a
                                                href={`tel:${donorPhone}`}
                                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-background text-text-main text-sm font-medium hover:border-primary/50 transition-colors no-underline w-full sm:w-auto"
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
                                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors no-underline w-full sm:w-auto"
                                            >
                                                <MessageCircle size={16} />
                                                WhatsApp
                                            </a>
                                        )}
                                        {!donor.userId && !donorPhone && !donorEmail && (
                                            <div className="flex items-center gap-2 text-sm text-text-muted p-3 bg-background rounded-lg border border-border w-full">
                                                <Info size={16} />
                                                <span>Contact information is not available for this donor.</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
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

