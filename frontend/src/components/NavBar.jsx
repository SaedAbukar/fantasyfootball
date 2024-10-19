import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth"; // Import the custom useAuth hook
import "../styles.css"; // Import the CSS

const Navbar = () => {
  const { isAuthenticated, email, clearUser } = useAuth(); // Access auth state and logout function

  const handleLogout = () => {
    clearUser(); // Call clearUser to log the user out
  };

  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/about">About</Link>

      {isAuthenticated ? (
        <>
          <Link to="protected">Team</Link>
          <span>Welcome, {email}</span> {/* Display the user's email */}
          <button onClick={handleLogout}>Logout</button> {/* Logout button */}
        </>
      ) : (
        <>
          <Link to="/login">Login</Link>
          <Link to="/signup">Sign Up</Link>
        </>
      )}
    </nav>
  );
};

export default Navbar;
