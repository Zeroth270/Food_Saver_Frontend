import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Pencil, Trash2, X, Save, Leaf, AlertCircle } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import API_BASE_URL from '../config';
import { getUser } from '../utils/auth';

const MyPosts = () => {
    const navigate = useNavigate();
    const user = getUser();
    const userId = user?.userId || user?.id;

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const [actionLoading, setActionLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Fetch all posts by this user
    const fetchPosts = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_BASE_URL}/food/user/${userId}`);
            if (!response.ok) throw new Error('Failed to fetch your posts.');
            const data = await response.json();
            setPosts(Array.isArray(data) ? data : [data]);
        } catch (err) {
            setError(err.message || 'Could not load posts.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) fetchPosts();
    }, [userId]);

    // Start editing
    const handleEdit = (post) => {
        setEditingId(post.foodId);
        setEditData({
            title: post.title || '',
            description: post.description || '',
            foodType: post.foodType || 'Veg',
            quantity: post.quantity || '',
            price: post.price || 0,
            isFree: post.isFree ?? true,
            availableTill: post.availableTill ? new Date(post.availableTill).toISOString().slice(0, 16) : '',
            location: post.location || '',
            status: post.status || 'AVAILABLE',
        });
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        if (name === 'isFree') {
            const isFreeVal = value === 'true';
            setEditData(prev => ({ ...prev, isFree: isFreeVal, price: isFreeVal ? 0 : prev.price }));
        } else {
            setEditData(prev => ({ ...prev, [name]: value }));
        }
    };

    // Save edit
    const handleSave = async (foodId) => {
        setActionLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/food/update/${foodId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: editData.title,
                    description: editData.description,
                    foodType: editData.foodType,
                    quantity: editData.quantity,
                    price: editData.isFree ? 0.0 : parseFloat(editData.price),
                    isFree: editData.isFree,
                    availableTill: editData.availableTill,
                    location: editData.location,
                    status: editData.status,
                    userId: { userId },
                }),
            });
            if (!response.ok) throw new Error('Failed to update post.');
            setEditingId(null);
            fetchPosts();
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // Delete post
    const handleDelete = async (foodId) => {
        setActionLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/food/delete/${foodId}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete post.');
            setDeleteConfirm(null);
            fetchPosts();
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'AVAILABLE': return 'bg-green-100 text-green-700';
            case 'CLAIMED': return 'bg-yellow-100 text-yellow-700';
            case 'EXPIRED': return 'bg-red-100 text-red-700';
            default: return 'bg-border text-text-muted';
        }
    };

    const formatDate = (date) => {
        if (!date) return '—';
        return new Date(date).toLocaleString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (!userId) {
        return (
            <div className="container py-16 text-center">
                <p className="text-text-light text-lg">Please log in to view your posts.</p>
                <Button variant="primary" className="mt-4" onClick={() => navigate('/login')}>
                    Go to Login
                </Button>
            </div>
        );
    }

    return (
        <div className="container py-8">
            <div className="max-w-[900px] mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold">My Food Posts</h1>
                    <Button variant="primary" size="md" onClick={() => navigate('/post-food')}>
                        + Post New
                    </Button>
                </div>

                {loading && (
                    <div className="text-center py-16">
                        <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-text-light">Loading your posts...</p>
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-600 flex items-center gap-2">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}

                {!loading && !error && posts.length === 0 && (
                    <div className="text-center py-16 bg-surface rounded-xl border border-border">
                        <Leaf size={48} className="mx-auto mb-4 text-text-muted opacity-50" />
                        <h3 className="text-xl font-bold text-text-main mb-2">No posts yet</h3>
                        <p className="text-text-light mb-6">Start sharing surplus food with your community!</p>
                        <Button variant="primary" onClick={() => navigate('/post-food')}>
                            Post Your First Listing
                        </Button>
                    </div>
                )}

                {/* Posts List */}
                <div className="space-y-4">
                    {posts.map((post) => (
                        <div key={post.foodId} className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden transition-all duration-300">
                            {editingId === post.foodId ? (
                                /* ===== EDIT MODE ===== */
                                <div className="p-6">
                                    <h3 className="text-lg font-bold mb-4 text-primary">Editing Post</h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <Input label="Title" id="title" name="title" value={editData.title} onChange={handleEditChange} required />
                                        <Input label="Quantity" id="quantity" name="quantity" value={editData.quantity} onChange={handleEditChange} required />
                                        <div className="mb-4">
                                            <label className="font-semibold text-sm block mb-1 text-text-main">Food Type</label>
                                            <select name="foodType" value={editData.foodType} onChange={handleEditChange}
                                                className="w-full p-3 rounded-md border border-border bg-surface text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50">
                                                <option value="Veg">Veg</option>
                                                <option value="NonVeg">Non-Veg</option>
                                            </select>
                                        </div>
                                        <div className="mb-4">
                                            <label className="font-semibold text-sm block mb-1 text-text-main">Status</label>
                                            <select name="status" value={editData.status} onChange={handleEditChange}
                                                className="w-full p-3 rounded-md border border-border bg-surface text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50">
                                                <option value="AVAILABLE">Available</option>
                                                <option value="CLAIMED">Claimed</option>
                                                <option value="EXPIRED">Expired</option>
                                            </select>
                                        </div>
                                        <Input label="Location" id="location" name="location" value={editData.location} onChange={handleEditChange} required />
                                        <div className="mb-4">
                                            <label className="font-semibold text-sm block mb-1 text-text-main">Available Till</label>
                                            <input type="datetime-local" name="availableTill" value={editData.availableTill} onChange={handleEditChange}
                                                className="w-full p-3 rounded-md border border-border bg-surface text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                        </div>
                                        <div className="mb-4">
                                            <label className="font-semibold text-sm block mb-1 text-text-main">Offering</label>
                                            <div className="flex gap-6 mt-2">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="radio" name="isFree" value="true" checked={editData.isFree === true} onChange={handleEditChange} /> Free
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="radio" name="isFree" value="false" checked={editData.isFree === false} onChange={handleEditChange} /> Paid
                                                </label>
                                            </div>
                                        </div>
                                        {!editData.isFree && (
                                            <Input label="Price (₹)" id="price" name="price" type="number" step="0.01" value={editData.price} onChange={handleEditChange} />
                                        )}
                                    </div>
                                    <Input label="Description" id="description" name="description" type="textarea" value={editData.description} onChange={handleEditChange} />
                                    <div className="flex gap-3 mt-4">
                                        <Button variant="primary" size="md" onClick={() => handleSave(post.foodId)} disabled={actionLoading}>
                                            <Save size={16} className="mr-2" />
                                            {actionLoading ? 'Saving…' : 'Save Changes'}
                                        </Button>
                                        <Button variant="outline" size="md" onClick={() => setEditingId(null)} disabled={actionLoading}>
                                            <X size={16} className="mr-2" />
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                /* ===== VIEW MODE ===== */
                                <div className="p-6">
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold text-text-main">{post.title}</h3>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(post.status)}`}>
                                                    {post.status}
                                                </span>
                                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-light text-primary-dark">
                                                    {post.foodType}
                                                </span>
                                            </div>
                                            <p className="text-text-light text-sm mb-3">{post.description}</p>
                                            <div className="flex flex-wrap gap-4 text-sm text-text-light">
                                                <span className="flex items-center gap-1">
                                                    <MapPin size={14} /> {post.location || '—'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={14} /> Till {formatDate(post.availableTill)}
                                                </span>
                                                <span>Qty: <strong>{post.quantity}</strong></span>
                                                <span>{post.isFree ? '🆓 Free' : `₹${post.price}`}</span>
                                            </div>
                                            {post.createdAt && (
                                                <p className="text-xs text-text-muted mt-2">Posted: {formatDate(post.createdAt)}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <Button variant="outline" size="sm" onClick={() => handleEdit(post)}>
                                                <Pencil size={14} className="mr-1" /> Edit
                                            </Button>
                                            {deleteConfirm === post.foodId ? (
                                                <div className="flex gap-2">
                                                    <Button variant="primary" size="sm" className="!bg-red-500 hover:!bg-red-600 !border-red-500"
                                                        onClick={() => handleDelete(post.foodId)} disabled={actionLoading}>
                                                        {actionLoading ? '…' : 'Confirm'}
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>
                                                        Cancel
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button variant="outline" size="sm" className="!text-red-500 !border-red-300 hover:!bg-red-50"
                                                    onClick={() => setDeleteConfirm(post.foodId)}>
                                                    <Trash2 size={14} className="mr-1" /> Delete
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MyPosts;
