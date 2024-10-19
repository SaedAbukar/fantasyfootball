import React from "react";
import "../styles.css"; // Import the CSS

const Home = () => {
  console.log("Rendering Home Component");
  return (
    <div>
      <h1 className="page-title">Home Page</h1>
      <p className="page-content">
        Welcome to the Home page! This is where your journey starts.
      </p>
    </div>
  );
};

export default Home;
