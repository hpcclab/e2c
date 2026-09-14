import React from "react";

const Help = () => (
  <section
    aria-label="E2C Help"
    className="w-full bg-gray-50"
    style={{ height: "calc(100vh - 60px)" }}
  >
    <iframe
      title="E2C Help"
      src="/e2c/documentation/index.html?embedded=1"
      className="h-full w-full border-0"
    />
  </section>
);

export default Help;
