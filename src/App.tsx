import { useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import {
  ArrowDownToLine, ArrowRight, Check, ChevronDown, Clapperboard, FileVideo2,
  Film, FolderOpen, Gauge, Layers3, MessageSquareText, MoreHorizontal,
  Play, Plus, RotateCcw, Scissors, Settings2, Sparkles, Trash2, UploadCloud,
  WandSparkles, X
} from "lucide-react";

type CaptionStyle = "outline" | "box" | "clean";
type Variation = { id: string; hook: string; style: CaptionStyle; cta: string; title: string };
const defaultHooks = [
  "O café da manhã que eu como pra manter a glicose estável",
  "Pare de começar o dia com ISSO",
  "3 erros no seu café da manhã que ninguém conta",
  "Café da manhã rápido, saboroso e sem picos de glicose",
  "Receitas de 5 minutos para controlar a glicose",
  "5 receitas que eu salvaria agora",
  "Troque o pão branco por ISSO",
  "Seu café da manhã ajuda ou atrapalha sua glicose?"
];
const defaultCtas = [
  "Clique no link e receba as receitas",
  "Toque em Saiba mais e comece hoje",
  "Sabor Sem Culpa — link na descrição"
];
const forbidden = /você\s+tem\s+diabetes|sua\s+diabetes/i;
const styleLabels: Record<CaptionStyle, string> = {
  outline: "Impacto", box: "Tarja", clean: "Palavra-chave"
};
const uid = () => Math.random().toString(36).slice(2, 10);

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [hooks, setHooks] = useState<string[]>(() => {
    try { const v = localStorage.getItem("gv-hooks"); return v ? JSON.parse(v) : defaultHooks; } catch { return defaultHooks; }
  });
  const [hookIndex, setHookIndex] = useState(0);
  const [hookDraft, setHookDraft] = useState("");
  const [style, setStyle] = useState<CaptionStyle>("outline");
  const [cta, setCta] = useState(defaultCtas[0]);
  const [customCta, setCustomCta] = useState("");
  const [productName, setProductName] = useState("Sabor Sem Culpa");
  const [quantity, setQuantity] = useState(5);
  const [includeCta, setIncludeCta] = useState(true);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const chosenHook = hooks[hookIndex] || hooks[0] || "";
  const finalCta = customCta.trim() || cta.replace("Sabor Sem Culpa", productName || "Seu produto");
  const activeHook = chosenHook || "Seu próximo criativo começa aqui";

  useEffect(() => { localStorage.setItem("gv-hooks", JSON.stringify(hooks)); }, [hooks]);
  useEffect(() => {
    if (!file) { setVideoUrl(""); return; }
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const canGenerate = Boolean(file && activeHook.trim() && !forbidden.test(activeHook));
  const captionPreview = useMemo(() => activeHook.split(/\s+/).slice(0, 8).join(" "), [activeHook]);

  function pickFile(next?: File) {
    if (!next) return;
    if (!next.type.startsWith("video/") && !/\.mp4$/i.test(next.name)) { setNotice("Selecione um arquivo de vídeo MP4."); return; }
    if (next.size > 200 * 1024 * 1024) { setNotice("O arquivo ultrapassa o limite de 200 MB."); return; }
    setFile(next); setVariations([]); setNotice("Vídeo carregado localmente. Nenhum arquivo foi enviado para um servidor.");
  }
  function addHook() {
    const value = hookDraft.trim();
    if (!value) return;
    if (forbidden.test(value)) { setNotice('Evite frases que presumem que a pessoa tem uma condição de saúde.'); return; }
    setHooks(old => [...old, value]); setHookIndex(hooks.length); setHookDraft(""); setNotice("Gancho adicionado à sua biblioteca.");
  }
  function generate() {
    if (!file) { setNotice("Envie um vídeo antes de gerar variações."); return; }
    if (forbidden.test(activeHook)) { setNotice("Este gancho presume uma condição de saúde. Escolha ou edite outro."); return; }
    const next = Array.from({ length: quantity }, (_, i) => ({
      id: uid(), hook: hooks[(hookIndex + i) % Math.max(hooks.length, 1)] || activeHook,
      style: (["outline", "box", "clean"] as CaptionStyle[])[i % 3],
      cta: includeCta ? (i === 0 ? finalCta : defaultCtas[(i - 1) % defaultCtas.length].replace("Sabor Sem Culpa", productName || "Seu produto")) : "",
      title: `Variação ${String(i + 1).padStart(2, "0")}`
    }));
    const unsafe = next.find(v => forbidden.test(v.hook));
    if (unsafe) { setNotice("Uma das frases da biblioteca precisa ser revisada antes de gerar."); return; }
    setVariations(next); setNotice(`${next.length} variações preparadas. Revise cada cartão antes de exportar.`);
  }
  function removeVariation(id: string) { setVariations(old => old.filter(v => v.id !== id)); }
  function renderFrame(ctx: CanvasRenderingContext2D, video: HTMLVideoElement, v: Variation, time: number, width: number, height: number) {
    const vw = video.videoWidth || 9, vh = video.videoHeight || 16;
    const zoom = time < 3 ? 1 + 0.1 * (time / 3) : 1.1;
    const scale = Math.max(width / vw, height / vh) * zoom;
    const sw = width / scale, sh = height / scale;
    const sx = (vw - sw) / 2, sy = (vh - sh) / 2;
    ctx.fillStyle = "#080908"; ctx.fillRect(0, 0, width, height);
    try { ctx.drawImage(video, sx, sy, sw, sh, 0, 0, width, height); } catch {}
    const drawText = (text: string, y: number, size: number, isHook: boolean) => {
      const words = text.split(/\s+/).slice(0, isHook ? 8 : 10);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = `900 ${size}px Arial, sans-serif`;
      const maxW = width * 0.84;
      const lines: string[] = []; let line = "";
      for (const word of words) {
        const test = line ? line + " " + word : word;
        if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = word; } else line = test;
      }
      if (line) lines.push(line);
      const lineH = size * 1.12; const startY = y - ((lines.length - 1) * lineH) / 2;
      if (v.style === "box" && isHook) {
        const maxLine = Math.max(...lines.map(l => ctx.measureText(l).width));
        ctx.fillStyle = "rgba(0,0,0,.72)"; ctx.fillRect((width-maxLine)/2-24, startY-lineH/2-12, maxLine+48, lines.length*lineH+24);
      }
      lines.forEach((l, idx) => {
        const yy = startY + idx * lineH;
        if (v.style === "outline" || (v.style === "clean" && !isHook)) {
          ctx.lineJoin = "round"; ctx.lineWidth = Math.max(5, size * .11); ctx.strokeStyle = "rgba(0,0,0,.95)"; ctx.strokeText(l, width/2, yy, maxW);
        }
        ctx.fillStyle = v.style === "clean" && !isHook ? "#b9f27c" : "#ffffff";
        if (isHook && idx === 0 && v.style !== "box") {
          const first = l.split(" "); const word = first.shift() || ""; const rest = first.join(" ");
          const a = word + (rest ? " " : ""); const aw = ctx.measureText(a).width; const rw = ctx.measureText(rest).width;
          ctx.fillStyle = "#FFE600"; ctx.fillText(word, width/2-aw/2, yy);
          if (rest) { ctx.fillStyle = "#fff"; ctx.fillText(rest, width/2-aw/2+ctx.measureText(word+" ").width, yy); }
        } else ctx.fillText(l, width/2, yy, maxW);
      });
    };
    if (time < 3) {
      const alpha = Math.min(1, time / .18); ctx.globalAlpha = alpha;
      const scalePop = time < .24 ? .88 + .12 * (time / .24) : 1;
      ctx.save(); ctx.translate(width/2, height*.25); ctx.scale(scalePop, scalePop); ctx.translate(-width/2, -height*.25);
      drawText(v.hook, height*.25, 84, true); ctx.restore(); ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(255,255,255,.32)"; ctx.fillRect(width*.08, height*.055, width*.84, 5);
      ctx.fillStyle = "#FFE600"; ctx.fillRect(width*.08, height*.055, width*.84*Math.min(time/3,1), 5);
    }
    if (v.cta && time > Math.max(0, (video.duration || 10) - 4)) {
      ctx.fillStyle = "rgba(10,12,10,.82)"; ctx.fillRect(width*.08, height*.79, width*.84, height*.12);
      ctx.fillStyle = "#fff"; ctx.font = "800 40px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(v.cta, width/2, height*.85, width*.78);
    }
  }
  async function exportVideo(v: Variation): Promise<Blob> {
    if (!videoUrl) throw new Error("Carregue um vídeo primeiro.");
    const source = document.createElement("video");
    source.src = videoUrl; source.muted = true; source.playsInline = true; source.preload = "auto";
    await new Promise<void>((resolve, reject) => { source.onloadedmetadata = () => resolve(); source.onerror = () => reject(new Error("Não foi possível ler o vídeo.")); });
    const canvas = document.createElement("canvas"); canvas.width = 1080; canvas.height = 1920;
    const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Canvas não está disponível.");
    const stream = canvas.captureStream(30);
    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 5_000_000 });
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    const done = new Promise<Blob>((resolve, reject) => { recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" })); recorder.onerror = () => reject(new Error("Falha ao gravar a exportação.")); });
    source.currentTime = 0;
    await source.play();
    recorder.start(250);
    const draw = () => { if (!source.paused && !source.ended) renderFrame(ctx, source, v, source.currentTime, canvas.width, canvas.height); };
    const timer = window.setInterval(draw, 1000 / 30);
    await new Promise<void>(resolve => { source.onended = () => resolve(); });
    window.clearInterval(timer); renderFrame(ctx, source, v, source.duration, canvas.width, canvas.height);
    recorder.stop(); stream.getTracks().forEach(t => t.stop()); source.pause();
    return done;
  }
  async function downloadOne(v: Variation) {
    try {
      setBusy(true); setNotice(`Renderizando ${v.title} no seu navegador…`);
      const blob = await exportVideo(v);
      const url = URL.createObjectURL(blob); const a = document.createElement("a");
      a.href = url; a.download = `${v.title.toLowerCase().replace(/\s+/g, "-")}.webm`; a.click();
      URL.revokeObjectURL(url); setNotice("Exportação gerada em WebM. A reprodução e o áudio devem ser conferidos antes de usar o anúncio.");
    } catch (e) { setNotice(e instanceof Error ? e.message : "Não foi possível exportar. Tente outro navegador."); }
    finally { setBusy(false); }
  }
  async function downloadZip() {
    if (!variations.length) return;
    try {
      setBusy(true); const zip = new JSZip();
      for (let i = 0; i < variations.length; i++) {
        setNotice(`Renderizando vídeo ${i+1} de ${variations.length}…`);
        zip.file(`${String(i+1).padStart(2,"0")}-${variations[i].title.toLowerCase().replace(/\s+/g,"-")}.webm`, await exportVideo(variations[i]));
      }
      setNotice("Preparando arquivo ZIP…");
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "variacoes-de-criativo.zip"; a.click(); URL.revokeObjectURL(url);
      setNotice("ZIP baixado. Confira os arquivos antes de publicar.");
    } catch (e) { setNotice(e instanceof Error ? e.message : "Não foi possível criar o ZIP."); }
    finally { setBusy(false); }
  }
  function previewHook(hook: string, chosenStyle: CaptionStyle) {
    return <div className={`video-hook hook-${chosenStyle}`}><span>{hook.split(/\s+/).slice(0, 8).join(" ")}</span></div>;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Clapperboard size={19}/></div><div><b>estúdio<span>criativo</span></b><small>AD VARIATION LAB</small></div></div>
        <div className="workspace-label">WORKSPACE</div>
        <button className="nav-item active"><Layers3 size={17}/> Criativos <span className="nav-count">{variations.length || "—"}</span></button>
        <button className="nav-item" onClick={() => setNotice("A biblioteca de ganchos está no painel de configuração.")}><MessageSquareText size={17}/> Biblioteca de ganchos</button>
        <button className="nav-item" onClick={() => setNotice("As preferências ficam salvas neste navegador.")}><Settings2 size={17}/> Preferências</button>
        <div className="sidebar-bottom"><div className="local-status"><span className="status-dot"/> Processamento local <small>Seus vídeos ficam no dispositivo</small></div><div className="profile"><div className="avatar">W</div><div><b>Meu estúdio</b><small>Plano pessoal</small></div><MoreHorizontal size={18}/></div></div>
      </aside>

      <main className="main-area">
        <header className="topbar"><div className="breadcrumbs">Workspace <span>/</span> <b>Gerador de criativos</b></div><div className="top-actions"><span className="privacy-chip"><span className="status-dot"/> Privado por padrão</span><button className="icon-button" title="Redefinir" onClick={() => {setVariations([]);setNotice("Variações limpas.");}}><RotateCcw size={16}/></button><div className="avatar small">W</div></div></header>
        <section className="page-heading"><div><div className="eyebrow"><Sparkles size={14}/> CRIAÇÃO INTELIGENTE DE ANÚNCIOS</div><h1>Gerador de <span>variações.</span></h1><p>Um vídeo. Novos ângulos. Mais possibilidades para testar.</p></div><div className="heading-badge"><WandSparkles size={16}/> Creative workspace <ChevronDown size={14}/></div></section>

        <div className="content-grid">
          <section className="control-panel">
            <div className="section-title"><div className="step-number">01</div><div><h2>Seu vídeo base</h2><p>Comece com o criativo que já funciona.</p></div></div>
            <div className={`upload-zone ${file ? "has-file" : ""}`} onDragOver={e => e.preventDefault()} onDrop={e => {e.preventDefault();pickFile(e.dataTransfer.files?.[0]);}}>
              <input ref={inputRef} type="file" accept="video/mp4,video/*,.mp4" hidden onChange={e => pickFile(e.target.files?.[0])}/>
              {file ? <><div className="upload-icon success"><Check size={22}/></div><b className="file-name">{file.name}</b><small>{(file.size/1024/1024).toFixed(1)} MB · carregado localmente</small><button className="text-button" onClick={() => {setFile(null);setVariations([]);}}>Trocar vídeo</button></> : <><div className="upload-icon"><UploadCloud size={22}/></div><b>Arraste seu vídeo para cá</b><span>ou <button className="inline-link" onClick={() => inputRef.current?.click()}>escolha um arquivo</button></span><small>MP4 recomendado · até 200 MB</small></>}
            </div>
            <div className="mini-specs"><span><FileVideo2 size={14}/> Vertical 9:16</span><span><Gauge size={14}/> Saída 1080 × 1920</span></div>
            <div className="panel-divider"/>
            <div className="section-title"><div className="step-number">02</div><div><h2>Defina o gancho</h2><p>Capture a atenção nos primeiros 3 segundos.</p></div></div>
            <label className="field-label" htmlFor="hook-select">BIBLIOTECA DE GANCHOS <span>{hooks.length} opções</span></label>
            <div className="select-wrap"><select id="hook-select" value={hookIndex} onChange={e => setHookIndex(Number(e.target.value))}>{hooks.map((h,i)=><option key={i} value={i}>{h}</option>)}</select><ChevronDown size={15}/></div>
            <div className="hook-edit"><input value={hookDraft} onChange={e => setHookDraft(e.target.value)} placeholder="Adicionar novo gancho…"/><button className="square-button" onClick={addHook} title="Adicionar gancho"><Plus size={17}/></button></div>
            {forbidden.test(activeHook) && <div className="warning">Evite frases que presumem uma condição de saúde do público.</div>}
            <div className="panel-divider"/>
            <div className="section-title compact"><div className="step-number">03</div><div><h2>Estilo da legenda</h2><p>Escolha a identidade visual do texto.</p></div></div>
            <div className="style-options">
              <button className={`style-card ${style==="outline"?"selected":""}`} onClick={()=>setStyle("outline")}><div className="style-demo demo-outline">IMPACTO</div><span>Impacto</span>{style==="outline"&&<Check size={14}/>}</button>
              <button className={`style-card ${style==="box"?"selected":""}`} onClick={()=>setStyle("box")}><div className="style-demo demo-box">SEU TEXTO</div><span>Tarja</span>{style==="box"&&<Check size={14}/>}</button>
              <button className={`style-card ${style==="clean"?"selected":""}`} onClick={()=>setStyle("clean")}><div className="style-demo demo-clean">PALAVRA <i>CHAVE</i></div><span>Palavra-chave</span>{style==="clean"&&<Check size={14}/>}</button>
            </div>
            <div className="panel-divider"/>
            <div className="section-title compact"><div className="step-number">04</div><div><h2>Chamada para ação</h2><p>Feche o criativo com o próximo passo.</p></div></div>
            <label className="field-label" htmlFor="cta-select">CTA FINAL</label>
            <div className="select-wrap"><select id="cta-select" value={cta} onChange={e=>setCta(e.target.value)}>{defaultCtas.map(c=><option key={c}>{c}</option>)}</select><ChevronDown size={15}/></div>
            <label className="field-label" htmlFor="product-name">NOME DO PRODUTO</label><input className="text-input" id="product-name" value={productName} onChange={e=>setProductName(e.target.value)} placeholder="Nome do produto"/>
            <label className="field-label" htmlFor="custom-cta">CTA PERSONALIZADO <span>opcional</span></label><input className="text-input" id="custom-cta" value={customCta} onChange={e=>setCustomCta(e.target.value)} placeholder="Escreva uma chamada personalizada"/>
            <label className="toggle-row"><span><b>Incluir CTA no vídeo</b><small>Últimos 4 segundos</small></span><input type="checkbox" checked={includeCta} onChange={e=>setIncludeCta(e.target.checked)}/><span className="toggle-ui"/></label>
            <div className="panel-divider"/>
            <div className="quantity-row"><div><h2>Quantidade de variações</h2><p>Gere diferentes combinações para testar.</p></div><strong>{quantity.toString().padStart(2,"0")}</strong></div>
            <input className="range" type="range" min="1" max="10" value={quantity} onChange={e=>setQuantity(Number(e.target.value))}/>
            <div className="range-labels"><span>1 variação</span><span>10 variações</span></div>
            <button className="primary-button" disabled={!canGenerate || busy} onClick={generate}><WandSparkles size={17}/> Gerar {quantity} variações <ArrowRight size={17}/></button>
            {!file && <p className="button-hint">Envie um vídeo para habilitar a geração.</p>}
          </section>

          <section className="preview-area">
            <div className="preview-header"><div><div className="eyebrow">PRÉ-VISUALIZAÇÃO</div><h2>Seu espaço criativo</h2></div><div className="preview-controls"><span className="aspect-chip">9:16 <span>VERTICAL</span></span><button className="icon-button" onClick={()=>setVariations([])} title="Limpar variações"><Trash2 size={16}/></button></div></div>
            {notice && <div className="notice"><span>{notice}</span><button onClick={()=>setNotice("")} aria-label="Fechar aviso"><X size={14}/></button></div>}
            {!variations.length ? <div className="empty-state">
              <div className="preview-stage">
                {videoUrl ? <div className="phone-preview"><video ref={videoRef} src={videoUrl} controls playsInline/><div className="preview-overlay">{previewHook(activeHook,style)}{includeCta&&<div className="preview-cta">{finalCta}</div>}</div></div> : <div className="empty-phone"><div className="phone-top"/><div className="empty-screen"><div className="screen-glow"/><div className="screen-play"><Play size={21} fill="currentColor"/></div><span>SEU PRÓXIMO CRIATIVO</span><small>9:16 · VÍDEO VERTICAL</small></div></div>}
              </div>
              <div className="empty-copy"><div className="empty-spark"><Sparkles size={16}/></div><h3>Ideias prontas para ganhar vida.</h3><p>Carregue seu vídeo e escolha o gancho. As variações vão aparecer aqui para você revisar.</p></div>
              <div className="feature-strip"><div><Scissors size={16}/><span>Ganchos rápidos</span></div><div><MessageSquareText size={16}/><span>Legendas visuais</span></div><div><Film size={16}/><span>Variações em vídeo</span></div></div>
            </div> : <>
              <div className="results-toolbar"><div><b>{variations.length} variações</b><span> · prontas para revisão</span></div><button className="secondary-button" disabled={busy} onClick={downloadZip}><ArrowDownToLine size={15}/> Exportar ZIP</button></div>
              <div className="variation-grid">{variations.map((v,i)=><article className="variation-card" key={v.id}>
                <div className="variation-preview">
                  {videoUrl ? <video src={videoUrl} muted playsInline controls preload="metadata"/> : <div className="no-video"><Film size={26}/></div>}
                  <div className="variation-overlay">{previewHook(v.hook,v.style)}{v.cta&&<div className="preview-cta">{v.cta}</div>}</div>
                  <span className="variant-index">{String(i+1).padStart(2,"0")}</span>
                </div>
                <div className="variation-info"><div><b>{v.title}</b><span>{styleLabels[v.style]}</span></div><p>{v.hook}</p><div className="variation-actions"><button className="secondary-button small" onClick={()=>downloadOne(v)} disabled={busy}><ArrowDownToLine size={14}/> Exportar .webm</button><button className="icon-button" onClick={()=>removeVariation(v.id)} title="Remover"><Trash2 size={15}/></button></div></div>
              </article>)}</div>
            </>}
            <div className="bottom-note"><div className="note-icon"><FolderOpen size={16}/></div><div><b>Seu conteúdo permanece no seu dispositivo.</b><span>O vídeo não é enviado a um servidor. A exportação depende dos recursos do navegador e gera WebM quando suportado.</span></div></div>
          </section>
        </div>
        <footer className="footer"><span>ESTÚDIO CRIATIVO <i>·</i> BETA</span><span>Feito para testar mais ideias, com mais intenção.</span></footer>
      </main>
    </div>
  );
}