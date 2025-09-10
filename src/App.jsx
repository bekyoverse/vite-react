// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";

// --- Minimal single-file task manager for freelancers ---
// Features
// - Tasks: title, notes, priority, status, due date, client/tag, estimate (hrs)
// - Column view (To Do / Doing / Done)
// - Filters: search, priority, tag
// - Sorting: by urgency (due date) or priority
// - Quick add, inline edits
// - Local storage persistence
// - Lightweight, Tailwind UI

const PRIORITIES = [
  { key: "P1", label: "P1 – Critical" },
  { key: "P2", label: "P2 – High" },
  { key: "P3", label: "P3 – Normal" },
  { key: "P4", label: "P4 – Low" },
];

const STATUSES = [
  { key: "todo", label: "To Do" },
  { key: "doing", label: "Doing" },
  { key: "done", label: "Done" },
];

const STORAGE_KEY = "freelancer_task_manager_v1";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

function Header() {
  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <div>
        <h1 className="text-2xl font-bold">Freelancer Task Manager</h1>
        <p className="text-sm text-gray-500">Prioritize, plan, and track client work.</p>
      </div>
      <a
        className="text-xs text-gray-500 hover:text-gray-700"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          alert(
            "Data is stored locally in your browser (localStorage). Export/Import is available from the Settings panel."
          );
        }}
      >
        How it works
      </a>
    </div>
  );
}

const defaultTask = {
  id: "",
  title: "",
  notes: "",
  priority: "P3",
  status: "todo",
  due: "",
  tag: "", // client/project
  estimate: "", // hours
};

function QuickAdd({ onAdd }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("P3");
  const [due, setDue] = useState("");
  const [tag, setTag] = useState("");

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-2 p-4">
      <input
        className="rounded-2xl border p-2 focus:outline-none"
        placeholder="Quick add: Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <select
        className="rounded-2xl border p-2"
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
      >
        {PRIORITIES.map((p) => (
          <option key={p.key} value={p.key}>
            {p.label}
          </option>
        ))}
      </select>
      <input
        type="date"
        className="rounded-2xl border p-2"
        value={due}
        onChange={(e) => setDue(e.target.value)}
      />
      <input
        className="rounded-2xl border p-2"
        placeholder="Client / Tag"
        value={tag}
        onChange={(e) => setTag(e.target.value)}
      />
      <button
        className="rounded-2xl bg-black px-4 py-2 text-white"
        onClick={() => {
          if (!title.trim()) return;
          onAdd({
            ...defaultTask,
            id: uid(),
            title: title.trim(),
            priority,
            due,
            tag: tag.trim(),
          });
          setTitle("");
          setDue("");
          setTag("");
          setPriority("P3");
        }}
      >
        Add Task
      </button>
    </div>
  );
}

function Controls({ filters, setFilters, onClearDone, onExport, onImport, onReset }) {
  return (
    <div className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <input
          className="w-full max-w-xs rounded-2xl border p-2"
          placeholder="Search title/notes/tag"
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
        />
        <select
          className="rounded-2xl border p-2"
          value={filters.priority}
          onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
        >
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>
        <select
          className="rounded-2xl border p-2"
          value={filters.sort}
          onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
        >
          <option value="urgency">Sort: Urgency (due date)</option>
          <option value="priority">Sort: Priority</option>
          <option value="alpha">Sort: A→Z</option>
        </select>
        <button className="rounded-2xl border px-3 py-2" onClick={onClearDone}>
          Clear Done
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button className="rounded-2xl border px-3 py-2" onClick={onExport}>
          Export JSON
        </button>
        <label className="rounded-2xl border px-3 py-2 cursor-pointer">
          Import JSON
          <input
            type="file"
            accept="application/json"
            className="hidden"
            onChange={onImport}
          />
        </label>
        <button className="rounded-2xl border px-3 py-2" onClick={onReset}>
          Reset
        </button>
      </div>
    </div>
  );
}

function StatusColumn({ status, tasks, onUpdate, titleExtra }) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-gray-100">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold">
          {STATUSES.find((s) => s.key === status)?.label} ({tasks.length})
        </h3>
        {titleExtra}
      </div>
      <div className="flex flex-col gap-2">
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} onUpdate={onUpdate} />
        ))}
        {tasks.length === 0 && (
          <div className="rounded-xl border border-dashed p-4 text-center text-sm text-gray-400">
            No tasks here
          </div>
        )}
      </div>
    </div>
  );
}

function priorityBadge(p) {
  const map = {
    P1: "bg-red-100 text-red-700",
    P2: "bg-amber-100 text-amber-700",
    P3: "bg-blue-100 text-blue-700",
    P4: "bg-gray-100 text-gray-600",
  };
  return map[p] || map.P3;
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  const target = new Date(dateStr + "T00:00:00");
  const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  return diff;
}

