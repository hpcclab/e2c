import React from 'react';
import { BaseEdge, getStraightPath, EdgeLabelRenderer } from '@xyflow/react';

const AnimatedTaskEdge = ({ 
  id, 
  sourceX, 
  sourceY, 
  targetX, 
  targetY, 
  sourcePosition,
  targetPosition,
  style = {},
  data = {},
  markerEnd
}) => {
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const animatingTasks = data.animatingTasks || [];

  return (
    <>
      <BaseEdge 
        id={id} 
        path={edgePath} 
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: animatingTasks.length > 0 ? 3 : 2,
          stroke: animatingTasks.length > 0 ? '#3b82f6' : '#b1b1b7',
          strokeDasharray: animatingTasks.length > 0 ? '5,5' : 'none',
        }}
      />
      
      {animatingTasks.length > 0 && (
        <>
          {/* Animated glow effect on edge */}
          <BaseEdge 
            id={`${id}-glow`}
            path={edgePath}
            style={{
              strokeWidth: 6,
              stroke: '#3b82f6',
              opacity: 0.3,
              animation: 'pulse 1s infinite',
            }}
          />
          
          <EdgeLabelRenderer>
            {animatingTasks.map((task, idx) => (
              <div
                key={`${task.taskId}-${task.timestamp}`}
                style={{
                  position: 'absolute',
                  transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                  pointerEvents: 'none',
                  animation: 'bounce 0.5s ease-in-out infinite',
                }}
                className="nodrag nopan"
              >
                <div className="bg-blue-500 text-white text-xs px-3 py-1.5 rounded-full shadow-lg font-semibold border-2 border-blue-300">
                  Task {task.taskId}
                </div>
              </div>
            ))}
          </EdgeLabelRenderer>
        </>
      )}
    </>
  );
};

export default AnimatedTaskEdge;