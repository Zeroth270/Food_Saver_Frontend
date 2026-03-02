import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, CheckCircle } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import API_BASE_URL from '../config';

const Signup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'USER'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // OTP state
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpError, setOtpError] = useState('');
    const [otpSuccess, setOtpSuccess] = useState('');

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData({ ...formData, [id]: value });

        // Reset OTP state if email changes after OTP was sent
        if (id === 'email' && otpSent) {
            setOtpSent(false);
            setOtpVerified(false);
            setOtp('');
            setOtpError('');
            setOtpSuccess('');
        }
    };

    const handleSendOtp = async () => {
        if (!formData.email) {
            setOtpError('Please enter an email address first.');
            return;
        }

        setOtpLoading(true);
        setOtpError('');
        setOtpSuccess('');

        try {
            const response = await fetch(`${API_BASE_URL}/user/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email }),
            });

            if (!response.ok) {
                let msg = 'Failed to send OTP.';
                try { const data = await response.json(); msg = data.message || msg; } catch (_) { }
                throw new Error(msg);
            }

            setOtpSent(true);
            setOtpSuccess('OTP sent to your email!');
        } catch (err) {
            setOtpError(err.message || 'Failed to send OTP. Please try again.');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp) {
            setOtpError('Please enter the OTP.');
            return;
        }

        setOtpLoading(true);
        setOtpError('');
        setOtpSuccess('');

        try {
            const response = await fetch(`${API_BASE_URL}/user/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, otp }),
            });

            if (!response.ok) {
                let msg = 'Invalid OTP. Please try again.';
                try { const data = await response.json(); msg = data.message || msg; } catch (_) { }
                throw new Error(msg);
            }

            setOtpVerified(true);
            setOtpSuccess('Email verified successfully!');
        } catch (err) {
            setOtpError(err.message || 'Verification failed. Please try again.');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!otpVerified) {
            setError('Please verify your email with OTP before signing up.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/user/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phoneNumber: formData.phone,
                    password: formData.password,
                    role: formData.role,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed. Please try again.');
            }

            navigate('/login');
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container py-16 flex justify-center items-center min-h-[60vh]">
            <div className="bg-surface p-8 rounded-xl shadow-md border border-border w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary-light text-secondary-dark mb-4">
                        <UserPlus size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-text-main">Create Account</h1>
                    <p className="text-text-light">Join the community to save food.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <Input
                        label="Full Name"
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />

                    {/* Email + OTP Section */}
                    <div className="mb-4">
                        <div className="flex items-end gap-2">
                            <div className="flex-grow">
                                <Input
                                    label="Email Address"
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    disabled={otpVerified}
                                />
                            </div>
                            {!otpVerified && (
                                <button
                                    type="button"
                                    onClick={handleSendOtp}
                                    disabled={otpLoading || !formData.email}
                                    className="mb-4 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors duration-150 bg-primary text-white hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {otpLoading && !otpSent ? 'Sending…' : otpSent ? 'Resend OTP' : 'Send OTP'}
                                </button>
                            )}
                            {otpVerified && (
                                <div className="mb-4 flex items-center gap-1 text-green-600">
                                    <CheckCircle size={20} />
                                    <span className="text-sm font-semibold">Verified</span>
                                </div>
                            )}
                        </div>

                        {/* OTP Input */}
                        {otpSent && !otpVerified && (
                            <div className="flex items-end gap-2 mt-1">
                                <div className="flex-grow">
                                    <label className="block text-sm font-medium text-text-main mb-1">Enter OTP</label>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        placeholder="Enter 6-digit OTP"
                                        maxLength={6}
                                        className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text-main focus:outline-none focus:ring-2 focus:ring-primary tracking-widest text-center text-lg font-mono"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleVerifyOtp}
                                    disabled={otpLoading || !otp}
                                    className="px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors duration-150 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {otpLoading ? 'Verifying…' : 'Verify'}
                                </button>
                            </div>
                        )}

                        {/* OTP Messages */}
                        {otpError && (
                            <p className="mt-2 text-sm text-red-600">{otpError}</p>
                        )}
                        {otpSuccess && (
                            <p className="mt-2 text-sm text-green-600">{otpSuccess}</p>
                        )}
                    </div>

                    <Input
                        label="Phone Number"
                        id="phone"
                        type="tel"
                        placeholder="+91 9876543210"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        label="Password"
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                    <div className="mb-4">
                        <label htmlFor="role" className="block text-sm font-medium text-text-main mb-1">
                            Role
                        </label>
                        <select
                            id="role"
                            value={formData.role}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="USER">User</option>
                            <option value="DONOR">Donor</option>
                            <option value="RECEIVER">Receiver</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <Button
                        variant="primary"
                        size="lg"
                        className="w-full mb-4"
                        disabled={loading || !otpVerified}
                    >
                        {loading ? 'Creating Account…' : 'Sign Up'}
                    </Button>

                    {!otpVerified && (
                        <p className="text-xs text-text-light text-center mb-4">
                            Please verify your email to enable sign up.
                        </p>
                    )}
                </form>

                <div className="text-center text-sm text-text-light">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary font-semibold hover:underline">
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Signup;
