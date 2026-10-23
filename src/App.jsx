import { useState } from "react";
import {
  BookOpen, MessageCircle, Sparkles, FileText, Tags, Send, Copy,
  Check, RotateCcw, GraduationCap, LoaderCircle, Menu, X
} from "lucide-react";

const tasks = [
  { id: "chat", label: "Ask AI", icon: MessageCircle, title: "What would you like to learn?", hint: "Ask any academic question and get a clear explanation." },
  { id: "generate", label: "Generate notes", icon: Sparkles, title: "Create study notes", hint: "Enter a subject or topic for exam-ready notes." },
  { id: "summarize", label: "Summarize text", icon: FileText, title: "Make text easier to study", hint: "Paste your notes or article and get a concise summary." },
  { id: "categorize", label: "Categorize", icon: Tags, title: "Identify the topic", hint: "Paste academic text to identify its subject and keywords." }
];

const examples = [
  { label: "Explain machine learning", text: "Explain machine learning in simple English with examples." },
  { label: "Generate DBMS notes", text: "Generate short exam-ready notes on database normalization, including 1NF, 2NF, and 3NF." },
  { label: "Summarize AI", text: "Artificial intelligence is a field of computer science focused on building systems that perform tasks associated with human intelligence. Machine learning is a subset of AI that learns patterns from data. Deep learning uses multi-layer neural networks to learn complex representations. These techniques are used in healthcare, education, finance, and transportation." }
];

function formatAnswer(text) {
  return text.split("\n").map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div className="answer-space" key={i} />;
    if (/^#{1,3}\s/.test(trimmed)) return <h3 key={i}>{trimmed.replace(/^#{1,3}\s/, "")}</h3>;
    if (/^[-*]\s/.test(trimmed)) return <div className="answer-bullet" key={i}>• {trimmed.replace(/^[-*]\s/, "")}</div>;
    if (/^\d+[.)]\s/.test(trimmed)) return <div className="answer-bullet" key={i}>{trimmed}</div>;
    return <p key={i}>{trimmed.replace(/\*\*(.*?)\*\*/g, "$1")}</p>;
  });
}

export default function App() {
  const [task, setTask] = useState("chat");
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const selected = tasks.find(t => t.id === task) || tasks[0];

  async function submit(value = input) {
    if (!value.trim() || loading) return;
    setLoading(true);
    setError("");
    setAnswer("");
    setCopied(false);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const response = await fetch(`${apiBaseUrl}/api/ai/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, text: value.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request failed.");
      setAnswer(data.answer);
      setHistory(prev => [{ task, input: value.trim(), answer: data.answer, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }, ...prev].slice(0, 8));
    } catch (e) {
      setError(e.message || "Could not connect to the server. Is it running?");
    } finally {
      setLoading(false);
    }
  }

  function chooseTask(id) {
    setTask(id);
    setAnswer("");
    setError("");
    setMenuOpen(false);
  }

  async function copyAnswer() {
    try {
      await navigator.clipboard.writeText(answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Clipboard access was blocked by your browser.");
    }
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><GraduationCap size={23} /></div>
          <div><strong>StudyMate</strong><span>ACADEMIC AI</span></div>
          <button className="icon-button close-menu" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={19}/></button>
        </div>
        <button className="new-chat" onClick={() => { setAnswer(""); setInput(""); setError(""); }}><Sparkles size={17}/> New session</button>
        <div className="nav-label">TOOLS</div>
        <nav>
          {tasks.map(item => {
            const Icon = item.icon;
            return <button key={item.id} className={`nav-item ${task === item.id ? "active" : ""}`} onClick={() => chooseTask(item.id)}>
              <Icon size={18}/><span>{item.label}</span>
            </button>;
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="privacy-card"><div className="privacy-dot"/><div><strong>AI-powered learning</strong><p>Answers generated with Gemini</p></div></div>
          <p className="sidebar-foot">Study smarter, one question at a time.</p>
        </div>
      </aside>

      {menuOpen && <button className="scrim" onClick={() => setMenuOpen(false)} aria-label="Close navigation"/>}

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button menu-button" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={21}/></button>
          <div className="breadcrumb"><BookOpen size={16}/><span>Workspace</span><span className="crumb-sep">/</span><strong>{selected.label}</strong></div>
          <div className="online-pill"><span/> Gemini ready</div>
        </header>

        <div className="workspace">
          <section className="welcome">
            <div className="welcome-icon"><selected.icon size={25}/></div>
            <div className="eyebrow">YOUR PERSONAL STUDY PARTNER</div>
            <h1>{selected.title}</h1>
            <p>{selected.hint}</p>
          </section>

          {!answer && !loading && (
            <section className="examples">
              <div className="section-label">TRY AN EXAMPLE</div>
              <div className="example-grid">
                {examples.map((ex, i) => <button className="example-card" key={ex.label} onClick={() => { if (i === 2) setTask("summarize"); setInput(ex.text); }}>
                  <span>{ex.label}</span><span className="example-arrow">↗</span>
                </button>)}
              </div>
            </section>
          )}

          <section className="result-area" aria-live="polite">
            {loading && <div className="loading-card"><LoaderCircle className="spin" size={22}/><div><strong>Working on your answer…</strong><p>Gemini is preparing your academic response.</p></div></div>}
            {error && <div className="error-card"><strong>Unable to complete request</strong><p>{error}</p><button onClick={() => submit()}>Try again</button></div>}
            {answer && <article className="answer-card">
              <div className="answer-header"><div className="answer-avatar"><Sparkles size={17}/></div><div><strong>StudyMate response</strong><span>Generated just now · Review for accuracy</span></div><button className="copy-button" onClick={copyAnswer}>{copied ? <Check size={15}/> : <Copy size={15}/>} {copied ? "Copied" : "Copy"}</button></div>
              <div className="answer-content">{formatAnswer(answer)}</div>
              <div className="answer-note">AI can make mistakes. Verify important facts with your class notes or trusted sources.</div>
            </article>}
          </section>

          {history.length > 0 && !answer && !loading && <section className="history-section"><div className="section-label">RECENT IN THIS SESSION</div>{history.slice(0, 3).map((h, i) => <button className="history-item" key={i} onClick={() => { setTask(h.task); setInput(h.input); setAnswer(h.answer); }}><RotateCcw size={15}/><span>{h.input}</span><small>{h.time}</small></button>)}</section>}

          <div className="composer-wrap">
            <form className="composer" onSubmit={e => { e.preventDefault(); submit(); }}>
              <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }} placeholder={task === "summarize" ? "Paste your academic text here…" : task === "categorize" ? "Paste text to identify its subject…" : task === "generate" ? "Enter a topic for your study notes…" : "Ask your academic question…"} rows={3} maxLength={20000}/>
              <div className="composer-footer"><span>Shift + Enter for a new line · {input.length.toLocaleString()}/20,000</span><button className="send-button" type="submit" disabled={loading || !input.trim()}><Send size={16}/><span>{loading ? "Thinking" : "Ask AI"}</span></button></div>
            </form>
            <p className="disclaimer">For learning support only. Check AI-generated information before using it in assignments.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
