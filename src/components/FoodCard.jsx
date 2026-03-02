import React from 'react';
import { MapPin, Clock, Package, Heart, Utensils, Leaf, Drumstick, Navigation } from 'lucide-react';
import Button from './Button';

const FoodCard = ({ food, formatDate, distance, onViewDetails }) => {
    // Determine badge colors
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

    const donorName = food.user?.name || food.postedBy || 'Anonymous';

    // Support both mock data (image) and API data (no image field yet)
    const imageUrl = food.image || null;

    return (
        <div className="bg-surface rounded-xl shadow-md overflow-hidden transition-all duration-300 border border-border flex flex-col h-full hover:-translate-y-1 hover:shadow-lg group">
            {/* Image or placeholder */}
            <div className="relative">
                {imageUrl ? (
                    <img src={imageUrl} alt={food.title} className="w-full h-[180px] object-cover" />
                ) : (
                    <div className="w-full h-[180px] bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <Utensils size={40} className="text-primary/30" />
                    </div>
                )}

                {/* Status badge on image */}
                <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${statusColor}`}>
                    {food.status}
                </span>

                {/* Favorite button */}
                <button className="absolute top-3 right-3 bg-surface/80 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-surface transition-colors shadow-sm">
                    <Heart size={16} className="text-danger" />
                </button>
            </div>

            <div className="p-4 flex flex-col flex-grow">
                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${typeColor}`}>
                        {food.foodType === 'Veg' ? <><Leaf size={12} /> Veg</> : <><Drumstick size={12} /> Non-Veg</>}
                    </span>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${priceColor}`}>
                        {priceLabel}
                    </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold mb-1 text-text-main leading-snug line-clamp-1">
                    {food.title}
                </h3>

                {/* Location + Distance */}
                {(food.location || distance) && (
                    <div className="flex items-center gap-1.5 text-text-light text-sm mb-1">
                        <MapPin size={14} className="shrink-0" />
                        <span className="line-clamp-1 flex-grow">{food.location || 'Unknown'}</span>
                        {distance && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary shrink-0">
                                <Navigation size={12} />
                                {distance}
                            </span>
                        )}
                    </div>
                )}

                {/* Available till */}
                {food.availableTill && formatDate && (
                    <div className="flex items-center gap-1.5 text-text-light text-sm mb-1">
                        <Clock size={14} className="shrink-0" />
                        <span>Till {formatDate(food.availableTill)}</span>
                    </div>
                )}

                {/* Quantity */}
                {food.quantity && (
                    <div className="flex items-center gap-1.5 text-text-light text-sm mb-2">
                        <Package size={14} className="shrink-0" />
                        <span>Qty: {food.quantity}</span>
                    </div>
                )}

                {/* Description */}
                <p className="text-text-light text-sm my-1 flex-grow line-clamp-2 !mb-2">
                    {food.description}
                </p>

                {/* Footer */}
                <div className="border-t border-border pt-3 mt-auto flex justify-between items-center">
                    <div>
                        <span className="text-xs text-text-muted block">Shared by</span>
                        <div className="font-semibold text-sm text-text-main">{donorName}</div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => onViewDetails && onViewDetails(food)}>View Details</Button>
                </div>
            </div>
        </div>
    );
};

export default FoodCard;
