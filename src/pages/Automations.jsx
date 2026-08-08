import { BellRing, Clock3, FileText, Heart, MessageCircle, Save, Sparkles, Trash2 } from "lucide-react";
import { useCallback,useEffect,useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  deleteQuoteTemplate,getAutomationSettings,getAutomationSuggestions,listQuoteTemplates,
  renderAutomationMessage,saveAutomationSettings,saveQuoteTemplate,toggleTemplateFavorite
} from "../services/automationService";

export default function Automations(){
 const {workspace}=useAuth(); const [settings,setSettings]=useState(null); const [suggestions,setSuggestions]=useState(null);
 const [templates,setTemplates]=useState([]); const [name,setName]=useState(""); const [message,setMessage]=useState({type:"",text:""});
 const [loading,setLoading]=useState(true);

 const load=useCallback(async()=>{if(!workspace?.id)return;setLoading(true);
  try{const s=await getAutomationSettings(workspace.id);setSettings(s);
   const [a,t]=await Promise.all([getAutomationSuggestions(workspace.id,s),listQuoteTemplates(workspace.id)]);
   setSuggestions(a);setTemplates(t);
  }catch(e){setMessage({type:"error",text:e instanceof Error?e.message:"Erro ao carregar automações."});}
  finally{setLoading(false)}},[workspace?.id]);
 useEffect(()=>{load()},[load]);

 async function saveSettings(){try{const s=await saveAutomationSettings(workspace.id,settings);setSettings(s);setSuggestions(await getAutomationSuggestions(workspace.id,s));setMessage({type:"success",text:"Automações salvas."})}catch(e){setMessage({type:"error",text:e.message})}}
 async function addTemplate(){if(!name.trim())return;try{await saveQuoteTemplate(workspace.id,{name:name.trim(),description:"Modelo rápido",payload_json:{},is_favorite:false});setName("");setTemplates(await listQuoteTemplates(workspace.id))}catch(e){setMessage({type:"error",text:e.message})}}
 async function favorite(t){await toggleTemplateFavorite(workspace.id,t);setTemplates(await listQuoteTemplates(workspace.id))}
 async function remove(t){if(!confirm(`Excluir o modelo "${t.name}"?`))return;await deleteQuoteTemplate(workspace.id,t.id);setTemplates(await listQuoteTemplates(workspace.id))}
 function wa(item){const raw=item.client_snapshot_json?.whatsapp||item.client_snapshot_json?.phone||"";const phone=String(raw).replace(/\D/g,"");if(!phone)return "#";return `https://wa.me/${phone}?text=${encodeURIComponent(renderAutomationMessage(settings.default_whatsapp_message,item))}`}

 if(loading||!settings)return <section className="automation-loading"><div className="spinner"/><strong>Preparando automações...</strong></section>;
 const cards=[
  ["Retornos sugeridos",suggestions.followups,BellRing,"Orçamentos aguardando resposta há tempo suficiente para um retorno."],
  ["Validade próxima",suggestions.expiring,Clock3,"Orçamentos próximos do vencimento."],
  ["Entregas prioritárias",suggestions.deliveries,Sparkles,"Serviços vencidos ou próximos da entrega."]
 ];
 return <section>
  <div className="page-heading"><div><p className="eyebrow">AUTOMAÇÕES</p><h1>Assistente do dia a dia</h1><p>Reduza tarefas repetitivas sem executar ações importantes sem sua confirmação.</p></div></div>
  {message.text?<div className={`form-alert ${message.type}`}>{message.text}</div>:null}

  <div className="automation-settings">
   <div><strong>Lembretes inteligentes</strong><span>Você decide os prazos usados nas sugestões.</span></div>
   <label>Retorno após<input type="number" min="1" max="30" value={settings.quote_followup_days} onChange={e=>setSettings({...settings,quote_followup_days:Number(e.target.value)})}/><small>dias</small></label>
   <label>Validade<input type="number" min="0" max="15" value={settings.quote_expiry_warning_days} onChange={e=>setSettings({...settings,quote_expiry_warning_days:Number(e.target.value)})}/><small>dias antes</small></label>
   <label>Entrega<input type="number" min="0" max="15" value={settings.delivery_warning_days} onChange={e=>setSettings({...settings,delivery_warning_days:Number(e.target.value)})}/><small>dias antes</small></label>
   <button className="primary-button" type="button" onClick={saveSettings}><Save size={16}/> Salvar</button>
  </div>

  <div className="automation-grid">
   {cards.map(([title,items,Icon,desc])=><section className="automation-card" key={title}>
    <header><span><Icon size={18}/></span><div><strong>{title}</strong><small>{desc}</small></div><b>{items.length}</b></header>
    <div className="automation-list">{items.length?items.slice(0,5).map(item=><div className="automation-row" key={item.id}>
     <div><strong>#{String(item.quote_number||"").padStart(4,"0")} · {item.client_snapshot_json?.name||"Cliente"}</strong>
      <span>{item.due_date?`Entrega ${new Date(`${item.due_date}T12:00:00`).toLocaleDateString("pt-BR")}`:item.valid_until?`Válido até ${new Date(`${item.valid_until}T12:00:00`).toLocaleDateString("pt-BR")}`:"Aguardando retorno"}</span></div>
     <div className="automation-row-actions">
      {(item.client_snapshot_json?.whatsapp||item.client_snapshot_json?.phone)?<a href={wa(item)} target="_blank" rel="noreferrer" title="Mensagem sugerida"><MessageCircle size={15}/></a>:null}
      <Link to={`/orcamentos/${item.quote_id||item.id}`}><FileText size={15}/></Link>
     </div>
    </div>):<div className="automation-empty">Nada para agir agora.</div>}</div>
   </section>)}
  </div>

  <section className="automation-message">
   <div><strong>Mensagem padrão de acompanhamento</strong><span>Use <code>{"{cliente}"}</code> e <code>{"{numero}"}</code>. A mensagem só abre após você clicar.</span></div>
   <textarea rows="3" value={settings.default_whatsapp_message} onChange={e=>setSettings({...settings,default_whatsapp_message:e.target.value})}/>
   <button className="secondary-button" type="button" onClick={saveSettings}><Save size={15}/> Salvar mensagem</button>
  </section>

  <div className="automation-bottom-grid">
   <section className="automation-section">
    <header><div><strong>Recentes</strong><span>Continue de onde parou.</span></div></header>
    <div className="automation-list">{suggestions.recent.map(q=><Link className="automation-recent" to={`/orcamentos/${q.id}`} key={q.id}>
     <FileText size={15}/><span><strong>#{String(q.quote_number).padStart(4,"0")} · {q.client_snapshot_json?.name||"Cliente"}</strong><small>{q.status}</small></span>
    </Link>)}</div>
   </section>
   <section className="automation-section">
    <header><div><strong>Favoritos e modelos</strong><span>Atalhos para trabalhos recorrentes.</span></div></header>
    <div className="template-create"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Nome do novo modelo"/><button type="button" onClick={addTemplate}>Adicionar</button></div>
    <div className="automation-list">{templates.length?templates.map(t=><div className="template-row" key={t.id}><span><strong>{t.name}</strong><small>{t.description||"Modelo rápido"}</small></span>
     <button type="button" className={t.is_favorite?"favorite":""} onClick={()=>favorite(t)} title="Favorito"><Heart size={15}/></button>
     <button type="button" onClick={()=>remove(t)} title="Excluir"><Trash2 size={15}/></button>
    </div>):<div className="automation-empty">Nenhum modelo salvo ainda.</div>}</div>
   </section>
  </div>
 </section>
}
