
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive, ArrowRight, BookOpen, Database, FileText, Globe2, LayoutDashboard,
  Library, MapIcon, Menu, Moon, Radio, Search, ShieldCheck, Sun, X, Upload, CheckCircle2, LoaderCircle, Send, FileCheck2, Pencil, RotateCcw, Image, Video, Headphones, ExternalLink, Settings, LogOut, UserRound, Volume2, Sparkles, LockKeyhole
} from "lucide-react";

type Section = "overview"|"expeditions"|"archive"|"datasets"|"media"|"map"|"studio"|"review"|"published";
type Expedition = {id:string;name:string;region:string;year:number;description:string};
type Station = {id:string;name:string;country:string;region:string;latitude:number;longitude:number;description:string};
type Dataset = {id:string;name:string;provider:string;source_url:string;temporal_coverage:string;format:string;description:string};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
const nav = [
  ["overview","Overview",LayoutDashboard],["expeditions","Expeditions",Globe2],
  ["archive","Archive",Archive],["datasets","Datasets",Database],["media","Media",Library],
  ["map","Polar map",MapIcon],["studio","AI studio",BookOpen],["review","Review",ShieldCheck],["published","Published",Globe2]
] as const;

const fallbackStats = {expeditions:8,documents:28,datasets:8,media_assets:8};

export default function Home() {
  const [section,setSection]=useState<Section>("overview");
  const [theme,setTheme]=useState<"light"|"dark">("light");
  const [menuOpen,setMenuOpen]=useState(false);
  const [stats,setStats]=useState(fallbackStats);
  const [health,setHealth]=useState(false);
  const [query,setQuery]=useState("");
  const [searching,setSearching]=useState(false);
  const [results,setResults]=useState<any[]>([]);
  const [expeditions,setExpeditions]=useState<Expedition[]>([]);
  const [stations,setStations]=useState<Station[]>([]);
  const [datasets,setDatasets]=useState<Dataset[]>([]);
  const [selectedDocument,setSelectedDocument]=useState<any|null>(null);
  const [loadingDocument,setLoadingDocument]=useState(false);
  const [knowledgeQuery,setKnowledgeQuery]=useState("");
  const [knowledgeResult,setKnowledgeResult]=useState<any|null>(null);
  const [knowledgeLoading,setKnowledgeLoading]=useState(false);
  const [contentDraft,setContentDraft]=useState<any|null>(null);
  const [error,setError]=useState("");
  const [uploadOpen,setUploadOpen]=useState(false);
  const [uploadFile,setUploadFile]=useState<File|null>(null);
  const [uploadTitle,setUploadTitle]=useState("");
  const [uploadType,setUploadType]=useState("REPORT");
  const [uploadYear,setUploadYear]=useState("");
  const [uploadRegion,setUploadRegion]=useState("Antarctica");
  const [uploading,setUploading]=useState(false);
  const [uploadDone,setUploadDone]=useState<any|null>(null);
  const [authReady,setAuthReady]=useState(false);
  const [authenticated,setAuthenticated]=useState(false);
  const [loginEmail,setLoginEmail]=useState("");
  const [loginPassword,setLoginPassword]=useState("");
  const [settingsOpen,setSettingsOpen]=useState(false);
  const [soundEnabled,setSoundEnabled]=useState(true);
  const [motionEnabled,setMotionEnabled]=useState(true);
  const [userEmail,setUserEmail]=useState("");

  useEffect(()=>{
    const saved=localStorage.getItem("polaris-theme");
    if(saved==="dark") setTheme("dark");
    const auth=localStorage.getItem("polaris-auth");
    const email=localStorage.getItem("polaris-user-email")||"";
    const sound=localStorage.getItem("polaris-sound");
    const motion=localStorage.getItem("polaris-motion");
    if(auth==="1"){setAuthenticated(true);setUserEmail(email);}
    if(sound!==null) setSoundEnabled(sound!=="0");
    if(motion!==null) setMotionEnabled(motion!=="0");
    setAuthReady(true);
  },[]);
  useEffect(()=>{ document.documentElement.dataset.theme=theme; localStorage.setItem("polaris-theme",theme); },[theme]);
  useEffect(()=>{
    document.documentElement.dataset.motion=motionEnabled?"on":"off";
    localStorage.setItem("polaris-motion",motionEnabled?"1":"0");
  },[motionEnabled]);
  useEffect(()=>{ localStorage.setItem("polaris-sound",soundEnabled?"1":"0"); },[soundEnabled]);
  useEffect(()=>{
    if(!soundEnabled) return;
    const handler=(event:MouseEvent)=>{
      const target=event.target as HTMLElement|null;
      if(!target?.closest("button, a")) return;
      try{
        const AudioCtx=(window as any).AudioContext||(window as any).webkitAudioContext;
        if(!AudioCtx) return;
        const ctx=new AudioCtx(); const osc=ctx.createOscillator(); const gain=ctx.createGain();
        osc.type="sine"; osc.frequency.value=target.closest(".btn.primary")?620:460;
        gain.gain.setValueAtTime(0.0001,ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.028,ctx.currentTime+0.008); gain.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.075);
        osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+0.08);
        setTimeout(()=>ctx.close?.(),120);
      }catch{}
    };
    document.addEventListener("click",handler,true);
    return()=>document.removeEventListener("click",handler,true);
  },[soundEnabled]);

  useEffect(()=>{
    (async()=>{
      try {
        const [s,h,e,st,d]=await Promise.all([
          fetch(`${API}/api/stats`),fetch(`${API}/health`),fetch(`${API}/api/expeditions`),fetch(`${API}/api/stations`),fetch(`${API}/api/datasets`)
        ]);
        if(!s.ok||!h.ok||!e.ok) throw new Error();
        setStats(await s.json()); setHealth(Boolean((await h.json()).database)); setExpeditions(await e.json()); setStations(await st.json()); setDatasets(await d.json());
      } catch { setHealth(false); setError("Backend data unavailable — demo values are being shown."); }
    })();
  },[]);

  const title=useMemo(()=>nav.find(n=>n[0]===section)?.[1] || "Overview",[section]);

  const go=(id:Section)=>{setSection(id);setMenuOpen(false);window.scrollTo({top:0,behavior:"smooth"});};
  const logout=()=>{localStorage.removeItem("polaris-auth");localStorage.removeItem("polaris-user-email");setAuthenticated(false);setUserEmail("");};
  const login=()=>{localStorage.setItem("polaris-auth","1");localStorage.setItem("polaris-user-email",loginEmail.trim()||"guest@polaris.local");setUserEmail(loginEmail.trim()||"guest@polaris.local");setAuthenticated(true);};


  async function doSearch(e?:React.FormEvent) {
    e?.preventDefault();
    if(!query.trim()){setResults([]);go("archive");return;}
    setSearching(true);setError("");
    try {
      const r=await fetch(`${API}/api/search`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({query:query.trim()})
      });
      if(!r.ok) throw new Error();
      setResults((await r.json()).results||[]);go("archive");
    } catch {setError("Search service is unavailable. Check http://localhost:8001/health");go("archive");}
    finally{setSearching(false);}
  }



  async function askKnowledge(e?:React.FormEvent, explicitQuery?:string) {
    e?.preventDefault();
    const q = (explicitQuery ?? knowledgeQuery).trim();
    if (!q) return;
    setKnowledgeLoading(true);
    setError("");
    try {
      const r = await fetch(`${API}/api/knowledge/ask`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({query:q})
      });
      if (!r.ok) throw new Error();
      setKnowledgeResult(await r.json());
    } catch {
      setError("Knowledge Engine is unavailable. Check the backend health endpoint.");
    } finally {
      setKnowledgeLoading(false);
    }
  }

  async function openDocument(id:string) {
    setLoadingDocument(true);
    setError("");
    try {
      const r = await fetch(`${API}/api/documents/${id}`);
      if (!r.ok) throw new Error();
      setSelectedDocument(await r.json());
    } catch {
      setError("Could not load this source document.");
    } finally {
      setLoadingDocument(false);
    }
  }

  async function uploadSource(e:React.FormEvent) {
    e.preventDefault();
    if (!uploadFile) { setError("Choose a source file first."); return; }
    setUploading(true); setError(""); setUploadDone(null);
    try {
      const fd = new FormData();
      fd.append("file", uploadFile);
      fd.append("title", uploadTitle.trim() || uploadFile.name.replace(/\.[^/.]+$/, ""));
      fd.append("document_type", uploadType);
      if (uploadYear) fd.append("year", uploadYear);
      fd.append("region", uploadRegion);
      const r = await fetch(`${API}/api/documents/upload`, {method:"POST", body:fd});
      const data = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(data.detail || "Upload failed");
      setUploadDone(data);
      setResults(prev=>[{
        id:data.document.id,title:data.document.title,document_type:data.document.document_type,
        year:data.document.year,region:data.region,status:data.document.status,
        match_reason:"Newly indexed source — extracted and ready for grounding."
      },...prev]);
      setStats(prev=>({...prev,documents:Number(prev.documents||0)+1}));
    } catch(err:any) { setError(err?.message || "Source ingestion failed."); }
    finally { setUploading(false); }
  }

  if(!authReady) return <div className="boot-screen"><div className="boot-mark">
  <img src="/favicon.svg" alt="POLARIS" />
