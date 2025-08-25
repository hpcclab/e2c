import React from "react";

const DataTable = ({ data = [] }) => {
  if (!Array.isArray(data) || data.length === 0) return null;
  const headers = Object.keys(data[0] ?? {});

  return (
    <div className="overflow-auto border rounded">
      <table className="min-w-full text-xs">
        <thead className="bg-gray-100">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-2 py-1 border">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {headers.map((h) => (
                <td key={h} className="px-2 py-1 border">
                  {String(row[h] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
