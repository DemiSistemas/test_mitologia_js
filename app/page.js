 "use client";

import { useMemo, useState } from "react";
import DATA from "@/data.json";

const MYTHS = DATA.myths;
const QUESTIONS = DATA.questions;
const TIE_ORDER = DATA.tieOrder;

function calculateRanking(answers) {
  const scores = Object.fromEntries(TIE_ORDER.map((code) => [code, 0]));
  answers.forEach((answer, questionIndex) => {
    const option = QUESTIONS[questionIndex].options.find((item) => item.label === answer);
    if (!option) return;
    Object.entries(option.scores).forEach(([myth, points]) => {
      scores[myth] += points;
    });
  });
  return [...TIE_ORDER].sort((a, b) => scores[b] - scores[a] || TIE_ORDER.indexOf(a) - TIE_ORDER.indexOf(b));
}

export default function Home() {
  const [stage, setStage] = useState("identify");
  const [cirse, setCirse] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState(Array(QUESTIONS.length).fill(""));
  const [ranking, setRanking] = useState([]);
  const [chosen, setChosen] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const selectedCount = useMemo(() => answers.filter(Boolean).length, [answers]);

  async function api(payload) {
    const response = await fetch("/api/campista", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "No se pudo completar la operación.");
    return data;
  }

  async function verifyCirse(event) {
    event.preventDefault();
    setError("");
    const value = cirse.trim();
    if (!/^\d+$/.test(value)) {
      setError("Ingresá tu número de Circe usando solo números.");
      return;
    }
    setBusy(true);
    try {
      await api({ action: "lookup", cirse: value });
      setCirse(value);
      setStage("quiz");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function setAnswer(label) {
    setAnswers((previous) => previous.map((value, index) => index === questionIndex ? label : value));
    setError("");
  }

  function finishQuestions(event) {
    event.preventDefault();
    if (answers.some((answer) => !answer)) {
      setError("Respondé todas las preguntas antes de continuar.");
      return;
    }
    setRanking(calculateRanking(answers));
    setChosen("");
    setError("");
    setStage("choose");
  }

  async function saveChoice(event) {
    event.preventDefault();
    if (!chosen) {
      setError("Elegí una mitología para continuar.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api({ action: "save", cirse, mitologia: chosen });
      setStage("done");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setStage("identify");
    setCirse("");
    setQuestionIndex(0);
    setAnswers(Array(QUESTIONS.length).fill(""));
    setRanking([]);
    setChosen("");
    setError("");
    setBusy(false);
  }

  return (
    <main className="shell">
      <section className="panel">
        <div className="brand-mark" aria-hidden="true">⚡</div>
        <p className="eyebrow">DEMIGODS ARG</p>
        <h1>Test de mitología</h1>
        <p className="intro">Respondé las preguntas y al final elegí la mitología que más te represente.</p>

        {error && <div className="alert" role="alert">{error}</div>}

        {stage === "identify" && (
          <form onSubmit={verifyCirse} className="form-stack">
            <label htmlFor="cirse">Número de Circe</label>
            <input id="cirse" inputMode="numeric" autoComplete="off" placeholder="Ingresá tu número" value={cirse} onChange={(e) => setCirse(e.target.value)} />
            <button type="submit" disabled={busy}>{busy ? "Verificando…" : "Continuar"}</button>
          </form>
        )}

        {stage === "quiz" && (
          <form onSubmit={finishQuestions} className="form-stack">
            <div className="progress-meta"><span>Circe: {cirse}</span><span>Pregunta {questionIndex + 1} de {QUESTIONS.length}</span></div>
            <div className="progress-track"><div className="progress-fill" style={{ width: `${((questionIndex + 1) / QUESTIONS.length) * 100}%` }} /></div>
            <h2>{QUESTIONS[questionIndex].title}</h2>
            <div className="options">
              {QUESTIONS[questionIndex].options.map((option) => (
                <label className={`option ${answers[questionIndex] === option.label ? "selected" : ""}`} key={option.label}>
                  <input type="radio" name={`question-${questionIndex}`} value={option.label} checked={answers[questionIndex] === option.label} onChange={() => setAnswer(option.label)} />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            <div className="button-row">
              <button type="button" className="secondary" disabled={questionIndex === 0} onClick={() => { setQuestionIndex((i) => i - 1); setError(""); }}>← Anterior</button>
              {questionIndex < QUESTIONS.length - 1 ? (
                <button type="button" onClick={() => {
                  if (!answers[questionIndex]) { setError("Elegí una respuesta para continuar."); return; }
                  setQuestionIndex((i) => i + 1); setError("");
                }}>Siguiente →</button>
              ) : (
                <button type="submit">Ver resultados →</button>
              )}
            </div>
            <p className="muted">{selectedCount} de {QUESTIONS.length} respuestas completadas</p>
          </form>
        )}

        {stage === "choose" && (
          <form onSubmit={saveChoice} className="form-stack">
            <h2>¿A qué mitología pertenecés?</h2>
            <p className="muted">Estas son tus afinidades según tus respuestas. Los puntajes no se muestran. Elegí una opción.</p>
            <div className="options">
              {ranking.map((code) => (
                <label className={`option myth-option ${chosen === MYTHS[code] ? "selected" : ""}`} key={code}>
                  <input type="radio" name="mythology" value={MYTHS[code]} checked={chosen === MYTHS[code]} onChange={() => { setChosen(MYTHS[code]); setError(""); }} />
                  <span>{MYTHS[code]}</span>
                </label>
              ))}
            </div>
            <button type="submit" disabled={busy}>{busy ? "Guardando…" : "Confirmar mi elección"}</button>
            <button type="button" className="secondary" onClick={() => { setStage("quiz"); setQuestionIndex(QUESTIONS.length - 1); setError(""); }}>Volver a las preguntas</button>
          </form>
        )}

        {stage === "done" && (
          <div className="form-stack success">
            <div className="success-icon">✓</div>
            <h2>¡Listo!</h2>
            <p>Tu mitología elegida es: <strong>{chosen}</strong>.</p>
            <p>Tu elección quedó guardada.</p>
            <button type="button" onClick={reset}>Volver al inicio</button>
          </div>
        )}
        <footer>Demigods ARG · Test de mitología</footer>
      </section>
    </main>
  );
}
