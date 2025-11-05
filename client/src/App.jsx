import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import SimDashboard from "./SimDashboard";
import DNDApp from "./DNDAppTEST";
import { DragAndDropProvider } from "./context/DragAndDropContext.jsx";
import "./assets/index.css";

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-blue-500 text-white p-6 shadow-md">
          <nav className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-3xl font-bold">E2C</h1>
            <ul className="flex space-x-6 text-lg">
              <li>
                <Link to="/e2c" className="hover:underline">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/e2c/simulate" className="hover:underline">
                  Simulation
                </Link>
              </li>
              <li>
                <Link to="/e2c/dndtest" className="hover:underline">
                  dndTest
                </Link>
              </li>
            </ul>
          </nav>
        </header>

        <main className="p-6">
          <DragAndDropProvider>
            <Routes>
              <Route path="/e2c" element={<Home />} />
              <Route path="/e2c/simulate" element={<SimDashboard />} />
              <Route path="/e2c/dndtest" element={<DNDApp />} />
            </Routes>
          </DragAndDropProvider>
        </main>
      </div>
    </Router>
  );
};

const Home = () => (
  <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow p-10">
    <h2 className="text-4xl font-bold text-gray-800 mb-4">
      Welcome to E2C-Revamp
    </h2>
    <p className="text-lg text-gray-700">Try our Sim!</p>
  </div>
);

export default App;