function TaskCard({ task, onUpdate }) {
  const [edit, setEdit] = useState(false);
  const dueIn = daysUntil(task.due);

  return (
    <div className="rounded-2xl border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={task.status === "done"}
            onChange={(e) =>
              onUpdate({ ...task, status: e.target.checked ? "done" : "todo" })
            }
          />
          {!edit ? (
            <div>
              <div className="font-medium">{task.title}</div>
              <div className="text-xs text-gray-500">{task.tag}</div>
            </div>
          ) : (
            <input
              className="rounded-xl border p-1"
              value={task.title}
              onChange={(e) => onUpdate({ ...task, title: e.target.value })}
            />
          )}
        </div>
        <span className={classNames("rounded-full px-2 py-1 text-xs", priorityBadge(task.priority))}>
          {task.priority}
        </span>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-gray-500">Due</span>
          <input
            type="date"
            className="w-full rounded-xl border p-1"
            value={task.due}
            onChange={(e) => onUpdate({ ...task, due: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-500">Est</span>
          <input
            placeholder="hrs"
            className="w-full rounded-xl border p-1"
            value={task.estimate || ""}
            onChange={(e) => onUpdate({ ...task, estimate: e.target.value })}
          />
        </div>
        <div className="col-span-2">
          {!edit ? (
            <p className="min-h-[1.5rem] whitespace-pre-wrap text-sm text-gray-700">
              {task.notes}
            </p>
          ) : (
            <textarea
              className="w-full rounded-xl border p-2 text-sm"
              rows={3}
              placeholder="Notes…"
              value={task.notes}
              onChange={(e) => onUpdate({ ...task, notes: e.target.value })}
            />
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          {task.due && (
            <span
              className={classNames(
                dueIn !== null && dueIn <= 1 && task.status !== "done" && "text-red-600 font-semibold"
              )}
            >
              {dueIn === null ? "" : dueIn >= 0 ? `${dueIn}d left` : `${Math.abs(dueIn)}d late`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded-xl border p-1 text-sm"
            value={task.status}
            onChange={(e) => onUpdate({ ...task, status: e.target.value })}
          >
            {STATUSES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            className="rounded-xl border p-1 text-sm"
            value={task.priority}
            onChange={(e) => onUpdate({ ...task, priority: e.target.value })}
          >
            {PRIORITIES.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
          <button
            className="rounded-xl border px-2 py-1 text-sm"
            onClick={() => setEdit((v) => !v)}
          >
            {edit ? "Done" : "Edit"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [tasks, setTasks] = useState(() => load()?.tasks || []);
  const [filters, setFilters] = useState({ q: "", priority: "", sort: "urgency" });

  useEffect(() => {
    save({ tasks });
  }, [tasks]);

  const addTask = (t) => setTasks((xs) => [t, ...xs]);
  const updateTask = (t) => setTasks((xs) => xs.map((x) => (x.id === t.id ? t : x)));
  const clearDone = () => setTasks((xs) => xs.filter((x) => x.status !== "done"));
  const reset = () => {
    if (!confirm("Reset all tasks?")) return;
    setTasks([]);
  };

  const importJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (Array.isArray(data.tasks)) setTasks(data.tasks);
        else if (Array.isArray(data)) setTasks(data); // allow plain array
        else alert("Invalid JSON format");
      } catch (err) {
        alert("Failed to parse JSON");
      }
    };
    reader.readAsText(file);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ tasks }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tasks.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = useMemo(() => {
    let xs = [...tasks];
    if (filters.q) {
      const q = filters.q.toLowerCase();
      xs = xs.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.notes || "").toLowerCase().includes(q) ||
          (t.tag || "").toLowerCase().includes(q)
      );
    }
    if (filters.priority) xs = xs.filter((t) => t.priority === filters.priority);

    const priorityRank = { P1: 1, P2: 2, P3: 3, P4: 4 };

    if (filters.sort === "priority") {
      xs.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
    } else if (filters.sort === "alpha") {
      xs.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      // urgency: due date first (earliest), then priority
      xs.sort((a, b) => {
        const ad = a.due ? new Date(a.due) : new Date("9999-12-31");
        const bd = b.due ? new Date(b.due) : new Date("9999-12-31");
        const diff = ad - bd;
        if (diff !== 0) return diff;
        return priorityRank[a.priority] - priorityRank[b.priority];
      });
    }

    return xs;
  }, [tasks, filters]);

  const counts = useMemo(() => {
    const byStatus = Object.fromEntries(STATUSES.map((s) => [s.key, 0]));
    const byPriority = Object.fromEntries(PRIORITIES.map((p) => [p.key, 0]));
    tasks.forEach((t) => {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
    });
    return { byStatus, byPriority };
  }, [tasks]);

  const grouped = useMemo(() => {
    const map = { todo: [], doing: [], done: [] };
    filtered.forEach((t) => map[t.status].push(t));
    return map;
  }, [filtered]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <QuickAdd onAdd={addTask} />
      <Controls
        filters={filters}
        setFilters={setFilters}
        onClearDone={clearDone}
        onExport={exportJson}
        onImport={importJson}
        onReset={reset}
      />

      <div className="px-4 pb-6">
        {/* At-a-glance stats */}
        <div className="mb-4 grid grid-cols-3 gap-3 md:grid-cols-6">
          <Stat label="To Do" value={counts.byStatus.todo || 0} />
          <Stat label="Doing" value={counts.byStatus.doing || 0} />
          <Stat label="Done" value={counts.byStatus.done || 0} />
          <Stat label="P1" value={counts.byPriority.P1 || 0} />
          <Stat label="P2" value={counts.byPriority.P2 || 0} />
          <Stat label="P3+" value={(counts.byPriority.P3 || 0) + (counts.byPriority.P4 || 0)} />
        </div>

        {/* Columns */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatusColumn status="todo" tasks={grouped.todo} onUpdate={updateTask} />
          <StatusColumn status="doing" tasks={grouped.doing} onUpdate={updateTask} />
          <StatusColumn status="done" tasks={grouped.done} onUpdate={updateTask} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-gray-100">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
