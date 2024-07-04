import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Cluster from "./pages/Cluster.jsx";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route exact path="/" element={<Home />} />
        <Route exact path="/cluster/:name" element={<Cluster />} />
      </Routes>
    </Router>
  );
};

export default App;
