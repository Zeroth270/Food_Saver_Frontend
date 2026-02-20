import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Discover from './pages/Discover';
import PostFood from './pages/PostFood';
import Login from './pages/Login';
import Signup from './pages/Signup';
import './styles/global.css';

function App() {
  return (
    <Router>
      <div className="App min-h-screen flex flex-col font-sans bg-background text-text-main">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/post-food" element={<PostFood />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Routes>
        </main>
        {/* Simple Footer */}
        <footer className="bg-text-main text-white p-8 text-center mt-auto">
          <p className="mb-0">© 2026 FoodShare Connect. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
