// src/components/Layout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar"; // Correct path for Navbar
import "../styles.css"; // Correct path for CSS styles

const Layout = () => {
  return (
    <>
      <Navbar />
      <div className="container">
        <Outlet /> {/* This will render the matched child route */}
      </div>
    </>
  );
};

export default Layout;
