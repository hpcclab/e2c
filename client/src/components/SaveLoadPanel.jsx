import React, { useState, useRef, useEffect } from "react";
import { Panel } from "@xyflow/react";
import Modal from "react-modal";
import { useGlobalState } from "../context/GlobalStates";
import axios from "axios";
import "../assets/saveload.css";

Modal.setAppElement("#root");

export default function FlowSaveLoadPanel() {
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    machines,
    iot,
    setMachines,
    setIot,
  } = useGlobalState();

  const [modalOpen, setModalOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState("");
  const [newFileName, setNewFileName] = useState("");
  const [dragging, setDragging] = useState(false);
  const [modalPosition, setModalPosition] = useState({
    top: 50,
    left: window.innerWidth / 2 - 250,
  });
  const dragStartPos = useRef({ x: 0, y: 0 });

  // Fetch existing files
  const fetchFiles = async () => {
    try {
      const res = await axios.get("http://localhost:5001/flow/list_states");
      setFiles(res.data.files || []);
    } catch (err) {
      console.error("Error fetching files:", err);
    }
  };

  useEffect(() => {
    if (modalOpen) fetchFiles();
  }, [modalOpen]);

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  // Save / Save As
  const saveAs = async () => {
    const filename = newFileName.trim();
    if (!filename) return alert("Enter a filename");

    const fileWithExtension = filename.toLowerCase().endsWith(".json")
      ? filename
      : `${filename}.json`;

    try {
      const res = await axios.post("http://localhost:5001/flow/save_as", {
        nodes,
        edges,
        machines,
        iot,
        filename: fileWithExtension,
      });
      alert(res.data.message || res.data.error);
      fetchFiles();
      setNewFileName("");
    } catch (err) {
      alert(err.response?.data?.error || "Network Error: " + err.message);
    }
  };

  const save = async () => {
    if (!selectedFile) return alert("Select a file to save");
    try {
      const res = await axios.post("http://localhost:5001/flow/save_state", {
        nodes,
        edges,
        machines,
        iot,
        filename: selectedFile,
      });
      alert(res.data.message || res.data.error);
      fetchFiles();
    } catch (err) {
      alert(err.response?.data?.error || "Network Error: " + err.message);
    }
  };

  // Load
  const load = async (file) => {
    try {
      const res = await axios.post("http://localhost:5001/flow/load_state", {
        filename: file,
      });

      if (res.data.data) {
        const loadedMachines = res.data.data.machines || [];
        const loadedIots = res.data.data.iot || [];
        const loadedEdges = res.data.data.edges || [];
        const loadedNodes = res.data.data.nodes || [];

        // Separate other nodes (non-machine / non-iot)
        const otherNodes = loadedNodes.filter(
          (n) => n.type !== "machineNode" && n.type !== "iotNode",
        );

        // Map machines to React Flow nodes
        const machinesArr = loadedMachines.map((m) => ({
          id: `machine-${m.id}`,
          type: "machineNode",
          position: m.position || { x: 0, y: 0 },
          data: m,
        }));

        // Map IoTs to React Flow nodes
        const iotArr = loadedIots.map((i) => ({
          id: `iot-${i.id}`,
          type: "iotNode",
          position: i.position || { x: 0, y: 0 },
          data: i,
        }));

        setNodes([...otherNodes, ...machinesArr, ...iotArr]);
        setEdges(loadedEdges);
        setMachines(loadedMachines);
        setIot(loadedIots);

        alert(res.data.message || "Flow loaded successfully!");
        fetchFiles();
      } else {
        alert("No data found in file.");
      }
    } catch (err) {
      alert(err.response?.data?.error || "Network Error: " + err.message);
    }
  };

  // Drag & Drop
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.machines && data.iot && data.edges) {
          const machineNodes = data.machines.map((m) => ({
            id: `machine-${m.id}`,
            type: "machineNode",
            position: m.position || { x: 0, y: 0 },
            data: m,
          }));

          const iotNodes = data.iot.map((i) => ({
            id: `iot-${i.id}`,
            type: "iotNode",
            position: i.position || { x: 0, y: 0 },
            data: i,
          }));

          const otherNodes =
            data.nodes?.filter(
              (n) => n.type !== "machineNode" && n.type !== "iotNode",
            ) || [];

          setNodes([...otherNodes, ...machineNodes, ...iotNodes]);
          setEdges(data.edges);
          setMachines(data.machines);
          setIot(data.iot);

          alert("File loaded successfully!");
          closeModal();
          fetchFiles();
        } else {
          alert("Invalid file format!");
        }
      } catch (err) {
        alert("Error parsing file: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const allowDrop = (e) => e.preventDefault();
  const startDrag = (e) => {
    setDragging(true);
    dragStartPos.current = {
      x: e.clientX - modalPosition.left,
      y: e.clientY - modalPosition.top,
    };
  };
  const onDrag = (e) => {
    if (!dragging) return;
    setModalPosition({
      top: e.clientY - dragStartPos.current.y,
      left: e.clientX - dragStartPos.current.x,
    });
  };
  const stopDrag = () => setDragging(false);

  // Rename / Delete
  const renameFile = async () => {
    if (!selectedFile || !newFileName.trim())
      return alert("Select file and enter new name");

    let newName = newFileName.trim();
    if (!newName.toLowerCase().endsWith(".json")) newName += ".json";

    try {
      const res = await axios.post("http://localhost:5001/flow/rename_state", {
        old_name: selectedFile,
        new_name: newName,
      });
      alert(res.data.message || res.data.error);
      fetchFiles();
      setSelectedFile("");
      setNewFileName("");
    } catch (err) {
      alert(err.response?.data?.error || "Network Error: " + err.message);
    }
  };

  const deleteFile = async () => {
    if (!selectedFile) return alert("Select a file to delete");
    try {
      const res = await axios.post("http://localhost:5001/flow/delete_state", {
        filename: selectedFile,
      });
      alert(res.data.message || res.data.error);
      fetchFiles();
      setSelectedFile("");
    } catch (err) {
      alert(err.response?.data?.error || "Network Error: " + err.message);
    }
  };

  // Render
  return (
    <>
      <Panel position="top-left">
        <div className="xy-theme__button-group">
          <button className="xy-theme__button" onClick={openModal}>
            Open Save/Load
          </button>
        </div>
      </Panel>

      <Modal
        isOpen={modalOpen}
        onRequestClose={closeModal}
        contentLabel="Save/Load React Flow State"
        className="modal-content"
        overlayClassName="modal-overlay"
        style={{
          content: {
            top: modalPosition.top,
            left: modalPosition.left,
            transform: "none",
            width: "500px",
            maxHeight: "80vh",
            padding: "0",
          },
        }}
      >
        <div
          className="modal-header"
          onMouseDown={startDrag}
          onMouseMove={onDrag}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
        >
          <h2>React Flow States</h2>
          <button className="close-btn" onClick={closeModal}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="file-section">
            <h3>Existing Files</h3>
            <ul className="file-list">
              {files.map((file) => (
                <li
                  key={file}
                  className={selectedFile === file ? "selected" : ""}
                  onClick={() => setSelectedFile(file)}
                >
                  {file}
                  <button className="file-btn" onClick={() => load(file)}>
                    Load
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="save-section">
            <h3>Save / Save As / Rename / Delete</h3>
            <input
              type="text"
              placeholder="Enter filename"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
            />
            <div className="btn-group">
              <button className="save-btn" onClick={save}>
                Save
              </button>
              <button className="save-btn" onClick={saveAs}>
                Save As
              </button>
              <button className="rename-btn" onClick={renameFile}>
                Rename Selected
              </button>
              <button className="delete-btn" onClick={deleteFile}>
                Delete Selected
              </button>
            </div>
          </div>

          <div className="drop-zone" onDrop={handleDrop} onDragOver={allowDrop}>
            Drag & Drop a saved flow JSON file here to load
          </div>
        </div>
      </Modal>
    </>
  );
}
