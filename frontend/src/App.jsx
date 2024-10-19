import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Team from "./pages/Team";
import { AuthProvider } from "./context/AuthContext"; // Import AuthProvider
import PrivateRoute from "./components/PrivateRoute"; // Component for protected routes

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Use Layout to wrap around all routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />{" "}
            {/* Renders Home component for "/" path */}
            <Route path="about" element={<About />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            {/* Protect any routes that need authentication */}
            <Route
              path="/protected"
              element={
                <PrivateRoute>
                  <Team />
                </PrivateRoute>
              }
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
