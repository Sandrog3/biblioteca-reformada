import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Admin from './components/Admin';
import Library from './components/Library';
import BookDetail from './components/BookDetail';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/biblioteca" element={<Library />} />
        <Route path="/biblioteca/:categorySlug" element={<Library />} />
        <Route path="/livro/:slug" element={<BookDetail />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}
