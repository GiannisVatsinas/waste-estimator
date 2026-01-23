import React from 'react';

const Layout = ({ children }) => {
    return (
        <div className="app-container">
            <header className="main-header">
                <div className="logo">🌱 EcoScale</div>
                <nav>
                    <a href="#">Home</a>
                    <a href="#">About</a>
                </nav>
            </header>
            <main className="main-content">
                {children}
            </main>
            <footer className="main-footer">
                <p>&copy; 2025 EcoScale. AI-Powered Waste Management.</p>
            </footer>
        </div>
    );
};

export default Layout;
