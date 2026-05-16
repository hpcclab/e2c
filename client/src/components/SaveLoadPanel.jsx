import React, { useState, useRef, useEffect } from "react";
import { useGlobalState } from "../context/GlobalStates";
import { useReactFlow } from "@xyflow/react";
import * as localStore from "../utils/localStore";
import { VscFiles } from "react-icons/vsc";
import {
  MdDeleteOutline,
  MdSave,
  MdSaveAs,
  MdClose,
  MdUploadFile,
  MdDownload,
  MdFolderOpen,
} from "react-icons/md";
import "../assets/saveload.css";
import { colorMemory } from "./Task";

const TASK_COLOR_NAME_TO_INDEX = {
  Slate: 0,
  Sky: 1,
  Teal: 2,
  Emerald: 3,
  Violet: 4,
  Rose: 5,
  Amber: 6,
  Fuchsia: 7,
};

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

  const { fitView } = useReactFlow();
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("open");
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState("");
  const [newFileName, setNewFileName] = useState("");
  const [status, setStatus] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const statusTimer = useRef(null);
  const fileInputRef = useRef(null);

  const notify = (msg, error = false) => {
    clearTimeout(statusTimer.current);
    setStatus({ msg, error });
    statusTimer.current = setTimeout(() => setStatus(null), 3000);
  };

  const openPanel = () => {
    setOpen(true);
    setActiveSection("open");
    fetchFiles();
  };

  const closePanel = () => {
    setOpen(false);
    setConfirmClear(false);
    setStatus(null);
  };

  // Close on ESC
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") closePanel(); };
    if (open) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  // ── Color memory helpers ──────────────────────────────────────────────────

  const getDerivedTaskColorMemory = (iots = []) => {
    const derived = {};
    iots.forEach((iotEntry) => {
      const taskType = iotEntry?.properties?.task_type ?? iotEntry?.name;
      if (!taskType) return;
      const colorName = iotEntry?.properties?.taskColor ?? "Slate";
      const idx = TASK_COLOR_NAME_TO_INDEX[colorName];
      if (idx !== undefined) derived[taskType] = idx;
    });
    return derived;
  };

  const normalizeTaskColorMemory = (memory = {}) => {
    const normalized = {};
    Object.entries(memory || {}).forEach(([taskType, idx]) => {
      const parsed = Number(idx);
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 7) return;
      normalized[taskType] = parsed;
    });
    return normalized;
  };

  const getPersistedTaskColorMemory = (iots = []) => ({
    ...getDerivedTaskColorMemory(iots),
    ...normalizeTaskColorMemory(colorMemory),
  });

  const restoreTaskColorMemory = (iots = [], loadedMemory = {}) => {
    const merged = {
      ...getDerivedTaskColorMemory(iots),
      ...normalizeTaskColorMemory(loadedMemory),
    };
    Object.keys(colorMemory).forEach((k) => delete colorMemory[k]);
    Object.assign(colorMemory, merged);
    window.dispatchEvent(new Event("taskColorChanged"));
  };

  // ── File operations ───────────────────────────────────────────────────────

  const fetchFiles = async () => {
    try {
      const keys = await localStore.listStates();
      setFiles(keys);
    } catch (err) {
      console.error("Error fetching files:", err);
    }
  };

  const saveAs = async () => {
    const filename = newFileName.trim();
    if (!filename) return notify("Enter a filename", true);
    const fileWithExtension = filename.toLowerCase().endsWith(".json")
      ? filename : `${filename}.json`;
    try {
      if (!machineConfig) generateMachineConfig(machines, taskTypes);
      const persistedColorMemory = getPersistedTaskColorMemory(iot);
      await localStore.saveAs(fileWithExtension, {
        nodes, edges, machines, iot,
        workloadFileName, profilingFileName, configFileName,
        machineConfig, taskTypes, scenarioRows,
        colorMemory: persistedColorMemory,
        filename: fileWithExtension,
      });
      notify("Saved as " + fileWithExtension);
      fetchFiles();
      setNewFileName("");
      setSelectedFile(fileWithExtension);
      setActiveSection("open");
    } catch (err) {
      notify("Save failed: " + err.message, true);
    }
  };

  const save = async () => {
    if (!selectedFile) return notify("Select a file first from Open", true);
    try {
      if (!machineConfig) generateMachineConfig(machines, taskTypes);
      const persistedColorMemory = getPersistedTaskColorMemory(iot);
      await localStore.saveState(selectedFile, {
        nodes, edges, machines, iot,
        workloadFileName, profilingFileName, configFileName,
        machineConfig, taskTypes, scenarioRows,
        colorMemory: persistedColorMemory,
        filename: selectedFile,
      });
      notify("Saved to " + selectedFile);
      fetchFiles();
    } catch (err) {
      notify("Save failed: " + err.message, true);
    }
  };

  const load = async (file) => {
    try {
      const data = await localStore.loadState(file);
      if (!data) return notify("No data found.", true);

      const loadedMachines = data.machines || [];
      const loadedIots = data.iot || [];
      const otherNodes = (data.nodes || []).filter(
        (n) => n.type !== "machineNode" && n.type !== "iotNode",
      );
      const machinesArr = loadedMachines.map((m) => ({
        id: `${m.id}`, type: "machineNode",
        position: m.position || { x: 0, y: 0 }, data: m,
      }));
      const iotArr = loadedIots.map((i) => ({
        id: `${i.id}`, type: "iotNode",
        position: i.position || { x: 0, y: 0 }, data: i,
      }));

      setMachineConfig(data.machineConfig || []);
      setTaskTypes(data.taskTypes || []);
      setScenarioRows(data.scenarioRows || []);
      setNodes([...otherNodes, ...machinesArr, ...iotArr]);
      setEdges(data.edges || []);
      setMachines(loadedMachines);
      setIot(loadedIots);
      restoreTaskColorMemory(loadedIots, data.colorMemory || {});
      setSelectedFile(file);

      notify("Loaded " + file);
      fitView({ padding: 0.5, duration: 600, interpolate: "smooth" });
      closePanel();
    } catch (err) {
      notify("Load failed: " + err.message, true);
    }
  };

  const deleteFile = async (fileToDelete) => {
    const target = fileToDelete || selectedFile;
    if (!target) return notify("Select a file to delete", true);
    try {
      await localStore.deleteState(target);
      notify("Deleted " + target);
      fetchFiles();
      setSelectedFile("");
    } catch (err) {
      notify("Delete failed: " + err.message, true);
    }
  };

  const triggerDownload = (filename, data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportWorkspace = () => {
    const filename = (newFileName.trim() || selectedFile || "workspace").replace(/\.json$/, "") + ".json";
    triggerDownload(filename, {
      nodes, edges, machines, iot, taskTypes, scenarioRows, machineConfig,
      colorMemory: getPersistedTaskColorMemory(iot),
    });
    notify("Exported " + filename);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file || !file.name.endsWith(".json")) {
      notify("Only .json files allowed", true);
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.machines && data.iot && data.edges) {
          const otherNodes = data.nodes?.filter(
            (n) => n.type !== "machineNode" && n.type !== "iotNode",
          ) || [];
          const machineNodes = data.machines.map((m) => ({
            id: `machine-${m.id}`, type: "machineNode",
            position: m.position || { x: 0, y: 0 }, data: m,
          }));
          const iotNodes = data.iot.map((i) => ({
            id: `iot-${i.id}`, type: "iotNode",
            position: i.position || { x: 0, y: 0 }, data: i,
          }));
          setNodes([...otherNodes, ...machineNodes, ...iotNodes]);
          setEdges(data.edges);
          setMachines(data.machines);
          setIot(data.iot);
          if (data.taskTypes) setTaskTypes(data.taskTypes);
          if (data.scenarioRows) setScenarioRows(data.scenarioRows);
          if (data.machineConfig) setMachineConfig(data.machineConfig);
          const importedColorMemory = {
            ...getDerivedTaskColorMemory(data.iot),
            ...normalizeTaskColorMemory(data.colorMemory || {}),
          };
          restoreTaskColorMemory(data.iot, importedColorMemory);
          await localStore.saveAs(file.name, { ...data, colorMemory: importedColorMemory });
          notify("Imported and saved!");
          fetchFiles();
          setActiveSection("open");
        } else {
          notify("Invalid file format.", true);
        }
      } catch (err) {
        notify("Error parsing file: " + err.message, true);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const fakeEvent = { target: { files: [file] } };
    handleFileSelect(fakeEvent);
  };

  const handleClearWorkspace = () => {
    if (!confirmClear) { setConfirmClear(true); return; }
    setNodes([]);
    setEdges([]);
    setMachines([]);
    setIot([]);
    setTaskTypes([]);
    setScenarioRows([]);
    setMachineConfig([]);
    Object.keys(colorMemory).forEach((k) => delete colorMemory[k]);
    window.dispatchEvent(new Event("taskColorChanged"));
    setConfirmClear(false);
    notify("Workspace cleared!");
    closePanel();
  };

  // ── Nav items ─────────────────────────────────────────────────────────────

  const navItems = [
    { id: "open",   label: "Open",    icon: <MdFolderOpen size={16} /> },
    { id: "saveAs", label: "Save As", icon: <MdSaveAs size={16} /> },
    { id: "save",   label: "Save",    icon: <MdSave size={16} /> },
    { id: "import", label: "Import",  icon: <MdUploadFile size={16} /> },
    { id: "export", label: "Export",  icon: <MdDownload size={16} /> },
  ];

  // ── Content sections ──────────────────────────────────────────────────────

  const renderContent = () => {
    switch (activeSection) {
      case "open":
        return (
          <div className="bs-content-inner">
            <h2 className="bs-content-title">Open</h2>
            <p className="bs-content-subtitle">Select a saved simulation to load onto the canvas.</p>
            {files.length === 0 ? (
              <p className="bs-empty">No saved simulations yet. Use Save As to create one.</p>
            ) : (
              <ul className="bs-file-list">
                {files.map((file) => (
                  <li
                    key={file}
                    className={`bs-file-item${selectedFile === file ? " selected" : ""}`}
                    onClick={() => setSelectedFile(file)}
                  >
                    {confirmDelete === file ? (
                      <>
                        <span className="bs-confirm-text">Are you sure you want to delete <strong>{file}</strong>?</span>
                        <div className="bs-file-actions">
                          <button className="bs-file-btn bs-btn-delete" onClick={(e) => { e.stopPropagation(); deleteFile(file); setConfirmDelete(null); }}>Delete</button>
                          <button className="bs-file-btn bs-btn-cancel" onClick={(e) => { e.stopPropagation(); setConfirmDelete(null); }}>Cancel</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bs-file-info">
                          <VscFiles size={14} className="bs-file-icon" />
                          <span className="bs-file-name">{file}</span>
                        </div>
                        <div className="bs-file-actions">
                          <button className="bs-file-btn bs-btn-load bs-btn-load-lg" onClick={(e) => { e.stopPropagation(); load(file); }}>
                            Open
                          </button>
                          <button className="bs-file-btn bs-btn-delete" onClick={(e) => { e.stopPropagation(); setConfirmDelete(file); }} title="Delete">
                            <MdDeleteOutline size={13} />
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );

      case "save":
        return (
          <div className="bs-content-inner">
            <h2 className="bs-content-title">Save</h2>
            <p className="bs-content-subtitle">
              {selectedFile
                ? `Overwrite "${selectedFile}" with the current workspace.`
                : "Select a file from Open first, or use Save As to create a new one."}
            </p>
            {selectedFile && (
              <div className="bs-selected-file">
                <VscFiles size={14} /> {selectedFile}
              </div>
            )}
            <button className="bs-action-btn bs-btn-primary" onClick={save} disabled={!selectedFile}>
              <MdSave size={15} /> Save
            </button>
            {status && <div className={`bs-status ${status.error ? "bs-status-error" : "bs-status-ok"}`}>{status.msg}</div>}
          </div>
        );

      case "saveAs":
        return (
          <div className="bs-content-inner">
            <h2 className="bs-content-title">Save As</h2>
            <p className="bs-content-subtitle">Save the current workspace as a new simulation file.</p>
            <label className="bs-label">Filename</label>
            <input
              className="bs-input"
              type="text"
              placeholder="e.g. hospital_icu"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveAs(); }}
            />
            <button className="bs-action-btn bs-btn-primary" onClick={saveAs}>
              <MdSaveAs size={15} /> Save As
            </button>
            {status && <div className={`bs-status ${status.error ? "bs-status-error" : "bs-status-ok"}`}>{status.msg}</div>}
          </div>
        );

      case "import":
        return (
          <div className="bs-content-inner">
            <h2 className="bs-content-title">Import</h2>
            <p className="bs-content-subtitle">Load a simulation from a JSON file on your computer.</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: "none" }}
              onChange={handleFileSelect}
            />
            <button className="bs-action-btn bs-btn-primary" onClick={() => fileInputRef.current.click()}>
              <MdUploadFile size={15} /> Choose File
            </button>
            <div
              className="bs-drop-zone"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current.click()}
            >
              <MdUploadFile size={28} className="bs-drop-icon" />
              <span>Or drag and drop a .json file here</span>
            </div>
            {status && <div className={`bs-status ${status.error ? "bs-status-error" : "bs-status-ok"}`}>{status.msg}</div>}
          </div>
        );

      case "export":
        return (
          <div className="bs-content-inner">
            <h2 className="bs-content-title">Export</h2>
            <p className="bs-content-subtitle">Download the current workspace as a JSON file to share or back up.</p>
            <label className="bs-label">Filename (optional)</label>
            <input
              className="bs-input"
              type="text"
              placeholder={selectedFile ? selectedFile.replace(/\.json$/, "") : "workspace"}
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
            />
            <button className="bs-action-btn bs-btn-primary" onClick={exportWorkspace}>
              <MdDownload size={15} /> Download JSON
            </button>
            {status && <div className={`bs-status ${status.error ? "bs-status-error" : "bs-status-ok"}`}>{status.msg}</div>}
          </div>
        );

      default:
        return null;
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <button onClick={openPanel} className="text-2l hover:underline">
        File
      </button>

      {open && (
        <div className="bs-overlay" onClick={closePanel}>
          <div className="bs-panel" onClick={(e) => e.stopPropagation()}>

            {/* Left nav */}
            <div className="bs-nav">
              <div className="bs-nav-top">
                <button className="bs-back-btn" onClick={closePanel}>
                  <MdClose size={16} /> Close
                </button>
                <div className="bs-nav-divider" />
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    className={`bs-nav-item${activeSection === item.id ? " active" : ""}`}
                    onClick={() => setActiveSection(item.id)}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="bs-nav-bottom">
                <div className="bs-nav-divider" />
                <button
                  className={`bs-nav-item bs-nav-danger${confirmClear ? " confirming" : ""}`}
                  onClick={handleClearWorkspace}
                >
                  <MdDeleteOutline size={16} />
                  {confirmClear ? "Click again to confirm" : "Clear Workspace"}
                </button>
              </div>
            </div>

            {/* Content area */}
            <div className="bs-content">
              {renderContent()}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
