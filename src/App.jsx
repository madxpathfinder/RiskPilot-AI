import React, { useMemo, useState } from 'react';
import { assessments as seedAssessments, controls as seedControls, documents as seedDocs, organization, questions, reports as seedReports, riskCategories, risks as seedRisks } from './data/seed';
import { assessmentLevelFromOverall, calcRiskScore, overallAssessmentScore, riskLevelFromScore } from './lib/scoring';

const nav = ['Dashboard', 'Assessments', 'Risk Register', 'Controls', 'Documents', 'AI Assistant', 'Reports', 'Settings'];

export function App() {
  const [page, setPage] = useState('Dashboard');
  const [risks, setRisks] = useState(seedRisks);
  const [docs, setDocs] = useState(seedDocs);
  const [assessments, setAssessments] = useState(seedAssessments);
  const [language, setLanguage] = useState('en');
  const [ai, setAi] = useState('');

  const overall = useMemo(() => overallAssessmentScore(risks), [risks]);
  const overallLevel = assessmentLevelFromOverall(overall);

  const runAI = async (action, payload = {}) => {
    const r = await fetch('http://localhost:4000/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload: { ...payload, overallLevel }, language }),
    });
    const j = await r.json();
    setAi(j.result || j.warning || 'No output');
  };

  return (
    <div className='app-shell'>
      <aside className='sidebar'>
        <div className='brand'>RiskPilot AI</div>
        {nav.map((n) => (
          <button key={n} className={`nav-btn ${page === n ? 'active' : ''}`} onClick={() => setPage(n)}>{n}</button>
        ))}
      </aside>

      <main className='content'>
        <header className='topbar'>
          <div>
            <h1>{page}</h1>
            <p>{organization.name} · {organization.industry} · {organization.country}</p>
          </div>
          <span className={`badge ${overallLevel.toLowerCase()}`}>Overall: {overall}/100 · {overallLevel}</span>
        </header>

        <p className='disclaimer'>This tool supports risk assessment and reporting. It does not replace legal, regulatory, audit, or professional risk advice.</p>

        {page === 'Dashboard' && <Dashboard risks={risks} assessments={assessments} overall={overall} overallLevel={overallLevel} runAI={runAI} ai={ai} />}
        {page === 'Assessments' && <Assessments assessments={assessments} setAssessments={setAssessments} />}
        {page === 'Risk Register' && <RiskRegister risks={risks} setRisks={setRisks} />}
        {page === 'Controls' && <Controls controls={seedControls} />}
        {page === 'Documents' && <Documents docs={docs} setDocs={setDocs} runAI={runAI} ai={ai} />}
        {page === 'AI Assistant' && <Assistant runAI={runAI} ai={ai} />}
        {page === 'Reports' && <Reports reports={seedReports} />}
        {page === 'Settings' && <Settings language={language} setLanguage={setLanguage} />}
      </main>
    </div>
  );
}

function Dashboard({ risks, assessments, overall, overallLevel, runAI, ai }) {
  const kpis = [
    ['Overall Score', `${overall}/100`],
    ['Risk Level', overallLevel],
    ['Critical Risks', risks.filter((r) => r.level === 'Critical').length],
    ['High Risks', risks.filter((r) => r.level === 'High').length],
    ['Open Risks', risks.filter((r) => r.status === 'Open').length],
  ];
  return <>
    <section className='kpi-grid'>{kpis.map(([t, v]) => <article key={t} className='card'><h3>{t}</h3><strong>{v}</strong></article>)}</section>
    <section className='panel'>
      <h3>Recent Assessments</h3>
      <table><tbody>{assessments.map((a) => <tr key={a.id}><td>{a.title}</td><td>{a.status}</td><td>{a.overallScore}</td><td>{a.riskLevel}</td></tr>)}</tbody></table>
    </section>
    <section className='panel'>
      <h3>AI Risk Posture Summary</h3>
      <button onClick={() => runAI('summary')}>Generate</button>
      <pre>{ai}</pre>
    </section>
  </>;
}

