import React, { useState, useRef, useEffect } from "react";
import { Panel } from "@xyflow/react";
import Modal from "react-modal";
import { useGlobalState } from "../context/GlobalStates";
import { useReactFlow } from "@xyflow/react";
import * as localStore from "../utils/localStore";
import { VscFiles } from "react-icons/vsc";
import {
  MdDriveFileRenameOutline,
  MdDeleteOutline,
  MdSave,
  MdSaveAs,
  MdClose,
  MdUploadFile,
  MdDownload,
} from "react-icons/md";
import "../assets/saveload.css";
import { colorMemory } from "./Task";

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
    handleProfilingUpload,
    handleWorkloadUpload,
    workloadFileName,
    profilingFileName,
    configFileName,
    machineConfig,
    setMachineConfig,
    taskTypes,
    setTaskTypes,
    scenarioRows,
    setScenarioRows,
    generateMachineConfig,
  } = useGlobalState();
  // check sets

  const { fitView } = useReactFlow();
  const [modalOpen, setModalOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState("");
  const [newFileName, setNewFileName] = useState("");
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState(null); // { msg, error }
  const statusTimer = useRef(null);
  const [modalPosition, setModalPosition] = useState({
    top: 100,
    left: window.innerWidth / 2 - 250,
  });
  const dragStartPos = useRef({ x: 0, y: 0 });

  const notify = (msg, error = false) => {
    clearTimeout(statusTimer.current);
    setStatus({ msg, error });
    statusTimer.current = setTimeout(() => setStatus(null), 2000);
  };

  // Fetch existing files
  const fetchFiles = async () => {
    try {
      const keys = await localStore.listStates();
      setFiles(keys);
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
    if (!filename) return notify("Enter a filename", true);

    const fileWithExtension = filename.toLowerCase().endsWith(".json")
      ? filename
      : `${filename}.json`;

    try {
      if (!machineConfig) {
        generateMachineConfig(machines, taskTypes);
      }
      await localStore.saveAs(fileWithExtension, {
        nodes,
        edges,
        machines,
        iot,
        workloadFileName,
        profilingFileName,
        configFileName,
        machineConfig,
        taskTypes,
        scenarioRows,
        colorMemory,
        filename: fileWithExtension,
      });
      notify("Saved!");
      fetchFiles();
      setNewFileName("");
    } catch (err) {
      notify("Save failed: " + err.message, true);
    }
  };

  const save = async () => {
    if (!selectedFile) return notify("Select a file to save", true);
    try {
      if (!machineConfig) {
        generateMachineConfig(machines, taskTypes);
      }
      await localStore.saveState(selectedFile, {
        nodes,
        edges,
        machines,
        iot,
        workloadFileName,
        profilingFileName,
        configFileName,
        machineConfig,
        taskTypes,
        scenarioRows,
        colorMemory,
        filename: selectedFile,
      });
      notify("Saved!");
      fetchFiles();
    } catch (err) {
      notify("Save failed: " + err.message, true);
    }
  };

  // Load
  const load = async (file) => {
    try {
      const data = await localStore.loadState(file);

      if (data) {
        const loadedMachines = data.machines || [];
        const loadedIots = data.iot || [];
        const loadedEdges = data.edges || [];
        const loadedNodes = data.nodes || [];
        const loadedWorkloadFileName = data.workloadFileName || [];
        const loadedProfilingFileName = data.profilingFileName || [];
        const loadedMachineConfig = data.machineConfig || [];
        const loadedTaskTypes = data.taskTypes || [];
        const loadedScenarioRows = data.scenarioRows || [];
        const loadedcolorMemory = data.colorMemory || [];
        if (loadedWorkloadFileName?.length) {
          handleWorkloadUpload(loadedWorkloadFileName[0]);
        }

        if (loadedProfilingFileName?.length) {
          handleProfilingUpload(loadedProfilingFileName[0]);
        }

        // Separate other nodes (non-machine / non-iot)
        const otherNodes = loadedNodes.filter(
          (n) => n.type !== "machineNode" && n.type !== "iotNode",
        );

        // Map machines to React Flow nodes
        const machinesArr = loadedMachines.map((m) => ({
          id: `${m.id}`,
          type: "machineNode",
          position: m.position || { x: 0, y: 0 },
          data: m,
        }));

        // Map IoTs to React Flow nodes
        const iotArr = loadedIots.map((i) => ({
          id: `${i.id}`,
          type: "iotNode",
          position: i.position || { x: 0, y: 0 },
          data: i,
        }));
        setMachineConfig(loadedMachineConfig);
        setTaskTypes(loadedTaskTypes);
        setScenarioRows(loadedScenarioRows);
        setNodes([...otherNodes, ...machinesArr, ...iotArr]);
        setEdges(loadedEdges);
        setMachines(loadedMachines);
        setIot(loadedIots);
        notify("Loaded!");
        fetchFiles();

        // load task colors:

        fitView({ padding: 0.5, duration: 600, interpolate: "smooth" });
        window.dispatchEvent(new Event("taskColorChanged"));
      } else {
        notify("No data found in file.", true);
      }
    } catch (err) {
      notify("Load failed: " + err.message, true);
    }
  };

  // Drag & Drop
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
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

          await localStore.saveAs(file.name, data);
          notify("Loaded and saved!");
          closeModal();
          fetchFiles();
        } else {
          notify("Invalid file format.", true);
        }
      } catch (err) {
        notify("Error parsing file: " + err.message, true);
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
      return notify("Select a file and enter a new name", true);

    let newName = newFileName.trim();
    if (!newName.toLowerCase().endsWith(".json")) newName += ".json";

    try {
      await localStore.renameState(selectedFile, newName);
      notify("Renamed!");
      fetchFiles();
      setSelectedFile("");
      setNewFileName("");
    } catch (err) {
      notify("Rename failed: " + err.message, true);
    }
  };

  const triggerDownload = (filename, data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportWorkspace = () => {
    const filename = (newFileName.trim() || "workspace") + ".json";
    triggerDownload(filename, {
      nodes,
      edges,
      machines,
      iot,
      taskTypes,
      scenarioRows,
      machineConfig,
    });
    notify("Exported!");
  };

  const exportSaved = async (file, e) => {
    e.stopPropagation();
    const data = await localStore.loadState(file);
    if (data) triggerDownload(file, data);
  };

  const deleteFile = async () => {
    if (!selectedFile) return notify("Select a file to delete", true);
    try {
      await localStore.deleteState(selectedFile);
      notify("Deleted!");
      fetchFiles();
      setSelectedFile("");
    } catch (err) {
      notify("Delete failed: " + err.message, true);
    }
  };

  // Render
  return (
    <>
      <Panel position="top-left">
        <button
          onClick={openModal}
          title="Save / Load"
          className="xy-theme__button"
          style={{ padding: "6px 8px", display: "flex", alignItems: "center" }}
        >
          <VscFiles size={32} />
        </button>
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
            width: "560px",
            maxHeight: "85vh",
            padding: "0",
          },
        }}
      >
        {/* Header */}
        <div
          className="modal-header"
          onMouseDown={startDrag}
          onMouseMove={onDrag}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <VscFiles size={16} />
            <span>Saved States</span>
          </div>
          <button className="close-btn" onClick={closeModal}>
            <MdClose size={18} />
          </button>
        </div>

        <div className="modal-body">
          {status && (
            <div
              className={`status-bar ${status.error ? "status-error" : "status-ok"}`}
            >
              {status.msg}
            </div>
          )}

          {/* File list */}
          <p className="section-label">Saved workspaces</p>
          {files.length === 0 ? (
            <p className="empty-state">No saved states yet.</p>
          ) : (
            <ul className="file-list">
              {files.map((file) => (
                <li
                  key={file}
                  className={selectedFile === file ? "selected" : ""}
                  onClick={() => setSelectedFile(file)}
                >
                  <span className="file-name">
                    <VscFiles
                      size={13}
                      style={{ flexShrink: 0, opacity: 0.6 }}
                    />
                    {file}
                  </span>
                  <div style={{ display: "flex", gap: "5px", flexShrink: 0 }}>
                    <button
                      className="file-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        load(file);
                      }}
                    >
                      Load
                    </button>
                    <button
                      className="file-btn file-btn-export"
                      onClick={(e) => exportSaved(file, e)}
                      title="Download as file"
                    >
                      <MdDownload size={13} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Actions */}
          <p className="section-label" style={{ marginTop: "16px" }}>
            Actions
          </p>
          <input
            className="filename-input"
            type="text"
            placeholder="Filename (e.g. my-workspace)"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
          />
          <div className="btn-group">
            <button
              className="action-btn btn-saveas"
              onClick={saveAs}
              title="Save as new file"
            >
              <MdSaveAs size={14} /> Save As
            </button>
            <button
              className="action-btn btn-save"
              onClick={save}
              title="Save to selected file"
            >
              <MdSave size={14} /> Overwrite Save
            </button>
            <button
              className="action-btn btn-rename"
              onClick={renameFile}
              title="Rename selected file"
            >
              <MdDriveFileRenameOutline size={14} /> Rename
            </button>
            <button
              className="action-btn btn-delete"
              onClick={deleteFile}
              title="Delete selected file"
            >
              <MdDeleteOutline size={14} /> Delete
            </button>
          </div>

          {/* Export */}
          <p className="section-label" style={{ marginTop: "16px" }}>
            Export
          </p>
          <button
            className="action-btn btn-export"
            onClick={exportWorkspace}
            style={{ width: "100%" }}
          >
            <MdDownload size={14} /> Download workspace as .json
          </button>

          {/* Drop zone */}
          <div
            className="drop-zone"
            onDrop={handleDrop}
            onDragOver={allowDrop}
            style={{ marginTop: "12px" }}
          >
            <MdUploadFile size={22} style={{ opacity: 0.4 }} />
            <span>Drop a JSON state file to load</span>
          </div>
        </div>
      </Modal>
    </>
  );
}
