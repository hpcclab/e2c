import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import SimDashboard from "./SimDashboard";
import "./assets/index.css";
import Reports from "./Reports";

const App = () => {
  return (
    <Router>
      <div className="max-w-screen max-h-screen bg-gray-50 overflow-x-hidden">
        <header className="bg-blue-500 text-white p-3 shadow-md overflow-hidden">
          <nav className="mx-auto flex justify-between items-center overflow-hidden ">
            <h1 className="text-3xl font-bold">E2C</h1>
            <ul className="flex space-x-6 text-lg max-w-screen overflow-hidden">
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
            </ul>
          </nav>
        </header>

        <main className="p-0 overflow-hidden">
          <Routes>
            <Route path="/e2c/*" element={<Home />} />
            <Route path="/e2c/simulate/*" element={<SimDashboard />} />
            <Route path="/e2c/reports/*" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

const Home = () => (
  <div className="flex flex-col" style={{ height: "calc(100vh - 60px)" }}>
    {/* Body */}
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
      <h2 className="text-6xl font-bold text-gray-800 text-center">
        Welcome to E2C By The HPCC LAB!
      </h2>
      <p className="text-4xl text-gray-600 text-center">
        Let&apos;s try our{" "}
        <Link
          to="/e2c/simulate"
          className="text-blue-500 underline hover:text-blue-700 transition-colors"
        >
          simulator
        </Link>
        !
      </p>
    </div>

    {/* Footer */}
    <footer className="bg-gray-100 border-t border-gray-200 py-8 px-8">
      <div className="flex flex-col items-center gap-6">
        <p className="text-gray-800 text-base font-semibold">
          Made by{" "}
          <a
            href="https://www.linkedin.com/in/joshyao/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Joshua Yao
          </a>{" "}
          &{" "}
          <a
            href="https://www.linkedin.com/in/jakegonza1es/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Jake Gonzales
          </a>
        </p>
        <div className="flex gap-16 items-center">
          <img
            src="/e2c/logos/nsf-logo.jpeg"
            alt="NSF"
            className="h-20 object-contain"
          />
          <a
            href="https://hpcclab.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-12 transition-opacity hover:opacity-70"
          >
            <img
              src="/e2c/logos/hpcc-logo.png"
              alt="HPCC Lab"
              className="h-20 object-contain"
            />
          </a>
          <img
            src="/e2c/logos/unt-logo.png"
            alt="UNT"
            className="h-20 object-contain"
          />
        </div>
      </div>
    </footer>
  </div>
);

export default App;