</div><div className="section-label">POLARIS / INITIALIZING</div><span>Preparing polar knowledge grid…</span></div>;
  if(!authenticated) return <LoginScreen email={loginEmail} setEmail={setLoginEmail} password={loginPassword} setPassword={setLoginPassword} onLogin={login}/>;

  return <div className="app">
    <aside className={`sidebar ${menuOpen?"open":""}`}>
      <div className="brand-row">
        <div className="brand-mark"><img src="/favicon.svg" alt="POLARIS" /></div>
        <div><div className="brand">POLARIS</div><div className="brand-sub">POLAR KNOWLEDGE SYSTEM</div></div>
        <button className="mobile-close" onClick={()=>setMenuOpen(false)}><X size={18}/></button>
      </div>
      <div className="side-rule"/>
      <nav className="nav">
        {nav.map(([id,label,Icon],i)=><button type="button" key={id} className={`nav-item ${section===id?"active":""}`} onClick={()=>go(id)}>
          <span className="nav-num">{String(i+1).padStart(2,"0")}</span><Icon size={15}/><span>{label}</span>
        </button>)}
      </nav>
      <div className="side-bottom"><div className={`connection ${health?"online":""}`}><span className="connection-dot"/>{health?"SYSTEM ONLINE":"DEMO MODE"}</div><small>SIH26063 / v0.13</small></div>
    </aside>

    {menuOpen&&<button className="backdrop" onClick={()=>setMenuOpen(false)} aria-label="Close navigation"/>}

    <main className="main">
      <header className="topbar">
        <button className="mobile-menu" onClick={()=>setMenuOpen(true)}><Menu size={20}/></button>
        <div><div className="crumb">MINISTRY / POLAR SCIENCE / KNOWLEDGE GRID</div><h1>{title}</h1></div>
        <div className="top-actions">
          <div className={`status ${health?"good":""}`}><span/>{health?"INDEX READY":"DEMO DATA"}</div>
          <button type="button" className="theme-toggle" onClick={()=>setTheme(theme==="light"?"dark":"light")}>
            {theme==="light"?<Moon size={16}/>:<Sun size={16}/>}<span>{theme==="light"?"Dark":"Light"}</span>
          </button>
          <button type="button" className="top-icon-button" onClick={()=>setSettingsOpen(true)} title="Settings"><Settings size={16}/></button>
          <div className="user-chip"><UserRound size={14}/><span>{userEmail || "guest@polaris.local"}</span></div>
          <button type="button" className="top-icon-button" onClick={logout} title="Sign out"><LogOut size={16}/></button>
        </div>
      </header>

      {error&&<div className="notice"><span>{error}</span><button type="button" onClick={()=>setError("")}>Dismiss</button></div>}

      {section==="overview"&&<>
        <section className="hero">
          <div className="hero-copy">
            <div className="section-label">INTEGRATED POLAR RESEARCH & OUTREACH</div>
            <h2>From polar data<br/><em>to public knowledge.</em></h2>
            <p>A unified archive, discovery engine and grounded content workflow for expedition reports, datasets, publications and media.</p>
            <div className="actions">
              <button type="button" className="btn primary" onClick={()=>go("archive")}><Search size={16}/>Explore archive</button>
              <button type="button" className="btn" onClick={()=>go("map")}><MapIcon size={16}/>Open polar map</button>
            </div>
          </div>
          <div className="polar-graphic">
            <div className="axis x"/><div className="axis y"/>
            <div className="ring one"/><div className="ring two"/><div className="ring three"/>
            <div className="point a"/><div className="point b"/><div className="point c"/>
            <span>ANTARCTICA / 70.77°S</span>
          </div>
        </section>

        <section className="stats">
          <Stat icon={<Globe2/>} value={stats.expeditions} label="EXPEDITIONS"/>
          <Stat icon={<FileText/>} value={stats.documents.toLocaleString()} label="DOCUMENTS"/>
          <Stat icon={<Database/>} value={stats.datasets} label="DATASETS"/>
          <Stat icon={<Radio/>} value={stats.media_assets.toLocaleString()} label="MEDIA ASSETS"/>
        </section>

        <section className="two-col">
          <div className="panel"><PanelTitle kicker="KNOWLEDGE DISCOVERY" title="Search the polar corpus" icon={<Search/>}/>
            <form className="search" onSubmit={doSearch}><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search reports, expeditions, datasets..."/><button type="submit">{searching?"...":"Search"}</button></form>
            <div className="chips"><button type="button" onClick={()=>{setQuery("Antarctica");doSearch();}}>ANTARCTICA</button><button type="button" onClick={()=>{setQuery("expedition");doSearch();}}>EXPEDITIONS</button><button type="button" onClick={()=>{setQuery("publication");doSearch();}}>PUBLICATIONS</button></div>
          </div>
          <div className="panel"><PanelTitle kicker="GROUNDED KNOWLEDGE" title="Polar Knowledge Engine" icon={<BookOpen/>}/>
            <p className="copy">Search indexed sources first. POLARIS now returns grounded answers, exposes evidence and routes source-linked drafts into human review before publication.</p>
            <button type="button" className="text-link" onClick={()=>go("studio")}>Open knowledge workspace <ArrowRight size={15}/></button>
          </div>
        </section>

        <section className="panel pipeline"><PanelTitle kicker="DISSEMINATION PIPELINE" title="Discover → Understand → Verify → Communicate" icon={<ArrowRight/>}/>
          <div className="pipeline-grid">{["SOURCE","RETRIEVE","GENERATE","REVIEW","PUBLISH"].map((s,i)=><div className="pipeline-step" key={s}><small>0{i+1}</small><strong>{s}</strong>{i<4&&<ArrowRight className="flow-arrow" size={15}/>}</div>)}</div>
        </section>
      </>}

      {section==="expeditions"&&<ExpeditionView data={expeditions}/>}
      {section==="archive"&&<ArchiveView results={results} query={query} searching={searching} doSearch={doSearch} setQuery={setQuery} openDocument={openDocument} onAddSource={()=>{setUploadDone(null);setUploadOpen(true)}}/>}
      {section==="datasets"&&<DatasetView data={datasets}/>}
      {section==="media"&&<MediaView/>}
      {section==="map"&&<MapView/>}
      {section==="studio"&&<KnowledgeView
  query={knowledgeQuery}
  setQuery={setKnowledgeQuery}
  result={knowledgeResult}
  loading={knowledgeLoading}
  ask={askKnowledge}
  openDocument={openDocument}
/>}
      {section==="review"&&<ReviewView openDocument={openDocument}/>}
      {section==="published"&&<PublishedView openDocument={openDocument}/>}

      {uploadOpen && (
        <div className="modal-backdrop" onMouseDown={(e)=>{if(e.target===e.currentTarget&&!uploading){setUploadOpen(false);setUploadDone(null)}}}>
          <article className="ingest-modal">
            <div className="modal-top">
              <div>
                <div className="section-label">ARCHIVE / SOURCE INGESTION</div>
                <h2>Add a source</h2>
                <p className="modal-sub">Bring a research document into the POLARIS corpus. Text is extracted, chunked and indexed immediately.</p>
              </div>
              <button type="button" className="icon-button" disabled={uploading} onClick={()=>setUploadOpen(false)}><X size={18}/></button>
            </div>
            {!uploadDone ? <form className="ingest-form" onSubmit={uploadSource}>
              <label className={`dropzone ${uploadFile?"has-file":""}`}>
                <input type="file" accept=".pdf,.docx,.txt,.md" onChange={(e)=>{const f=e.target.files?.[0]||null;setUploadFile(f);if(f&&!uploadTitle)setUploadTitle(f.name.replace(/\.[^/.]+$/, ""))}}/>
                {uploadFile ? <><CheckCircle2 size={28}/><strong>{uploadFile.name}</strong><span>{(uploadFile.size/1024/1024).toFixed(2)} MB · ready for extraction</span></> : <><Upload size={28}/><strong>Drop a source here</strong><span>PDF · DOCX · TXT · MD · max 15 MB</span></>}
              </label>
              <div className="ingest-fields">
                <label><span>TITLE</span><input value={uploadTitle} onChange={e=>setUploadTitle(e.target.value)} placeholder="Source title"/></label>
                <label><span>SOURCE TYPE</span><select value={uploadType} onChange={e=>setUploadType(e.target.value)}><option>REPORT</option><option>PUBLICATION</option><option>FIELD REPORT</option><option>DATASET NOTE</option><option>BRIEF</option></select></label>
                <label><span>YEAR</span><input value={uploadYear} onChange={e=>setUploadYear(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="2026" inputMode="numeric"/></label>
                <label><span>REGION</span><select value={uploadRegion} onChange={e=>setUploadRegion(e.target.value)}><option>Antarctica</option><option>Arctic</option><option>Polar / Global</option></select></label>
              </div>
              <div className="ingest-footer"><div><b>PROCESSING</b><span>EXTRACT → CHUNK → INDEX</span></div><button type="submit" className="btn primary" disabled={uploading||!uploadFile}>{uploading?<><LoaderCircle className="spin" size={15}/>Indexing…</>:<>Index source <ArrowRight size={15}/></>}</button></div>
            </form> : <div className="ingest-success">
              <div className="success-mark"><CheckCircle2 size={30}/></div>
              <div className="section-label">SOURCE READY</div><h3>{uploadDone.document.title}</h3>
              <p>{uploadDone.words.toLocaleString()} words · {uploadDone.chunks} chunks · indexed successfully.</p>
              <div className="ingest-success-actions"><button type="button" className="btn primary" onClick={()=>{setUploadOpen(false);openDocument(uploadDone.document.id)}}>Open source <ArrowRight size={15}/></button><button type="button" className="btn" onClick={()=>{setUploadDone(null);setUploadFile(null)}}>Add another</button></div>
            </div>}
          </article>
        </div>
      )}

      {settingsOpen && (
        <div className="modal-backdrop settings-backdrop" onMouseDown={(e)=>{if(e.target===e.currentTarget)setSettingsOpen(false)}}>
          <article className="settings-modal">
            <div className="modal-top">
              <div><div className="section-label">POLARIS / PREFERENCES</div><h2>System settings</h2><p className="modal-sub">Tune the interface for a quiet research workspace or a more responsive product demo.</p></div>
              <button type="button" className="icon-button" onClick={()=>setSettingsOpen(false)}><X size={18}/></button>
            </div>
            <div className="settings-list">
              <label className="setting-row"><span className="setting-icon"><Volume2 size={17}/></span><span><b>Interface sounds</b><small>Short tactile tones for navigation and actions. No audio is played automatically.</small></span><input className="switch" type="checkbox" checked={soundEnabled} onChange={e=>setSoundEnabled(e.target.checked)}/></label>
              <label className="setting-row"><span className="setting-icon"><Sparkles size={17}/></span><span><b>Motion & transitions</b><small>Subtle page reveals, hover movement and the polar field animation.</small></span><input className="switch" type="checkbox" checked={motionEnabled} onChange={e=>setMotionEnabled(e.target.checked)}/></label>
              <div className="setting-account"><UserRound size={15}/><div><span>SESSION</span><b>{userEmail || "Guest session"}</b></div><button type="button" className="btn" onClick={()=>{setSettingsOpen(false);logout();}}><LogOut size={14}/>Sign out</button></div>
            </div>
          </article>
        </div>
      )}

      {selectedDocument && (
        <div className="modal-backdrop" onMouseDown={(e)=>{if(e.target===e.currentTarget)setSelectedDocument(null)}}>
          <article className="document-modal">
            <div className="modal-top">
              <div>
                <div className="section-label">SOURCE DOCUMENT / VERIFIED RECORD</div>
                <h2>{selectedDocument.title}</h2>
              </div>
              <button className="icon-button" onClick={()=>setSelectedDocument(null)}><X size={18}/></button>
            </div>
            <div className="document-meta">
              <span>{selectedDocument.document_type}</span>
              <span>{selectedDocument.region || "POLAR"}</span>
              <span>{selectedDocument.year || "—"}</span>
              <span>{selectedDocument.status}</span>
            </div>
            <div className="document-layout">
              <div className="source-preview">
                <div className="paper-head">POLARIS / ARCHIVE PREVIEW</div>
                <div className="paper-lines">
                  <b>{selectedDocument.title}</b>
                  <span>Indexed source material</span>
                  <span>Expedition and research record</span>
                  <span>Structured for retrieval and citation</span>
                </div>
                <div className="page-number">SOURCE 01</div>
              </div>
              <div className="document-copy">
                <div className="section-label">EXTRACTED SOURCE TEXT</div>
                <p>{selectedDocument.extracted_text || "No extracted text is available for this source yet."}</p>
                <div className="evidence-box">
                  <div><span>INDEX STATUS</span><b>{selectedDocument.status}</b></div>
                  <div><span>SOURCE TYPE</span><b>{selectedDocument.document_type}</b></div>
                  <div><span>AI USE</span><b>GROUNDING ELIGIBLE</b></div>
                </div>
                <button type="button" className="btn primary" onClick={()=>{setSelectedDocument(null);go("studio")}}>
                  Use source in Knowledge Engine <ArrowRight size={15}/>
                </button>
              </div>
            </div>
          </article>
        </div>
      )}

      {loadingDocument && <div className="loading-strip">Loading source record…</div>}
    </main>
  </div>;
}

function LoginScreen({email,setEmail,password,setPassword,onLogin}:{email:string;setEmail:(v:string)=>void;password:string;setPassword:(v:string)=>void;onLogin:()=>void}) {
  return <main className="login-shell">
    <div className="login-field-grid"/>
    <div className="login-orbit"><div className="login-axis x"/><div className="login-axis y"/><i/><i/><i/></div>
    <section className="login-card">
      <div className="login-brand">
        <div className="login-mark">
          <img src="/favicon.svg" alt="POLARIS" />
        </div>
        <div>
          <strong>POLARIS</strong>
          <span>POLAR KNOWLEDGE SYSTEM</span>
        </div>
      </div>
      <div className="section-label">SECURE RESEARCH WORKSPACE</div>
      <h1>Enter the<br/><em>polar grid.</em></h1>
      <p>Sign in to access indexed research, field stations, grounded knowledge and the publication workspace.</p>
      <form onSubmit={(e)=>{e.preventDefault();onLogin();}} className="login-form">
        <label><span>EMAIL</span><input autoFocus type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
        <label><span>PASSWORD</span><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/></label>
        <button type="submit" className="btn primary login-submit"><LockKeyhole size={15}/>Enter POLARIS <ArrowRight size={15}/></button>
      </form>
      <button type="button" className="guest-login" onClick={onLogin}>Continue as guest <ArrowRight size={13}/></button>
      <div className="login-note">Demo access · Any email/password is accepted for this prototype.</div>
    </section>
    <div className="login-footer">SIH26063 · POLAR SCIENCE / KNOWLEDGE GRID · v0.13</div>
  </main>;
}

function Stat({icon,value,label}:{icon:React.ReactNode;value:string|number;label:string}) {
  return <div className="stat"><div className="icon">{icon}</div><strong>{value}</strong><span>{label}</span></div>;
}
function PanelTitle({kicker,title,icon}:{kicker:string;title:string;icon:React.ReactNode}) {
  return <div className="panel-title"><div><div className="section-label">{kicker}</div><h3>{title}</h3></div><div className="panel-icon">{icon}</div></div>;
}
function DatasetView({data}:{data:Dataset[]}) {
  return <section className="page"><div className="page-intro"><div><div className="section-label">DATA CATALOG / PRELOADED</div><h2>Antarctic datasets</h2><p>Source-attributed metadata is preloaded so POLARIS is useful from the first query. Full datasets remain at their authoritative providers.</p></div><div className="count-box">{data.length.toString().padStart(2,"0")} DATASETS</div></div>
    <div className="records">{data.map((d,i)=><article className="record" key={d.id}><div className="record-index">{String(i+1).padStart(2,"0")}</div><div><div className="record-meta">{d.provider} / {d.format} / {d.temporal_coverage}</div><h3>{d.name}</h3><p>{d.description}</p><a className="text-link" href={d.source_url} target="_blank" rel="noreferrer">Open authoritative source <ArrowRight size={14}/></a></div></article>)}</div>
  </section>;
}
function ExpeditionView({data}:{data:Expedition[]}) {
  return <section className="page"><div className="page-intro"><div><div className="section-label">FIELD OPERATIONS</div><h2>Expeditions</h2><p>Structured access to expedition history, regions and associated research.</p></div><div className="count-box">{data.length.toString().padStart(2,"0")} RECORDS</div></div>
    <div className="records">{data.map((e,i)=><article className="record" key={e.id}><div className="record-index">{String(i+1).padStart(2,"0")}</div><div><div className="record-meta">{e.region} / {e.year}</div><h3>{e.name}</h3><p>{e.description}</p></div><ArrowRight/></article>)}</div>
  </section>;
}
function ArchiveView({results,query,searching,doSearch,setQuery,openDocument,onAddSource}:any) {
  return <section className="page">
    <div className="page-intro">
      <div>
        <div className="section-label">SOURCE REPOSITORY / INDEXED CORPUS</div>
        <h2>Polar archive</h2>
        <p>Search indexed reports and publications. Open a source to inspect its metadata and extracted evidence before using it in the knowledge workflow.</p>
      </div>
      <div className="archive-head-actions"><div className="count-box">{results.length.toString().padStart(2,"0")} MATCHES</div><button type="button" className="btn primary add-source" onClick={onAddSource}><Upload size={14}/>Add source</button></div>
    </div>

    <form className="search large" onSubmit={doSearch}>
      <Search size={18}/>
      <input value={query} onChange={(e:any)=>setQuery(e.target.value)} placeholder="Search reports, expeditions, datasets..."/>
      <button type="submit">{searching?"Searching":"Search"}</button>
    </form>

    <div className="archive-toolbar">
      <div className="archive-filter"><span>INDEX</span><b>POLAR CORPUS</b></div>
      <div className="archive-filter"><span>ORDER</span><b>NEWEST FIRST</b></div>
      <div className="archive-filter"><span>GROUNDING</span><b>SOURCE READY</b></div>
    </div>

    <div className="result-head"><span>{results.length} RESULTS</span><span>CLICK A RECORD TO INSPECT</span></div>
    <div className="results">
      {results.length ? results.map((r:any)=>
        <button type="button" className="result result-button" key={r.id} onClick={()=>openDocument(r.id)}>
          <div className="result-type">{r.document_type}</div>
          <div className="result-main">
            <h3>{r.title}</h3>
            <p>{r.match_reason}</p>
            <div className="result-meta">{r.region||"POLAR"} · {r.year||"—"} · {r.status}</div>
          </div>
          <ArrowRight/>
        </button>
      ) : <div className="empty"><Archive size={28}/><h3>No search results yet</h3><p>Try “Antarctica”, “expedition”, or “publication”.</p></div>}
    </div>
  </section>;
}


function KnowledgeView({query,setQuery,result,loading,ask,openDocument}:any) {
  const examples=["What research activity is documented in Antarctica?","What does the Antarctic expedition report contain?","Show me information about polar research publications."];
  const [contentType,setContentType]=useState("PUBLIC EXPLAINER"); const [audience,setAudience]=useState("GENERAL PUBLIC");
  const [draft,setDraft]=useState<any|null>(null); const [generating,setGenerating]=useState(false); const [saving,setSaving]=useState(false); const [message,setMessage]=useState("");
  const askQuestion=async(q:string)=>{setQuery(q);await ask(undefined,q)};
  async function generateDraft(){const sourceIds=(result?.sources||[]).slice(0,4).map((x:any)=>x.id);setGenerating(true);setMessage("");try{const r=await fetch(`${API}/api/content/generate`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content_type:contentType,audience,source_ids:sourceIds,question:query})});const d=await r.json();if(!r.ok)throw new Error(d.detail||"Draft generation failed");setDraft(d);setMessage("Grounded draft created. Edit it, then submit it for human review.")}catch(e:any){setMessage(e?.message||"Draft generation failed.")}finally{setGenerating(false)}}
  async function saveDraft(){if(!draft)return;setSaving(true);try{const r=await fetch(`${API}/api/content/${draft.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:draft.title,body:draft.body})});const d=await r.json();if(!r.ok)throw new Error(d.detail||"Save failed");setDraft(d);setMessage("Draft saved.")}catch(e:any){setMessage(e?.message||"Save failed.")}finally{setSaving(false)}}
  async function submitDraft(){if(!draft)return;setSaving(true);try{const r0=await fetch(`${API}/api/content/${draft.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:draft.title,body:draft.body})});if(!r0.ok)throw new Error("Could not save draft");const r=await fetch(`${API}/api/content/${draft.id}/submit`,{method:"POST"});const d=await r.json();if(!r.ok)throw new Error(d.detail||"Submit failed");setDraft({...draft,...d});setMessage("Submitted to the human review queue.")}catch(e:any){setMessage(e?.message||"Submit failed")}finally{setSaving(false)}}
  return <section className="page knowledge-page">
    <div className="page-intro"><div><div className="section-label">GROUNDED KNOWLEDGE / SOURCE-FIRST AI</div><h2>Knowledge Engine</h2><p>Ask a question. POLARIS retrieves indexed evidence first, ranks matching passages and exposes supporting sources.</p></div><div className="count-box">CITATION MODE / ON</div></div>
    <div className="knowledge-hero"><div className="knowledge-mark"><BookOpen size={21}/></div><div><div className="section-label">ASK THE POLAR CORPUS</div><h3>What do you want to know?</h3><p>Answers stay tied to material already indexed in the repository.</p></div></div>
    <form className="knowledge-input" onSubmit={ask}><Search size={18}/><input value={query} onChange={(e:any)=>setQuery(e.target.value)} placeholder="Ask about an expedition, report, publication or research activity..."/><button type="submit">{loading?"Retrieving…":"Ask POLARIS"}</button></form>
    {!result&&<div className="example-questions"><span>TRY</span>{examples.map(q=><button type="button" key={q} onClick={()=>askQuestion(q)}>{q}<ArrowRight size={13}/></button>)}</div>}
    {result&&<>
      <div className="knowledge-result"><div className="answer-panel"><div className="result-head"><span>ANSWER</span><span>SOURCE GROUNDED</span></div><h3>{result.answer}</h3><div className="pipeline-status">{(result.pipeline||[]).map((step:string,i:number)=><span key={`${step}-${i}`}><b>{String(i+1).padStart(2,"0")}</b>{step.replaceAll("_"," ")}</span>)}</div></div>
      <div className="sources-panel"><div className="panel-title"><div><div className="section-label">EVIDENCE TRAIL</div><h3>Supporting sources</h3></div><div className="panel-icon"><ShieldCheck size={18}/></div></div>{result.sources?.length?result.sources.map((source:any,i:number)=><button type="button" className="source-card" key={source.id} onClick={()=>openDocument(source.id)}><div className="source-number">{String(i+1).padStart(2,"0")}</div><div><div className="record-meta">{source.document_type} · {source.year||"—"} · {source.region}</div><h4>{source.title}</h4><span>Open source record <ArrowRight size={13}/></span></div></button>):<div className="no-evidence">No supporting sources were retrieved.</div>}</div>
      <div className="retrieval-panel"><div className="section-label">RETRIEVED PASSAGES</div><h3>What the engine actually found</h3>{(result.retrieved_chunks||[]).map((chunk:any)=><div className="chunk" key={`${chunk.document_id}-${chunk.chunk_index}`}><div className="chunk-top"><span>{chunk.title}</span><b>SCORE {chunk.score}</b></div><p>{chunk.content}</p></div>)}</div></div>
      <div className="studio-builder"><div className="studio-builder-head"><div><div className="section-label">CONTENT STUDIO / GROUNDED DRAFTING</div><h3>Turn evidence into publishable knowledge</h3><p>Draft from the retrieved sources. Source markers remain visible and the draft stays editable before review.</p></div><FileCheck2 size={22}/></div>
        <div className="studio-controls"><label><span>CONTENT TYPE</span><select value={contentType} onChange={e=>setContentType(e.target.value)}><option>PUBLIC EXPLAINER</option><option>EXPEDITION BRIEFING</option><option>EDUCATIONAL MODULE</option></select></label><label><span>AUDIENCE</span><select value={audience} onChange={e=>setAudience(e.target.value)}><option>GENERAL PUBLIC</option><option>SCHOOL STUDENTS</option><option>RESEARCHERS</option><option>FIELD TEAMS</option></select></label><button type="button" className="btn primary" onClick={generateDraft} disabled={generating}>{generating?<><LoaderCircle className="spin" size={15}/>Building…</>:<>Generate grounded draft <ArrowRight size={15}/></>}</button></div>
        {draft&&<div className="draft-editor"><div className="draft-meta"><div><span>STATUS</span><b className={`status-pill ${draft.status}`}>{String(draft.status).replaceAll("_"," ").toUpperCase()}</b></div><div><span>SOURCES</span><b>{(draft.source_ids||[]).length} LINKED</b></div></div><input className="draft-title" value={draft.title||""} onChange={e=>setDraft({...draft,title:e.target.value})}/><textarea value={draft.body||""} onChange={e=>setDraft({...draft,body:e.target.value})}/><div className="draft-actions"><button type="button" className="btn" onClick={saveDraft} disabled={saving}><Pencil size={14}/>Save edits</button><button type="button" className="btn primary" onClick={submitDraft} disabled={saving||!(draft.status==="draft"||draft.status==="changes_requested")}><Send size={14}/>Submit for review</button></div></div>}
        {message&&<div className="studio-message">{message}</div>}
      </div></>}
  </section>;
}

