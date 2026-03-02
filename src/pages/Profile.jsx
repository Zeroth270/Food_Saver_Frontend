import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Shield, LogOut, Radar, Bell, Pencil, Save, X } from 'lucide-react';
import Button from '../components/Button';
import { getUser, logout } from '../utils/auth';
import API_BASE_URL from '../config';

const Profile = () => {
    const navigate = useNavigate();
    const user = getUser();

    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || user?.phoneNumber || '',
        role: user?.role || 'USER',
        notificationRadius: user?.notificationRadius ?? '',
        notificationEnabled: user?.notificationEnabled ?? false,
    });

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    if (!user) {
        return (
            <div className="container py-16 text-center">
                <p className="text-text-light text-lg">No user data found. Please log in again.</p>
                <Button variant="primary" className="mt-4" onClick={() => navigate('/login')}>
                    Go to Login
                </Button>
            </div>
        );
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleToggleNotification = () => {
        setFormData({ ...formData, notificationEnabled: !formData.notificationEnabled });
    };

    const handleCancel = () => {
        setFormData({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || user.phoneNumber || '',
            role: user.role || 'USER',
            notificationRadius: user.notificationRadius ?? '',
            notificationEnabled: user.notificationEnabled ?? false,
        });
        setEditing(false);
        setError('');
        setSuccess('');
    };

    const handleUpdate = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`${API_BASE_URL}/user/update/${user.userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phoneNumber: formData.phone,
                    role: formData.role,
                    notificationRadius: formData.notificationRadius ? parseFloat(formData.notificationRadius) : null,
                    notificationEnabled: formData.notificationEnabled,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Update failed. Please try again.');
            }

            const updatedUser = data.user || data;
            localStorage.setItem('user', JSON.stringify(updatedUser));

            setSuccess('Profile updated successfully!');
            setEditing(false);
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const details = [
        { icon: <User size={20} />, label: 'Name', key: 'name', type: 'text' },
        { icon: <Mail size={20} />, label: 'Email', key: 'email', type: 'email' },
        { icon: <Phone size={20} />, label: 'Phone', key: 'phone', type: 'tel' },
        { icon: <Shield size={20} />, label: 'Role', key: 'role', type: 'select', options: ['USER', 'DONOR', 'RECEIVER'] },
    ];

    const preferences = [
        { icon: <Radar size={20} />, label: 'Notification Radius (km)', key: 'notificationRadius', type: 'number' },
        { icon: <Bell size={20} />, label: 'Notifications', key: 'notificationEnabled', type: 'toggle' },
    ];

    const getDisplayValue = (item) => {
        const val = formData[item.key];
        if (item.type === 'toggle') return val ? 'Enabled' : 'Disabled';
        if (item.key === 'notificationRadius') return val != null && val !== '' ? `${val} km` : '—';
        return val || '—';
    };

    const renderField = (item) => {
        if (!editing) {
            return (
                <div className="flex items-center gap-4 p-4 rounded-lg bg-background border border-border hover:border-primary/20 transition-colors duration-200">
                    <span className="text-primary shrink-0">{item.icon}</span>
                    <div className="flex-grow">
                        <p className="text-xs text-text-muted mb-0.5">{item.label}</p>
                        <p className="text-text-main font-medium mb-0">{getDisplayValue(item)}</p>
                    </div>
                </div>
            );
        }

        if (item.type === 'toggle') {
            return (
                <div className="flex items-center justify-between p-4 rounded-lg bg-background border border-border">
                    <div className="flex items-center gap-4">
                        <span className="text-primary">{item.icon}</span>
                        <span className="text-sm font-medium text-text-main">{item.label}</span>
                    </div>
                    <button
                        type="button"
                        onClick={handleToggleNotification}
                        className={`relative w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer ${formData.notificationEnabled ? 'bg-primary' : 'bg-gray-300'}`}
                    >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${formData.notificationEnabled ? 'translate-x-6' : ''}`} />
                    </button>
                </div>
            );
        }

        if (item.type === 'select') {
            return (
                <div className="flex items-center gap-4 p-4 rounded-lg bg-background border border-border">
                    <span className="text-primary shrink-0">{item.icon}</span>
                    <div className="flex-grow">
                        <p className="text-xs text-text-muted mb-1">{item.label}</p>
                        <select
                            id={item.key}
                            value={formData[item.key]}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded-md border border-border bg-surface text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            {item.options.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex items-center gap-4 p-4 rounded-lg bg-background border border-border">
                <span className="text-primary shrink-0">{item.icon}</span>
                <div className="flex-grow">
                    <p className="text-xs text-text-muted mb-1">{item.label}</p>
                    <input
                        id={item.key}
                        type={item.type}
                        value={formData[item.key]}
                        onChange={handleChange}
                        className="w-full px-3 py-2 rounded-md border border-border bg-surface text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="container py-10">
            <div className="max-w-[960px] mx-auto">
                {/* Messages */}
                {error && (
                    <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm fade-in">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-600 text-sm fade-in">
                        {success}
                    </div>
                )}

                <div className="grid md:grid-cols-[280px_1fr] gap-6">
                    {/* ===== Left Sidebar — Avatar Card ===== */}
                    <div className="bg-surface rounded-xl shadow-sm border border-border p-6 flex flex-col items-center text-center h-fit md:sticky md:top-24">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center text-4xl font-bold mb-4 shadow-lg">
                            {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <h2 className="text-xl font-bold text-text-main mb-0.5">{formData.name || 'User'}</h2>
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-primary-light text-primary-dark mb-4">
                            {formData.role}
                        </span>
                        <p className="text-text-muted text-sm mb-6">{formData.email}</p>

                        <div className="w-full space-y-2">
                            {!editing ? (
                                <Button variant="primary" size="md" className="w-full" onClick={() => { setEditing(true); setSuccess(''); }}>
                                    <Pencil size={16} className="mr-2" /> Edit Profile
                                </Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Button variant="primary" size="md" className="flex-1" onClick={handleUpdate} disabled={loading}>
                                        <Save size={16} className="mr-1" />
                                        {loading ? 'Saving…' : 'Save'}
                                    </Button>
                                    <Button variant="outline" size="md" className="flex-1" onClick={handleCancel} disabled={loading}>
                                        <X size={16} className="mr-1" /> Cancel
                                    </Button>
                                </div>
                            )}

                            <Button variant="ghost" size="md" className="w-full !text-danger hover:!bg-red-50" onClick={handleLogout}>
                                <LogOut size={16} className="mr-2" /> Logout
                            </Button>
                        </div>
                    </div>

                    {/* ===== Right Panel — Details ===== */}
                    <div className="space-y-6">
                        {/* Personal Info Section */}
                        <div className="bg-surface rounded-xl shadow-sm border border-border p-6">
                            <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
                                <User size={20} className="text-primary" /> Personal Information
                            </h3>
                            <div className="grid sm:grid-cols-2 gap-3">
                                {details.map(item => (
                                    <div key={item.key}>{renderField(item)}</div>
                                ))}
                            </div>
                        </div>

                        {/* Preferences Section */}
                        <div className="bg-surface rounded-xl shadow-sm border border-border p-6">
                            <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
                                <Bell size={20} className="text-primary" /> Notification Preferences
                            </h3>
                            <div className="grid sm:grid-cols-2 gap-3">
                                {preferences.map(item => (
                                    <div key={item.key}>{renderField(item)}</div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
