import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Discover from './pages/Discover';
import PostFood from './pages/PostFood';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import MyPosts from './pages/MyPosts';
import Messages from './pages/Messages';
import { WebSocketProvider } from './context/WebSocketContext';
import { NotificationProvider } from './context/NotificationContext';
import './styles/global.css';

function App() {
  return (
    <Router>
      <WebSocketProvider>
        <NotificationProvider>
          <div className="App min-h-screen flex flex-col font-sans bg-background text-text-main">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/discover" element={<Discover />} />
                <Route path="/post-food" element={<ProtectedRoute><PostFood /></ProtectedRoute>} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/my-posts" element={<ProtectedRoute><MyPosts /></ProtectedRoute>} />
                <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              </Routes>
            </main>
            <footer className="bg-text-main text-white p-8 text-center mt-auto">
              <p className="mb-0">© 2026 FoodShare Connect. All rights reserved.</p>
            </footer>
          </div>
        </NotificationProvider>
      </WebSocketProvider>
    </Router>
  );
}

export default App;