function MediaView(){
  const [items,setItems]=useState<any[]>([]); const [loading,setLoading]=useState(true);
  useEffect(()=>{fetch(`${API}/api/media`).then(r=>r.ok?r.json():[]).then(d=>setItems(Array.isArray(d)?d:[])).catch(()=>setItems([])).finally(()=>setLoading(false))},[]);
  const iconFor=(t:string)=>t.includes("VIDEO")?<Video size={18}/>:t.includes("AUDIO")?<Headphones size={18}/>:t.includes("SATELLITE")?<Radio size={18}/>:<Image size={18}/>;
  return <section className="page"><div className="page-intro"><div><div className="section-label">MEDIA / FIELD EVIDENCE</div><h2>Media library</h2><p>Indexed field photographs, satellite observations, audio and expedition footage — catalogued with provenance before the underlying media is used.</p></div><div className="count-box">{items.length.toString().padStart(2,"0")} ASSETS</div></div>
    {loading?<div className="module-placeholder"><LoaderCircle className="spin" size={28}/><h3>Loading media index</h3></div>:<div className="media-grid">{items.map(item=>{const url=item.metadata?.open_url||item.metadata?.source_url; const isVideo=String(item.media_type||"").includes("VIDEO"); return <article className="media-card" key={item.id}><div className="media-icon">{iconFor(item.media_type)}</div><div><div className="section-label">{item.media_type}</div><h3>{item.title}</h3><p>{item.metadata?.provider||"Source provider"}{item.station?` · ${item.station}`:""}</p><span className="catalogued"><CheckCircle2 size={12}/> CATALOGUED / PROVENANCE READY</span>{url&&<a className="media-source-link" href={url} target="_blank" rel="noreferrer">{isVideo?<><Video size={13}/> Play / Open source</>:<><ExternalLink size={13}/> View source</>}</a>}</div></article>})}</div>}
    <div className="media-note"><ShieldCheck size={17}/><div><b>Media-first, evidence-safe</b><span>POLARIS stores the catalogue and provenance layer separately from large media files. This keeps the demo lightweight while preserving a path to full media ingestion.</span></div></div>
  </section>;
}

