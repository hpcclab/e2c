import React, { useState } from "react";

const Collapsible = ({ title, children, defaultExpanded = false }) => {
  const [isOpen, setIsOpen] = useState(defaultExpanded);

  const toggle = () => setIsOpen(!isOpen);

  return (
    <div
      style={{ border: "1px solid #ccc", borderRadius: 4, marginBottom: 10 }}
    >
      <div
        onClick={toggle}
        style={{
          cursor: "pointer",
          backgroundColor: "#f0f0f0",
          padding: "8px 12px",
          fontWeight: "bold",
        }}
      >
        {title} {isOpen ? "▲" : "▼"}
      </div>
      {isOpen && <div style={{ padding: 12 }}>{children}</div>}
    </div>
  );
};

export default Collapsible;
