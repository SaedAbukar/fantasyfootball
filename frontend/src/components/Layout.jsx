import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./NavBar";
import "../styles.css"; // Import the CSS

const Layout = () => {
  return (
    <>
      <Navbar />
      <div className="container">
        <Outlet /> {/* Render the child route here */}
      </div>
    </>
  );
};

export default Layout;