function PublishedView({openDocument}:any){
  const [items,setItems]=useState<any[]>([]); const [loading,setLoading]=useState(true); const [selected,setSelected]=useState<any|null>(null);
  async function load(){setLoading(true);try{const r=await fetch(`${API}/api/content/published`);setItems(r.ok?await r.json():[])}catch{setItems([])}finally{setLoading(false)}}
  useEffect(()=>{load()},[]);
  return <section className="page"><div className="page-intro"><div><div className="section-label">PUBLICATION / VERIFIED KNOWLEDGE</div><h2>Published knowledge</h2><p>Human-reviewed content released from the POLARIS evidence pipeline. Every item retains its source-linked trail.</p></div><div className="count-box">{items.length.toString().padStart(2,"0")} PUBLISHED</div></div>
    {loading?<div className="module-placeholder"><LoaderCircle className="spin" size={28}/><h3>Loading published library</h3></div>:items.length?<div className="published-list">{items.map(item=><article className="published-card" key={item.id}><div><div className="section-label">{item.content_type} · {item.audience}</div><h3>{item.title}</h3><p>{String(item.body||"").replace(/^#.*\n/,'').slice(0,420)}…</p><div className="published-foot"><span><CheckCircle2 size={13}/> HUMAN-REVIEWED · {(item.source_ids||[]).length} SOURCES</span><button type="button" className="btn" onClick={()=>setSelected(item)}>Read publication <ArrowRight size={14}/></button></div></div></article>)}</div>:<div className="module-placeholder"><Globe2 size={30}/><h3>No published knowledge yet</h3><p>Approve a grounded draft in Review, then publish it here.</p></div>}
    {selected&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}><article className="review-modal"><div className="modal-top"><div><div className="section-label">PUBLISHED / SOURCE-LINKED</div><h2>{selected.title}</h2></div><button type="button" className="icon-button" onClick={()=>setSelected(null)}><X size={18}/></button></div><div className="review-meta"><span>{selected.content_type}</span><span>{selected.audience}</span><span>{(selected.source_ids||[]).length} SOURCES</span><span>HUMAN REVIEWED</span></div><pre className="draft-preview">{selected.body}</pre></article></div>}
  </section>;
}

function ReviewView({openDocument}:any){
  const [items,setItems]=useState<any[]>([]);const [loading,setLoading]=useState(true);const [busy,setBusy]=useState("");const [selected,setSelected]=useState<any|null>(null);const [comment,setComment]=useState("");const [message,setMessage]=useState("");
  async function load(){setLoading(true);try{const r=await fetch(`${API}/api/review`);const d=await r.json();if(!r.ok)throw new Error(d.detail||"Review queue unavailable");setItems(Array.isArray(d)?d:[])}catch(e:any){setMessage(e?.message||"Review queue unavailable.")}finally{setLoading(false)}}
  useEffect(()=>{load()},[]);
  async function review(id:string,action:string){setBusy(id);try{const r=await fetch(`${API}/api/content/${id}/review`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,comment})});const d=await r.json();if(!r.ok)throw new Error(d.detail||"Review action failed");setSelected(null);setComment("");setMessage(action==="approve"?"Approved. Publish is now available.":"Changes requested. The draft can be revised and resubmitted.");await load()}catch(e:any){setMessage(e?.message||"Review action failed")}finally{setBusy("")}}
  async function publish(id:string){setBusy(id);try{const r=await fetch(`${API}/api/content/${id}/publish`,{method:"POST"});const d=await r.json();if(!r.ok)throw new Error(d.detail||"Publish failed");setMessage("Content published successfully.");await load()}catch(e:any){setMessage(e?.message||"Publish failed")}finally{setBusy("")}}
  return <section className="page"><div className="page-intro"><div><div className="section-label">EDITORIAL GOVERNANCE / HUMAN REVIEW</div><h2>Review queue</h2><p>Grounded drafts are not published automatically. Reviewers can inspect, request changes or approve content for publication.</p></div><div className="count-box">{items.filter(x=>x.status==="in_review").length.toString().padStart(2,"0")} AWAITING</div></div>{message&&<div className="studio-message">{message}</div>}
    {loading?<div className="module-placeholder"><LoaderCircle className="spin" size={28}/><h3>Loading review queue</h3></div>:<div className="review-list">{items.length?items.map(item=><article className="review-card" key={item.id}><div className="review-card-top"><div><div className="section-label">{item.content_type} · {item.audience}</div><h3>{item.title}</h3></div><span className={`status-pill ${item.status}`}>{item.status.replaceAll("_"," ").toUpperCase()}</span></div><p>{String(item.body||"").replace(/^#.*\n/,'').slice(0,360)}…</p><div className="review-card-foot"><span>{(item.source_ids||[]).length} linked sources · updated {new Date(item.updated_at||item.created_at).toLocaleString()}</span><div>{item.status==="in_review"&&<button type="button" className="btn" onClick={()=>setSelected(item)}>Review <ShieldCheck size={14}/></button>}{item.status==="approved"&&<button type="button" className="btn primary" onClick={()=>publish(item.id)} disabled={busy===item.id}>{busy===item.id?<LoaderCircle className="spin" size={14}/>:<><Globe2 size={14}/>Publish</>}</button>}</div></div></article>):<div className="module-placeholder"><ShieldCheck size={30}/><h3>No submissions yet</h3><p>Generate a grounded draft in AI Studio and submit it here for human review.</p></div>}</div>}
    {selected&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}><article className="review-modal"><div className="modal-top"><div><div className="section-label">REVIEW / SOURCE-LINKED DRAFT</div><h2>{selected.title}</h2></div><button type="button" className="icon-button" onClick={()=>setSelected(null)}><X size={18}/></button></div><div className="review-meta"><span>{selected.content_type}</span><span>{selected.audience}</span><span>{(selected.source_ids||[]).length} SOURCES</span></div><pre className="draft-preview">{selected.body}</pre><label className="review-comment"><span>REVIEW COMMENT</span><textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Explain approval or requested changes…"/></label><div className="review-actions"><button type="button" className="btn" onClick={()=>review(selected.id,"request_changes")} disabled={busy===selected.id}><RotateCcw size={14}/>Request changes</button><button type="button" className="btn primary" onClick={()=>review(selected.id,"approve")} disabled={busy===selected.id}><CheckCircle2 size={14}/>Approve</button></div></article></div>}
  </section>;
}

function MapView() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const [stations,setStations]=useState<Station[]>([]);
  const [selected,setSelected]=useState<Station|null>(null);
  const [loading,setLoading]=useState(true);
  const [mapReady,setMapReady]=useState(false);

  useEffect(()=>{
    let alive=true;
    fetch(`${API}/api/stations`)
      .then(r=>r.ok?r.json():[])
      .then(data=>{
        if(!alive) return;
        const seen=new Set<string>();
        const clean=(Array.isArray(data)?data:[]).filter((s:any)=>{
          const key=String(s.name||'').trim().toLowerCase();
          if(!key || seen.has(key)) return false;
          seen.add(key); return Number.isFinite(Number(s.latitude)) && Number.isFinite(Number(s.longitude));
        }).map((s:any)=>({...s,latitude:Number(s.latitude),longitude:Number(s.longitude)}));
        setStations(clean);
      })
      .catch(()=>alive&&setStations([]))
      .finally(()=>alive&&setLoading(false));
    return ()=>{alive=false};
  },[]);

  useEffect(()=>{
    let cancelled=false;
    function loadLeaflet(){
      return new Promise<any>((resolve,reject)=>{
        const existing=(window as any).L;
        if(existing){resolve(existing);return;}
        const cssId='polaris-leaflet-css';
        if(!document.getElementById(cssId)){
          const link=document.createElement('link'); link.id=cssId; link.rel='stylesheet';
          link.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(link);
        }
        const script=document.createElement('script'); script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; script.async=true;
        script.onload=()=>resolve((window as any).L); script.onerror=()=>reject(new Error('Leaflet failed to load')); document.head.appendChild(script);
      });
    }
    async function init(){
      if(!mapRef.current || leafletMapRef.current) return;
      try{
        const L=await loadLeaflet();
        if(cancelled || !mapRef.current) return;
        const map=L.map(mapRef.current,{zoomControl:true,scrollWheelZoom:true,attributionControl:true,minZoom:1,maxZoom:7,worldCopyJump:false});
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
        leafletMapRef.current=map;
        setMapReady(true);
        setTimeout(()=>map.invalidateSize(),80);
      }catch(e){ console.error(e); }
    }
    init();
    return ()=>{cancelled=true;if(leafletMapRef.current){leafletMapRef.current.remove();leafletMapRef.current=null;}};
  },[]);

  useEffect(()=>{
    const map=leafletMapRef.current;
    if(!map || !stations.length) return;
    const L=(window as any).L;
    if(!L) return;
    markersRef.current.forEach(m=>m.remove());
    markersRef.current.clear();
    const bounds=L.latLngBounds([]);
    stations.forEach(station=>{
      const icon=L.divIcon({className:'polaris-marker-wrap',html:'<span class="polaris-marker"></span>',iconSize:[18,18],iconAnchor:[9,9]});
      const marker=L.marker([station.latitude,station.longitude],{icon}).addTo(map);
      marker.bindPopup(`<div class="polaris-popup"><strong>${escapeHtml(station.name)}</strong><span>${escapeHtml(station.country||'')} · ${escapeHtml(station.region||'')}</span><small>${station.latitude.toFixed(4)}°, ${station.longitude.toFixed(4)}°</small></div>`);
      marker.on('click',()=>setSelected(station));
      markersRef.current.set(String(station.id),marker);
      bounds.extend([station.latitude,station.longitude]);
    });
    if(!selected) map.fitBounds(bounds,{padding:[36,36],maxZoom:4});
    else map.setView([selected.latitude,selected.longitude],Math.max(map.getZoom(),4),{animate:true});
  },[stations,mapReady]);

  useEffect(()=>{
    const map=leafletMapRef.current;
    if(!map || !selected) return;
    const marker=markersRef.current.get(String(selected.id));
    map.flyTo([selected.latitude,selected.longitude],Math.max(map.getZoom(),4),{duration:.6});
    marker?.openPopup();
  },[selected]);

  function selectStation(station:Station){setSelected(station);}

  return <section className="page">
    <div className="page-intro">
      <div>
        <div className="section-label">GEOSPATIAL EXPLORER / LIVE STATION DATA</div>
        <h2>Polar map</h2>
        <p>Every marker is positioned from the station's latitude and longitude returned by the POLARIS API.</p>
      </div>
      <div className="count-box">{stations.length.toString().padStart(2,"0")} STATIONS</div>
    </div>

    <div className="map-layout">
      <div className="live-map">
        <div ref={mapRef} className="leaflet-map" aria-label="Interactive Antarctic research station map" />
        <div className="map-overlay">
          <div className="map-overlay-title">POLARIS / FIELD MAP</div>
          <div className="map-overlay-sub">OPENSTREETMAP TILES · API COORDINATES</div>
        </div>
        {!mapReady&&<div className="map-loading"><LoaderCircle className="spin" size={16}/> Loading field map…</div>}
      </div>

      <aside className="station-panel">
        <div className="section-label">RESEARCH STATIONS</div>
        <h3>Field network</h3>
        {loading&&<div className="station-empty">Loading station data…</div>}
        {!loading && stations.map((station)=> (
          <button type="button" className={`station-row ${selected?.id===station.id?"active":""}`} key={station.id} onClick={()=>selectStation(station)}>
            <span className="station-dot"></span>
            <span><b>{station.name}</b><small>{station.region} · {station.country}</small></span>
            <ArrowRight size={14}/>
          </button>
        ))}
        {!loading && !stations.length&&<div className="station-empty">No stations returned by the backend.</div>}
        {selected&&<div className="station-detail">
          <div className="section-label">SELECTED STATION</div>
          <h4>{selected.name}</h4>
          <p>{selected.description || "Research station record."}</p>
          <div className="coords">
            <span>LAT <b>{selected.latitude.toFixed(4)}°</b></span>
            <span>LON <b>{selected.longitude.toFixed(4)}°</b></span>
          </div>
          <button type="button" className="text-link map-focus" onClick={()=>selectStation(selected)}>Focus on station <ArrowRight size={14}/></button>
        </div>}
      </aside>
    </div>
  </section>;
}

function escapeHtml(value:string){
  return String(value).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]||c));
}

function Placeholder({title,icon,text,action}:{title:string;icon:React.ReactNode;text:string;action?:string}) {
  return <section className="page"><div className="page-intro"><div><div className="section-label">POLARIS MODULE</div><h2>{title}</h2><p>{text}</p></div></div>
    <div className="module-placeholder"><div className="big-icon">{icon}</div><h3>Module ready for integration</h3><p>The application shell is wired so the real workflow can be added without redesigning the product.</p>{action&&<button type="button" className="btn primary">{action}<ArrowRight size={15}/></button>}</div></section>;
}