function Assessments({ assessments, setAssessments }) { return <section className='panel'><div className='row'><h3>Assessments</h3><button onClick={() => setAssessments((a) => [{ id: `asm-${a.length + 1}`, title: 'New Assessment', scope: 'Custom', status: 'Draft', createdAt: new Date().toISOString(), organizationId: 'org-1', completedAt: null, overallScore: 0, riskLevel: 'Low' }, ...a])}>Start New Assessment</button></div><table><tbody>{assessments.map((a) => <tr key={a.id}><td>{a.title}</td><td>{a.scope}</td><td>{a.status}</td><td>{a.overallScore}</td><td>{a.riskLevel}</td></tr>)}</tbody></table><p className='muted'>Flow: Scope → Company Context → Questionnaire ({questions.length}) → Risk Review → Complete</p></section>; }
function RiskRegister({ risks, setRisks }) { return <section className='panel'><div className='row'><h3>Risk Register</h3><button onClick={() => { const l = 3, i = 3, s = calcRiskScore(l, i); setRisks((r) => [{ id: `risk-${r.length + 1}`, assessmentId: 'asm-2', title: 'New risk', category: riskCategories[0], description: 'Manual risk.', likelihood: l, impact: i, score: s, level: riskLevelFromScore(s), owner: 'Risk Manager', status: 'Open', recommendation: 'Define remediation.', dueDate: '2026-08-01', createdAt: new Date().toISOString() }, ...r]); }}>Add Risk</button></div><table><tbody>{risks.map((r) => <tr key={r.id}><td>{r.title}</td><td>{r.category}</td><td>{r.score}</td><td>{r.level}</td><td>{r.owner}</td><td>{r.status}</td></tr>)}</tbody></table></section>; }
function Controls({ controls }) { return <section className='panel'><h3>Controls</h3><table><tbody>{controls.map((c) => <tr key={c.id}><td>{c.title}</td><td>{c.status}</td><td>{c.effectiveness}</td><td>{c.owner}</td></tr>)}</tbody></table></section>; }
function Documents({ docs, setDocs, runAI, ai }) { const [name, setName] = useState(''); const [text, setText] = useState(''); return <section className='panel'><h3>Documents</h3><input placeholder='Document name' value={name} onChange={(e) => setName(e.target.value)} /><textarea placeholder='Paste confidential text' value={text} onChange={(e) => setText(e.target.value)} /><button onClick={() => { setDocs((d) => [{ id: `doc-${d.length + 1}`, organizationId: 'org-1', name: name || 'Untitled', type: 'Procedure', uploadedAt: new Date().toISOString(), summary: text.slice(0, 160), detectedRisks: ['Operational Risk'], missingEvidence: ['Approval metadata'] }, ...d]); runAI('summary', { text }); }}>Analyze Document</button><ul>{docs.map((d) => <li key={d.id}>{d.name} — {d.summary}</li>)}</ul><pre>{ai}</pre></section>; }
function Assistant({ runAI, ai }) { return <section className='panel'><h3>AI Assistant</h3><div className='row'><button onClick={() => runAI('findings')}>Analyze current assessment</button><button onClick={() => runAI('summary')}>Executive summary</button><button onClick={() => runAI('plan')}>30/60/90 plan</button></div><pre>{ai}</pre></section>; }
function Reports({ reports }) { return <section className='panel'><div className='row'><h3>Reports</h3><button onClick={() => window.print()}>Download PDF</button></div>{reports.map((r) => <article key={r.id} className='report'><h4>{r.title}</h4><p>{r.executiveSummary}</p></article>)}</section>; }
function Settings({ language, setLanguage }) { return <section className='panel'><h3>Settings</h3><p>Roles: Admin, Risk Manager, Auditor, Viewer</p><label>AI Language <select value={language} onChange={(e) => setLanguage(e.target.value)}><option value='en'>English</option><option value='az'>Azerbaijani</option></select></label></section>; }
