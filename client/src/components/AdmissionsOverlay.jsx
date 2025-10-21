import React from "react";
import { motion } from "framer-motion"; 

export default function AdmissionsOverlay({ flyers = [] }) {
  // Each flyer: { key, from: {x,y}, to: {x,y}, label, onComplete }
  return (
    <>
      {/* Fixed overlay. */}
      {flyers.map((f) => (
        <motion.div
          key={f.key}
          initial={{ x: f.from.x, y: f.from.y, scale: 0.9, opacity: 0.9 }}
          animate={{ x: f.to.x, y: f.to.y, scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          onAnimationComplete={f.onComplete}
          style={{ position: "fixed", top: 0, left: 0, pointerEvents: "none", zIndex: 1000 }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "9999px",
              background: "#2563eb",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
            }}
            title={String(f.label ?? "")}
          >
            {String(f.label ?? "")}
          </div>
        </motion.div>
      ))}
    </>
  );
}
