import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import API_BASE_URL from '../config';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE_URL}/user/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed. Please check your credentials.');
            }

            // Store token / user info returned by your API
            if (data.token) {
                localStorage.setItem('token', data.token);
            }

            // Store user data — API may return user nested or as the root object
            const userData = data.user || data;
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('loggedIn', 'true');

            navigate('/');
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
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-light text-primary-dark mb-4">
                        <LogIn size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-text-main">Welcome Back</h1>
                    <p className="text-text-light">Sign in to continue sharing food.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <Input
                        label="Email Address"
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
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

                    <div className="flex justify-end mb-6">
                        <Link to="#" className="text-sm text-primary hover:underline">Forgot Password?</Link>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <Button variant="primary" size="lg" className="w-full mb-4" disabled={loading}>
                        {loading ? 'Logging in…' : 'LogIn'}
                    </Button>
                </form>

                <div className="text-center text-sm text-text-light">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-primary font-semibold hover:underline">
                        Sign Up
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
