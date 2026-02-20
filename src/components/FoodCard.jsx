import React from 'react';
import { MapPin, Clock, Heart } from 'lucide-react';
import Button from './Button';

const FoodCard = ({ food }) => {
    return (
        <div className="bg-surface rounded-lg shadow-md overflow-hidden transition-all duration-300 border border-border flex flex-col h-full hover:-translate-y-1 hover:shadow-lg group">
            <div className="relative">
                <img src={food.image} alt={food.title} className="w-full h-[200px] object-cover" />
                <button className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-white transition-colors">
                    <Heart size={18} className="text-danger" />
                </button>
            </div>

            <div className="p-4 flex flex-col flex-grow">
                <div>
                    {food.tags.map(tag => (
                        <span key={tag} className="inline-block px-2 py-1 rounded text-xs font-semibold bg-primary-light text-primary-dark mb-2 mr-1">
                            {tag}
                        </span>
                    ))}
                </div>

                <h3 className="text-lg font-bold mb-1 text-text-main">{food.title}</h3>

                <div className="flex items-center gap-1 text-text-light text-sm mb-1">
                    <MapPin size={14} />
                    <span>{food.location} ({food.distance})</span>
                </div>

                <div className="flex items-center gap-1 text-text-light text-sm mb-2">
                    <Clock size={14} />
                    <span>{food.timePosted}</span>
                </div>

                <p className="text-text-light text-sm my-2 flex-grow line-clamp-3">
                    {food.description}
                </p>

                <div className="border-t border-border pt-3 mt-auto flex justify-between items-center">
                    <div>
                        <span className="text-xs text-text-muted block">Posted by:</span>
                        <div className="font-semibold text-sm text-text-main">{food.postedBy}</div>
                    </div>
                    <Button variant="outline" size="sm">View Details</Button>
                </div>
            </div>
        </div>
    );
};

export default FoodCard;
