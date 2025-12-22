import React from 'react';

function Navbar() {
  return (
    <nav style={{ 
      backgroundColor: 'white', 
      padding: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      position: 'relative',
      zIndex: 9999
    }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Admin Dashboard</h1>
    </nav>
  );
}

export default Navbar;
