import { useState, useMemo, useEffect } from "react";

const BRAND="#56857A", BRAND_D="#3d6b61", BRAND_L="#e8f2f0";
const TEXT="#1C1C1C", MUTED="#6b7280", BORDER="#e5e7eb", BG="#fff", BG2="#f9fafb";
const SIDEBAR_BG="#1C1C1C";

const fmt = v => new Intl.NumberFormat("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2}).format(v);
const fmtPct = v => (v==null||!isFinite(v)) ? "—" : (v>0?"+":"")+v.toFixed(1)+"%";
const sumObj = o => Object.values(o).reduce((a,v)=>a+v,0);

const GLOBAL_CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body,#root{height:100%;width:100%;overflow:hidden}
  .app-shell{display:flex;height:100dvh;width:100%;overflow:hidden;background:${BG2};font-family:system-ui,sans-serif;position:relative}
  .sidebar{width:210px;min-width:210px;background:${SIDEBAR_BG};display:flex;flex-direction:column;overflow:hidden;transition:width .2s ease,min-width .2s ease,transform .2s ease;flex-shrink:0;z-index:20}
  .sidebar.collapsed{width:48px;min-width:48px}
  @media(max-width:639px){
    .sidebar{position:fixed;top:0;left:0;height:100%;width:220px!important;min-width:220px!important;transform:translateX(-100%)}
    .sidebar.mobile-open{transform:translateX(0)}
    .main-content{margin-left:0!important}
    .hamburger{display:flex!important}
    .topbar-label-full{display:none}
    .topbar-label-short{display:block!important}
    .period-badge{display:none}
  }
  @media(min-width:640px){
    .hamburger{display:none!important}
    .topbar-label-short{display:none}
    .overlay{display:none!important}
    .topbar-label-full{display:block}
  }
  .main-content{flex:1;min-width:0;display:flex;flex-direction:column;overflow:hidden}
  .table-scroll{flex:1;overflow:auto;border:1px solid ${BORDER};border-radius:10px;-webkit-overflow-scrolling:touch}
  .dre-table{border-collapse:collapse;width:100%;min-width:680px;table-layout:auto}
  .col-label{min-width:180px;width:22%}
  .col-val{min-width:100px}
  .col-ah{min-width:50px;width:5%}
  .col-total{min-width:110px}
  .cmb-table{border-collapse:collapse;width:100%;min-width:820px;table-layout:auto}
  .cmb-col-label{min-width:180px;width:20%}
  .cmb-col-val{min-width:90px}
  .cmb-col-total{min-width:100px}
  .sticky-header{position:sticky;top:0;z-index:3}
  .sticky-col{position:sticky;left:0;z-index:2}
  .sticky-header.sticky-col{z-index:5}
  button{min-height:36px}
`;

function GlobalStyle() {
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);
  return null;
}

// ╔══════════════════════════════════════════════════════════════════╗
// ║          GUIA DE IMPORTAÇÃO MENSAL — TROPICAL BUS               ║
// ╠══════════════════════════════════════════════════════════════════╣
// ║  Como adicionar uma nova competência:                           ║
// ║                                                                  ║
// ║  1. Exporte a DRE Fiscal do Nasajon em formato TXT              ║
// ║  2. Copie o bloco TEMPLATE abaixo                               ║
// ║  3. Cole AO FINAL do array RAW (antes do ];  )                  ║
// ║  4. Preencha os valores conforme o TXT exportado                ║
// ║  5. Informe a receita extra do mês ao contador                  ║
// ║  6. Salve — o dashboard atualiza automaticamente                ║
// ║                                                                  ║
// ║  AJUSTES GERENCIAIS APLICADOS AUTOMATICAMENTE:                  ║
// ║  ✓ Pró-labore excluído (não informar no campo pes)              ║
// ║  ✓ Depreciação excluída (não informar)                          ║
// ║  ✓ IRPJ/CSLL não apresentados                                   ║
// ║  ✓ Recuperação de Encargos: linha isolada                       ║
// ║  ✓ Contas ausentes = zero                                       ║
// ╚══════════════════════════════════════════════════════════════════╝

// ── TEMPLATE — copie, cole ao final do array RAW e preencha ────────
// {
//   label: "Mmm/AAAA",   // Ex: "Mai/2026"
//   key:   "AAAA-MM",    // Ex: "2026-05"
//   ano:    AAAA,        // Ex: 2026
//   extra:  0,           // Receita Extra informada pelo contador
//   rec:  { mun: 0, int: 0 },
//   ded:  { iss: 0, pis: 0, cof: 0, icms: 0 },
//   cus:  { man: 0, com: 0, ped: 0 },
//   tri:  { ipva: 0, alv: 0, difal: 0, ipi: 0, autos: 0, pisT: 0, cofT: 0 },
//   ger:  { alug: 0, tel: 0, pj: 0, soft: 0, matE: 0, brin: 0, fret: 0,
//           lanch: 0, segV: 0, div: 0, cont: 0, adm: 0, adv: 0,
//           rast: 0, pred: 0, mult: 0 },
//   pes:  { sal: 0, hext: 0, ins: 0, not: 0, grat: 0, vt: 0, va: 0,
//           med: 0, fer: 0, dec: 0, inss: 0, fgts: 0, dsr: 0, sst: 0,
//           adF: 0, outP: 0, grF: 0 },
//   enc:  { av: 0, falt: 0, out: 0 },
//   dfin: { tar: 0, jmul: 0, enc: 0, desc: 0 },
//   rfin: { desc: 0, jap: 0, jObt: 0, rest: 0, varM: 0 },
// },
// ── FIM DO TEMPLATE ────────────────────────────────────────────────

// ── HISTÓRICO DE COMPETÊNCIAS ─────────────────────────────────────
const RAW = [
  { label:"Jan/2026", key:"2026-01", ano:2026, extra:102000,
    rec:{mun:93822.20,int:361889.29}, ded:{iss:4691.11,pis:2868.13,cof:13237.48,icms:14462.62},
    cus:{man:64406.88,com:99225.00,ped:14637.02},
    tri:{ipva:17424.30,alv:4839.02,difal:2310.13,ipi:0,autos:0,pisT:0,cofT:0},
    ger:{alug:1100,tel:521.86,pj:2450,soft:560.01,matE:389.39,brin:1560,fret:78.98,lanch:0,segV:8221.34,div:659.49,cont:13860.04,adm:7848.33,adv:506,rast:2019,pred:756,mult:0},
    pes:{sal:63615.98,hext:813.72,ins:972.60,not:68.64,grat:700,vt:1983.10,va:8406.97,med:11918.96,fer:9152.44,dec:6164.75,inss:18942.14,fgts:5453.34,dsr:538.11,sst:45,adF:1622.40,outP:2278.53,grF:500},
    enc:{av:10784.22,falt:2755.97,out:3867.52}, dfin:{tar:169.10,jmul:7912.03,enc:40837.21,desc:0},
    rfin:{desc:183.91,jap:74.87,jObt:0,rest:308.50,varM:4688.26} },
  { label:"Fev/2026", key:"2026-02", ano:2026, extra:147725.01,
    rec:{mun:59727.00,int:353490.00}, ded:{iss:2986.35,pis:2589.48,cof:11951.40,icms:14836.70},
    cus:{man:50817.48,com:100765.00,ped:16595.72},
    tri:{ipva:17424.30,alv:12597.17,difal:1584.99,ipi:41.83,autos:0,pisT:0,cofT:0},
    ger:{alug:1100,tel:630.96,pj:4580,soft:172.61,matE:0,brin:1560,fret:39.49,lanch:1017.97,segV:8265.88,div:172.65,cont:13860.04,adm:7848.33,adv:506,rast:2019,pred:756,mult:0},
    pes:{sal:57112.32,hext:421.56,ins:972.60,not:32.15,grat:700,vt:1910.80,va:7639.80,med:0,fer:6787.03,dec:5313.65,inss:19037.85,fgts:5285.74,dsr:75.62,sst:225,adF:1622.40,outP:62.25,grF:500},
    enc:{av:7189.48,falt:0,out:2478.27}, dfin:{tar:159.00,jmul:3723.23,enc:40837.21,desc:0.01},
    rfin:{desc:3524.24,jap:54.21,jObt:17.01,rest:0,varM:3702.22} },
  { label:"Mar/2026", key:"2026-03", ano:2026, extra:292955.60,
    rec:{mun:186242.03,int:304759.17}, ded:{iss:9312.10,pis:3127.61,cof:14435.19,icms:9827.74},
    cus:{man:50477.06,com:262457.05,ped:14475.11},
    tri:{ipva:17242.30,alv:7196.03,difal:1016.13,ipi:49.61,autos:3543.17,pisT:27.25,cofT:167.70},
    ger:{alug:1100,tel:641.96,pj:0,soft:1231.10,matE:0,brin:0,fret:44.82,lanch:0,segV:7755.10,div:885,cont:13860.04,adm:7848.33,adv:694.40,rast:2019,pred:3841.90,mult:0},
    pes:{sal:56338.61,hext:1549.02,ins:972.60,not:504.98,grat:700,vt:3126.40,va:10992.46,med:11918.96,fer:9953.26,dec:6324.95,inss:23068.01,fgts:6358.80,dsr:525.10,sst:733,adF:1622.40,outP:862.13,grF:500},
    enc:{av:0,falt:54.47,out:383.86}, dfin:{tar:194.43,jmul:4818.65,enc:40837.21,desc:0.50},
    rfin:{desc:3129.29,jap:24.73,jObt:0,rest:0,varM:4192.64} },
  { label:"Abr/2026", key:"2026-04", ano:2026, extra:178709.16,
    rec:{mun:258650.27,int:406593.59}, ded:{iss:15168.91,pis:4230.93,cof:19527.37,icms:14331.65},
    cus:{man:197004.80,com:66574.98,ped:16243.00},
    tri:{ipva:25067.20,alv:15013.64,difal:1551.20,ipi:101.61,autos:1093.68,pisT:23.73,cofT:146.04},
    ger:{alug:1100,tel:694.64,pj:1130.80,soft:489.10,matE:479.85,brin:1560,fret:401.08,lanch:1560,segV:6951.66,div:2.50,cont:13860.04,adm:7848.33,adv:479.70,rast:2019,pred:4865.13,mult:1042.29},
    pes:{sal:72113.05,hext:4147.77,ins:972.60,not:844.02,grat:700,vt:2946.40,va:9523.00,med:11918.96,fer:9200.68,dec:7202.47,inss:28519.88,fgts:8033.04,dsr:1956.79,sst:1763,adF:1622.40,outP:1197.40,grF:500},
    enc:{av:0,falt:0,out:2289.09}, dfin:{tar:176.00,jmul:6926.16,enc:40837.21,desc:0},
    rfin:{desc:3728.35,jap:9.37,jObt:0,rest:0,varM:2235.83} },
  // ← PRÓXIMA COMPETÊNCIA: cole o bloco do template aqui
];

function calcP(p) {
  const recBruta=p.rec.mun+p.rec.int+p.extra, deducoes=-(p.ded.iss+p.ded.pis+p.ded.cof+p.ded.icms), recLiq=recBruta+deducoes;
  const custos=-(p.cus.man+p.cus.com+p.cus.ped), resBruto=recLiq+custos;
  const dTrib=-(p.tri.ipva+p.tri.alv+p.tri.difal+p.tri.ipi+p.tri.autos+p.tri.pisT+p.tri.cofT);
  const dGer=-sumObj(p.ger), dPes=-sumObj(p.pes), recEnc=p.enc.av+p.enc.falt+p.enc.out;
  const ebitda=resBruto+dTrib+dGer+dPes+recEnc;
  const dFin=-(p.dfin.tar+p.dfin.jmul+p.dfin.enc+p.dfin.desc);
  const rFin=p.rfin.desc+p.rfin.jap+p.rfin.jObt+p.rfin.rest+p.rfin.varM;
  const resLiq=ebitda+dFin+rFin;
  return {recBruta,deducoes,recLiq,custos,resBruto,dTrib,dGer,dPes,recEnc,ebitda,dFin,rFin,resLiq};
}
const CALCS=RAW.map(p=>({...p,c:calcP(p)}));

const CANONICAL_ORDER=["g_rec","mun","int","extra","recBruta","g_ded","iss","pis","cof","icms","recLiq","g_cus","man","com","ped","resBruto","g_tri","ipva","alv","difal","ipi","autos","pisT","cofT","g_ger","alug","tel","pj","soft","matE","brin","fret","lanch","segV","div","cont","admG","adv","rast","pred","mult","g_pes","sal","hext","ins","not","grat","vt","va","med","fer","dec","inss","fgts","dsr","sst","adF","outP","grF","g_enc","av","falt","out","ebitda","g_dfin","tar","jmul","encF","descC","g_rfin","descO","jap","jObt","rest","varM","lucLiq"];

function getDRERows(p) {
  const c=p.c; const rows=[]; const add=(t,id,l,v,o={})=>rows.push({tipo:t,id,label:l,valor:v,...o});
  add("grupo","g_rec","Receita Bruta de Serviços");
  add("linha","mun","  Transp. Municipal",p.rec.mun,{isFav:true});
  add("linha","int","  Transp. Intermunicipal/Interestadual",p.rec.int,{isFav:true});
  add("linha","extra","  Outras Receitas (Extra)",p.extra,{isFav:true,extra:true});
  add("marco","recBruta","RECEITA BRUTA",c.recBruta);
  add("grupo","g_ded","Deduções da Receita");
  add("linha","iss","  ISS Retido",-p.ded.iss,{isFav:false});
  add("linha","pis","  PIS",-p.ded.pis,{isFav:false});
  add("linha","cof","  COFINS",-p.ded.cof,{isFav:false});
  add("linha","icms","  ICMS",-p.ded.icms,{isFav:false});
  add("marco","recLiq","RECEITA LÍQUIDA",c.recLiq);
  add("grupo","g_cus","Custos na Prestação de Serviços");
  add("linha","man","  Manutenção da Frota",-p.cus.man,{isFav:false});
  add("linha","com","  Combustíveis e Lubrificantes",-p.cus.com,{isFav:false});
  add("linha","ped","  Pedágio",-p.cus.ped,{isFav:false});
  add("marco","resBruto","RESULTADO BRUTO",c.resBruto);
  add("grupo","g_tri","Despesas Tributárias");
  add("linha","ipva","  IPVA",-p.tri.ipva,{isFav:false});
  add("linha","alv","  Taxas de Alvará/Licenças",-p.tri.alv,{isFav:false});
  add("linha","difal","  ICMS Diferencial de Alíquotas",-p.tri.difal,{isFav:false});
  if(p.tri.ipi>0)   add("linha","ipi","  IPI",-p.tri.ipi,{isFav:false});
  if(p.tri.autos>0) add("linha","autos","  Autos e Infrações",-p.tri.autos,{isFav:false});
  if(p.tri.pisT>0)  add("linha","pisT","  PIS (tributário)",-p.tri.pisT,{isFav:false});
  if(p.tri.cofT>0)  add("linha","cofT","  COFINS (tributário)",-p.tri.cofT,{isFav:false});
  add("grupo","g_ger","Despesas Gerais");
  add("linha","alug","  Aluguéis",-p.ger.alug,{isFav:false});
  add("linha","tel","  Telecomunicações",-p.ger.tel,{isFav:false});
  if(p.ger.pj>0)   add("linha","pj","  Serviços PJ",-p.ger.pj,{isFav:false});
  add("linha","soft","  Licenças de Software",-p.ger.soft,{isFav:false});
  if(p.ger.matE>0) add("linha","matE","  Material de Escritório",-p.ger.matE,{isFav:false});
  if(p.ger.brin>0) add("linha","brin","  Despesas com Brinde",-p.ger.brin,{isFav:false});
  add("linha","fret","  Fretes e Transportes",-p.ger.fret,{isFav:false});
  if(p.ger.lanch>0) add("linha","lanch","  Lanches e Refeições",-p.ger.lanch,{isFav:false});
  add("linha","segV","  Seguros de Veículos",-p.ger.segV,{isFav:false});
  if(p.ger.div>0)  add("linha","div","  Despesas Diversas",-p.ger.div,{isFav:false});
  add("linha","cont","  Assessoria Contábil",-p.ger.cont,{isFav:false});
  add("linha","admG","  Assessoria Administrativa",-p.ger.adm,{isFav:false});
  add("linha","adv","  Honorários Advocatícios",-p.ger.adv,{isFav:false});
  add("linha","rast","  Serviços de Rastreamento",-p.ger.rast,{isFav:false});
  add("linha","pred","  Manutenção Predial",-p.ger.pred,{isFav:false});
  if(p.ger.mult>0) add("linha","mult","  Multas Indedutiveis",-p.ger.mult,{isFav:false});
  add("grupo","g_pes","Despesas com Pessoal");
  add("linha","sal","  Salários e Ordenados",-p.pes.sal,{isFav:false});
  add("linha","hext","  Horas Extras",-p.pes.hext,{isFav:false});
  add("linha","ins","  Adic. Insalubridade",-p.pes.ins,{isFav:false});
  add("linha","not","  Adicional Noturno",-p.pes.not,{isFav:false});
  add("linha","grat","  Gratificações",-p.pes.grat,{isFav:false});
  add("linha","vt","  Vale Transporte",-p.pes.vt,{isFav:false});
  add("linha","va","  Vale Alimentação",-p.pes.va,{isFav:false});
  add("linha","med","  Assistência Médica",-p.pes.med,{isFav:false});
  add("linha","fer","  Férias",-p.pes.fer,{isFav:false});
  add("linha","dec","  13º Salário",-p.pes.dec,{isFav:false});
  add("linha","inss","  INSS",-p.pes.inss,{isFav:false});
  add("linha","fgts","  FGTS",-p.pes.fgts,{isFav:false});
  add("linha","dsr","  DSR",-p.pes.dsr,{isFav:false});
  add("linha","sst","  Saúde e Segurança",-p.pes.sst,{isFav:false});
  add("linha","adF","  Adicional de Função",-p.pes.adF,{isFav:false});
  add("linha","outP","  Outras Desp. com Pessoal",-p.pes.outP,{isFav:false});
  add("linha","grF","  Gratificação de Função",-p.pes.grF,{isFav:false});
  add("grupo","g_enc","Recuperação de Encargos e Despesas");
  if(p.enc.av>0)   add("linha","av","  Aviso Prévio Indenizado",p.enc.av,{isFav:true});
  if(p.enc.falt>0) add("linha","falt","  Recup. Despesa – Faltas",p.enc.falt,{isFav:true});
  if(p.enc.out>0)  add("linha","out","  Recup. Despesa – Outras",p.enc.out,{isFav:true});
  add("marco","ebitda","EBITDA",c.ebitda);
  add("grupo","g_dfin","Despesas Financeiras");
  add("linha","tar","  Tarifas Bancárias",-p.dfin.tar,{isFav:false});
  add("linha","jmul","  Juros e Multas",-p.dfin.jmul,{isFav:false});
  add("linha","encF","  Encargos Financiamentos",-p.dfin.enc,{isFav:false});
  if(p.dfin.desc>0) add("linha","descC","  Descontos Concedidos",-p.dfin.desc,{isFav:false});
  add("grupo","g_rfin","Receitas Financeiras");
  add("linha","descO","  Descontos Obtidos",p.rfin.desc,{isFav:true});
  add("linha","jap","  Juros de Aplicações",p.rfin.jap,{isFav:true});
  if(p.rfin.jObt>0) add("linha","jObt","  Juros Obtidos",p.rfin.jObt,{isFav:true});
  if(p.rfin.rest>0) add("linha","rest","  Restituição de Tributos",p.rfin.rest,{isFav:true});
  add("linha","varM","  Variação Monetária Ativa",p.rfin.varM,{isFav:true});
  add("final","lucLiq","LUCRO LÍQUIDO",c.resLiq,{isFav:true});
  return rows;
}

function mergeRows(periodos) {
  const meta={};
  periodos.forEach(p=>getDRERows(p).forEach(r=>{if(!meta[r.id])meta[r.id]={id:r.id,tipo:r.tipo,label:r.label,isFav:r.isFav,extra:r.extra};}));
  const canonical=CANONICAL_ORDER.filter(id=>meta[id]).map(id=>meta[id]);
  const maps=periodos.map(p=>{const m={};getDRERows(p).forEach(r=>{m[r.id]=r.valor;});return m;});
  return {canonical,maps};
}

function buildConsolidado(periodos) {
  const allMaps=periodos.map(p=>{const m={};getDRERows(p).forEach(r=>{m[r.id]=r.valor;});return m;});
  const merged={};
  CANONICAL_ORDER.forEach(id=>{merged[id]=allMaps.reduce((s,m)=>s+(m[id]??0),0);});
  return merged;
}

function ValCell({v,isFinal,isMarco,isGrupo,style={}}) {
  const pos=v==null||v>=0;
  const color=(isFinal||isMarco)?(pos?BRAND_D:"#b91c1c"):v<0?"#b91c1c":"#374151";
  return (
    <td style={{textAlign:"right",fontSize:isFinal?14:11.5,color,fontWeight:(isFinal||isMarco||isGrupo)?700:400,
      whiteSpace:"nowrap",padding:isFinal?"12px 12px 12px 4px":"7px 8px 7px 4px",
      borderTop:isFinal?`2px solid ${BORDER}`:"none",...style}}>
      {v!=null&&v!==0?(v>=0?"":"-")+"R$ "+fmt(Math.abs(v)):"—"}
    </td>
  );
}

function DREMensal({periodos,canonical,maps,consolidado,ano,collapsed,toggleGrupo}) {
  let curGrupo=null; const visRows=[];
  canonical.forEach(r=>{
    if(r.tipo==="grupo"){curGrupo=r.id;visRows.push({...r});}
    else if(r.tipo==="marco"||r.tipo==="final"){visRows.push({...r});}
    else{if(!collapsed.has(curGrupo))visRows.push({...r});}
  });
  return (
    <div className="table-scroll">
      <table className="dre-table">
        <thead>
          <tr style={{background:SIDEBAR_BG}} className="sticky-header">
            <th className="sticky-col sticky-header col-label" style={{padding:"10px 14px",textAlign:"left",fontSize:13,color:"#fff",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.5px",background:SIDEBAR_BG,borderRight:"1px solid #2a2a2a"}}>Conta</th>
            {periodos.map((p,i)=>[
              <th key={"hv"+i} className="col-val" style={{padding:"10px 8px",textAlign:"right",fontSize:13,color:"#fff",fontWeight:500,whiteSpace:"nowrap"}}>{p.label}</th>,
              <th key={"ha"+i} className="col-ah" style={{padding:"10px 5px",textAlign:"center",fontSize:11,color:"#888",fontWeight:400,borderRight:i<periodos.length-1?"1px solid #2a2a2a":"none"}}>AH%</th>,
            ])}
            <th className="col-total" style={{padding:"10px 12px",textAlign:"right",fontSize:13,color:"#fff",fontWeight:700,whiteSpace:"nowrap",borderLeft:"2px solid #2a2a2a",background:"#2a2a2a"}}>Total {ano}</th>
          </tr>
        </thead>
        <tbody>
          {visRows.map((row,ri)=>{
            const isFinal=row.tipo==="final",isMarco=row.tipo==="marco",isGrupo=row.tipo==="grupo";
            const bg=isFinal?BRAND_L:isMarco?BRAND_L:isGrupo?"#f0f4f3":row.extra?"#f0faf6":ri%2===0?BG:"#F5F5F5";
            const co=isFinal?BRAND_D:isMarco?BRAND_D:TEXT;
            const fw=(isFinal||isMarco||isGrupo)?700:400;
            const fs=isFinal?14:isMarco?12.5:12;
            return (
              <tr key={row.id+ri} style={{background:bg,borderBottom:`1px solid ${BORDER}`}}>
                <td onClick={isGrupo?()=>toggleGrupo(row.id):undefined} className="sticky-col col-label"
                  style={{padding:isFinal?"12px 14px":isMarco?"10px 14px":"7px 14px",fontSize:fs,color:co,fontWeight:fw,background:bg,
                    borderRight:`1px solid ${BORDER}`,borderLeft:(isFinal||isMarco)?`3px solid ${BRAND}`:"3px solid transparent",
                    borderTop:isFinal?`2px solid ${BORDER}`:"none",cursor:isGrupo?"pointer":"default",
                    whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                  {isGrupo&&<i className={`ti ${collapsed.has(row.id)?"ti-chevron-right":"ti-chevron-down"}`} style={{marginRight:6,fontSize:10,color:BRAND}}/>}
                  {row.extra&&<i className="ti ti-plus-circle" style={{fontSize:10,marginRight:5,color:BRAND}}/>}
                  {row.label}
                </td>
                {periodos.map((_,pi)=>{
                  const v=maps[pi][row.id]??null, vP=pi>0?(maps[pi-1][row.id]??null):null;
                  const diff=(v!=null&&vP!=null)?v-vP:null, ahPct=(diff!=null&&vP!==0)?(diff/Math.abs(vP))*100:null;
                  const fav=diff!=null?(row.isFav?diff>=0:diff<=0):null;
                  const ahC=(pi===0||isGrupo||fav===null)?"#9ca3af":fav?"#15803d":"#b91c1c";
                  const ahBg=(!isGrupo&&ahPct!=null&&Math.abs(ahPct)>20)?(fav?"#f0faf6":"#fff5f5"):"transparent";
                  const bT=isFinal?`2px solid ${BORDER}`:"none";
                  return [
                    <ValCell key={"v"+pi} v={v} isFinal={isFinal} isMarco={isMarco} style={{borderTop:bT}}/>,
                    <td key={"a"+pi} style={{padding:isFinal?"12px 5px":"7px 5px",textAlign:"center",fontSize:10,fontWeight:500,color:ahC,background:ahBg,whiteSpace:"nowrap",borderTop:bT,borderRight:pi<periodos.length-1?`1px solid ${BORDER}`:"none"}}>
                      {(pi===0||isGrupo)?"—":fmtPct(ahPct)}
                    </td>,
                  ];
                })}
                {(()=>{
                  const tot=consolidado[row.id]??null;
                  const tBg=isFinal?BRAND_L:isMarco?BRAND_L:isGrupo?"#e8eded":"#f4f7f6";
                  return <ValCell v={tot} isFinal={isFinal} isMarco={isMarco} isGrupo={isGrupo}
                    style={{borderLeft:"2px solid #d1dbd8",background:tBg,borderTop:isFinal?`2px solid ${BORDER}`:"none",padding:isFinal?"12px 12px":"7px 12px"}}/>;
                })()}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DREPage() {
  const anos=[...new Set(CALCS.map(p=>p.ano))].sort();
  const [ano,setAno]=useState(anos[anos.length-1]);
  const periodos=useMemo(()=>CALCS.filter(p=>p.ano===ano),[ano]);
  const {canonical,maps}=useMemo(()=>mergeRows(periodos),[periodos]);
  const consolidado=useMemo(()=>buildConsolidado(periodos),[periodos]);
  const [collapsed,setCollapsed]=useState(new Set());
  const toggleGrupo=id=>setCollapsed(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n;});
  return (
    <div style={{padding:"18px 20px",display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8,flexShrink:0}}>
        <div>
          <p style={{fontSize:12,color:MUTED,margin:0,textTransform:"uppercase",letterSpacing:"0.6px"}}>Demonstração do Resultado · Série Histórica</p>
          <h2 style={{fontSize:22,fontWeight:500,color:TEXT,margin:"2px 0 0"}}>DRE Gerencial</h2>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{fontSize:12,color:MUTED}}>Exercício:</span>
          {anos.map(a=>(
            <button key={a} onClick={()=>setAno(a)} style={{padding:"5px 16px",borderRadius:20,border:`1px solid ${a===ano?BRAND:BORDER}`,background:a===ano?BRAND:BG,color:a===ano?"#fff":MUTED,fontSize:13,cursor:"pointer"}}>{a}</button>
          ))}
        </div>
      </div>
      <DREMensal periodos={periodos} canonical={canonical} maps={maps} consolidado={consolidado} ano={ano} collapsed={collapsed} toggleGrupo={toggleGrupo}/>
      <p style={{fontSize:11,color:"#9ca3af",marginTop:6,textAlign:"right",flexShrink:0}}>Elim Consultoria Tributária &amp; Empresarial · DRE Gerencial · Exercício {ano}</p>
    </div>
  );
}

// ── CMB ──────────────────────────────────────────────────────────
const CMB_ESCALAS=[{id:"e1",label:"Escala 1",sub:"Barra da Tijuca"},{id:"e2",label:"Escala 2",sub:"São Conrado"},{id:"e3",label:"Escala 3",sub:"Recreio"},{id:"e4",label:"Escala 4",sub:"Copacabana"},{id:"e5",label:"Escala 5",sub:"Botafogo"},{id:"e6",label:"Escala 6",sub:"Tijuca"}];
const CMB_EST=[
  {tipo:"grupo",id:"g_rec",label:"Receitas Operacionais"},
  {tipo:"linha",id:"rec_fret",label:"  Receita Bruta – Fretamento CMB",isFav:true},
  {tipo:"linha",id:"rec_inc",label:"  Serviços Contratuais Incobráveis CMB",isFav:false},
  {tipo:"marco",id:"rec_bruta",label:"RECEITA BRUTA"},
  {tipo:"grupo",id:"g_ded",label:"(-) Deduções da Receita"},
  {tipo:"linha",id:"simples",label:"  Simples Nacional",isFav:false},{tipo:"linha",id:"irpj",label:"  IRPJ",isFav:false},
  {tipo:"linha",id:"csll",label:"  CSLL",isFav:false},{tipo:"linha",id:"pis",label:"  PIS",isFav:false},
  {tipo:"linha",id:"cofins",label:"  COFINS",isFav:false},{tipo:"linha",id:"iss",label:"  ISS",isFav:false},
  {tipo:"linha",id:"aj_rec",label:"  Ajuste da Receita Bruta",isFav:false},
  {tipo:"marco",id:"rec_liq",label:"RECEITA OPERACIONAL LÍQUIDA"},
  {tipo:"grupo",id:"g_cus",label:"(-) Custos na Prestação de Serviços"},
  {tipo:"linha",id:"diesel",label:"  Combustíveis e Lubrificantes – Diesel",isFav:false},
  {tipo:"linha",id:"arla",label:"  Combustíveis e Lubrificantes – Arla",isFav:false},
  {tipo:"linha",id:"pedagio",label:"  Pedágio",isFav:false},
  {tipo:"grupo",id:"g_desp",label:"(-) Despesas Operacionais"},
  {tipo:"linha",id:"sal",label:"  Salários e Ordenados",isFav:false},{tipo:"linha",id:"sal_rat",label:"  Salários e Ordenados – Rateio",isFav:false},
  {tipo:"linha",id:"pf_sal",label:"  Serviços Prestados PF (Salários)",isFav:false},{tipo:"linha",id:"pf_folg",label:"  Serviços Prestados PF (Folgas)",isFav:false},
  {tipo:"linha",id:"inss",label:"  INSS Cota Patronal / RAT / Terceiros",isFav:false},{tipo:"linha",id:"fgts",label:"  FGTS",isFav:false},
  {tipo:"linha",id:"irrf",label:"  IRRF",isFav:false},{tipo:"linha",id:"va",label:"  Vale Alimentação",isFav:false},
  {tipo:"linha",id:"vt",label:"  Vale Transporte",isFav:false},{tipo:"linha",id:"vcomb",label:"  Vale Combustível",isFav:false},
  {tipo:"linha",id:"comb_rat",label:"  Combustível Rateio (Fábio)",isFav:false},
  {tipo:"linha",id:"prov_fer",label:"  Provisão de 1/3 de Férias",isFav:false},{tipo:"linha",id:"prov_13",label:"  Provisão de 13º",isFav:false},
  {tipo:"linha",id:"prov_fgt",label:"  Provisão do FGTS s/ 13º e Férias",isFav:false},{tipo:"linha",id:"prov_mul",label:"  Provisão do FGTS Multa",isFav:false},
  {tipo:"linha",id:"prov_av",label:"  Provisão de Aviso Prévio",isFav:false},{tipo:"linha",id:"prov_aav",label:"  Provisão do Adicional do Aviso Prévio",isFav:false},
  {tipo:"linha",id:"prov_var",label:"  Provisão p/ Outros Enc. Trab. Variáveis",isFav:false},{tipo:"linha",id:"comis",label:"  Comissões (Alessandro)",isFav:false},
  {tipo:"linha",id:"alug",label:"  Aluguel",isFav:false},{tipo:"linha",id:"energia",label:"  Energia",isFav:false},
  {tipo:"linha",id:"tel",label:"  Telefone",isFav:false},{tipo:"linha",id:"fianca",label:"  Fiança Contratual",isFav:false},
  {tipo:"linha",id:"rast",label:"  Rastreamento",isFav:false},{tipo:"linha",id:"detro_t",label:"  DETRO – Taxa",isFav:false},
  {tipo:"linha",id:"detro_i",label:"  DETRO – Incorporação",isFav:false},{tipo:"linha",id:"seguro",label:"  Seguro",isFav:false},
  {tipo:"linha",id:"depre",label:"  Depreciação",isFav:false},{tipo:"linha",id:"depre_ac",label:"  Depreciação Acelerada",isFav:false},
  {tipo:"final",id:"res_econ",label:"RESULTADO OPERACIONAL LÍQUIDO"},
];
const DESP_IDS=["diesel","arla","pedagio","sal","sal_rat","pf_sal","pf_folg","inss","fgts","irrf","va","vt","vcomb","comb_rat","prov_fer","prov_13","prov_fgt","prov_mul","prov_av","prov_aav","prov_var","comis","alug","energia","tel","fianca","rast","detro_t","detro_i","seguro","depre","depre_ac"];
const DED_IDS=["simples","irpj","csll","pis","cofins","iss","aj_rec"];
const CMB_RAW=[{label:"Abr/2026",key:"cmb-2026-04",escalas:{
  e1:{rec_fret:47792.33,rec_inc:0,simples:0,irpj:-1147.02,csll:-477.92,pis:-310.65,cofins:-1433.77,iss:-2389.62,aj_rec:0,diesel:-7810.55,arla:0,pedagio:0,sal:-3594.74,sal_rat:-1218.77,pf_sal:0,pf_folg:0,inss:-1314.09,fgts:-490.21,irrf:0,va:-428.00,vt:0,vcomb:-169.23,comb_rat:0,prov_fer:-133.71,prov_13:-401.13,prov_fgt:-42.79,prov_mul:-213.20,prov_av:0,prov_aav:-40.11,prov_var:0,comis:0,alug:-183.33,energia:-25.00,tel:0,fianca:-81.73,rast:-72.10,detro_t:-220.28,detro_i:0,seguro:-335.83,depre:0,depre_ac:0},
  e2:{rec_fret:49360.90,rec_inc:0,simples:0,irpj:-1184.66,csll:-493.61,pis:-320.85,cofins:-1480.83,iss:-2468.05,aj_rec:0,diesel:-6070.73,arla:0,pedagio:0,sal:-3594.74,sal_rat:-1218.77,pf_sal:0,pf_folg:0,inss:-1314.09,fgts:-490.21,irrf:0,va:-428.00,vt:0,vcomb:-169.23,comb_rat:0,prov_fer:-133.71,prov_13:-401.13,prov_fgt:-42.79,prov_mul:-213.20,prov_av:-401.13,prov_aav:-40.11,prov_var:-62.58,comis:0,alug:-128.57,energia:-11.92,tel:-91.80,fianca:-8.81,rast:-72.10,detro_t:-220.28,detro_i:0,seguro:-335.83,depre:0,depre_ac:0},
  e3:{rec_fret:26355.09,rec_inc:0,simples:0,irpj:-632.52,csll:-263.55,pis:-171.31,cofins:-790.65,iss:-1317.75,aj_rec:0,diesel:-11070.23,arla:0,pedagio:0,sal:-3594.74,sal_rat:-1218.77,pf_sal:0,pf_folg:0,inss:-1314.09,fgts:-490.21,irrf:0,va:-428.00,vt:0,vcomb:-169.23,comb_rat:0,prov_fer:-133.71,prov_13:-401.13,prov_fgt:-42.79,prov_mul:-213.20,prov_av:-401.13,prov_aav:-40.11,prov_var:-62.58,comis:0,alug:-128.57,energia:-11.92,tel:-91.80,fianca:-8.81,rast:-72.10,detro_t:-220.28,detro_i:0,seguro:-335.83,depre:0,depre_ac:0},
  e4:{rec_fret:36942.99,rec_inc:0,simples:0,irpj:-886.63,csll:-369.43,pis:-240.13,cofins:-1108.29,iss:-1847.15,aj_rec:0,diesel:-10116.99,arla:0,pedagio:0,sal:-3594.74,sal_rat:-1218.77,pf_sal:0,pf_folg:0,inss:-1314.09,fgts:-490.21,irrf:0,va:-428.00,vt:0,vcomb:-169.23,comb_rat:0,prov_fer:-133.71,prov_13:-401.13,prov_fgt:-42.79,prov_mul:-213.20,prov_av:-401.13,prov_aav:-40.11,prov_var:-62.58,comis:0,alug:-128.57,energia:-11.92,tel:-91.80,fianca:-8.81,rast:-72.10,detro_t:-220.28,detro_i:0,seguro:-335.83,depre:0,depre_ac:0},
  e5:{rec_fret:33675.12,rec_inc:0,simples:0,irpj:-808.20,csll:-336.75,pis:-218.89,cofins:-1010.25,iss:-1683.76,aj_rec:0,diesel:-9310.40,arla:0,pedagio:0,sal:-3594.74,sal_rat:-1218.77,pf_sal:0,pf_folg:0,inss:-1314.09,fgts:-490.21,irrf:0,va:-428.00,vt:0,vcomb:-169.23,comb_rat:0,prov_fer:-133.71,prov_13:-401.13,prov_fgt:-42.79,prov_mul:-213.20,prov_av:-401.13,prov_aav:-40.11,prov_var:-62.58,comis:0,alug:-128.57,energia:-11.92,tel:-91.80,fianca:-8.81,rast:-72.10,detro_t:-220.28,detro_i:0,seguro:-335.83,depre:0,depre_ac:0},
  e6:{rec_fret:64523.83,rec_inc:0,simples:0,irpj:-1548.57,csll:-645.24,pis:-419.40,cofins:-1935.71,iss:-3226.19,aj_rec:0,diesel:-7417.26,arla:0,pedagio:0,sal:-3594.74,sal_rat:-1218.77,pf_sal:0,pf_folg:0,inss:-1314.09,fgts:-490.21,irrf:0,va:-428.00,vt:0,vcomb:-169.23,comb_rat:0,prov_fer:-133.71,prov_13:-401.13,prov_fgt:-42.79,prov_mul:-213.20,prov_av:-401.13,prov_aav:-40.11,prov_var:-62.58,comis:0,alug:-128.57,energia:-11.92,tel:-91.80,fianca:-8.81,rast:-72.10,detro_t:-220.28,detro_i:0,seguro:-335.83,depre:0,depre_ac:0},
}}];

function cmbCalc(periodo) {
  const tot={};
  CMB_EST.filter(r=>r.tipo==="linha").forEach(r=>{tot[r.id]=CMB_ESCALAS.reduce((s,e)=>s+(periodo.escalas[e.id]?.[r.id]??0),0);});
  const s=(...ids)=>ids.reduce((a,id)=>a+(tot[id]??0),0);
  tot.rec_bruta=s("rec_fret","rec_inc"); tot.rec_liq=tot.rec_bruta+s(...DED_IDS); tot.res_econ=tot.rec_liq+s(...DESP_IDS);
  const byE={};
  CMB_ESCALAS.forEach(e=>{
    const ev=periodo.escalas[e.id]??{};
    byE[e.id]={rec_bruta:(ev.rec_fret??0)+(ev.rec_inc??0)};
    byE[e.id].rec_liq=byE[e.id].rec_bruta+DED_IDS.reduce((a,k)=>a+(ev[k]??0),0);
    byE[e.id].res_econ=byE[e.id].rec_liq+DESP_IDS.reduce((a,k)=>a+(ev[k]??0),0);
  });
  return {tot,byE};
}

function CMBPage() {
  const [pi,setPi]=useState(0); const per=CMB_RAW[pi];
  const {tot,byE}=useMemo(()=>cmbCalc(per),[pi]);
  const [col,setCol]=useState(new Set());
  const toggleG=id=>setCol(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n;});
  let curG=null; const vis=[];
  CMB_EST.forEach(r=>{
    if(r.tipo==="grupo"){curG=r.id;vis.push({...r});}
    else if(r.tipo==="marco"||r.tipo==="final"){vis.push({...r});}
    else{if(!col.has(curG))vis.push({...r});}
  });
  const getV=(row,eid)=>{
    if(row.tipo==="marco"||row.tipo==="final") return eid?byE[eid]?.[row.id]??null:tot[row.id]??null;
    return eid?per.escalas[eid]?.[row.id]??0:tot[row.id]??0;
  };
  return (
    <div style={{padding:"18px 20px",display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8,flexShrink:0}}>
        <div>
          <p style={{fontSize:11,color:MUTED,margin:0,textTransform:"uppercase",letterSpacing:"0.6px"}}>Contrato 1821/2025 · Casa da Moeda do Brasil</p>
          <h2 style={{fontSize:22,fontWeight:500,color:TEXT,margin:"2px 0 0"}}>DRE Contrato CMB</h2>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <span style={{fontSize:12,color:MUTED}}>Competência:</span>
          <select value={pi} onChange={e=>setPi(+e.target.value)} style={{border:`1px solid ${BORDER}`,borderRadius:8,padding:"6px 12px",fontSize:13,color:TEXT,background:BG,cursor:"pointer"}}>
            {CMB_RAW.map((p,i)=><option key={i} value={i}>{p.label}</option>)}
          </select>
        </div>
      </div>
      <div className="table-scroll">
        <table className="cmb-table">
          <thead>
            <tr style={{background:SIDEBAR_BG}} className="sticky-header">
              <th className="sticky-col sticky-header cmb-col-label" style={{padding:"8px 14px",textAlign:"left",fontSize:13,color:"#fff",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.4px",background:SIDEBAR_BG,borderRight:"1px solid #2a2a2a"}}>Conta</th>
              {CMB_ESCALAS.map((e,i)=>(
                <th key={e.id} className="cmb-col-val" style={{padding:"6px 8px 2px",textAlign:"right",fontSize:13,color:"#fff",fontWeight:600,whiteSpace:"nowrap",borderRight:i<CMB_ESCALAS.length-1?"1px solid #2a2a2a":"none"}}>{e.label}</th>
              ))}
              <th className="cmb-col-total" style={{padding:"6px 12px 2px",textAlign:"right",fontSize:13,color:"#fff",fontWeight:700,borderLeft:"2px solid #2a2a2a",background:"#2a2a2a",whiteSpace:"nowrap"}}>Total</th>
            </tr>
            <tr style={{background:"#2a2a2a"}} className="sticky-header">
              <th className="sticky-col cmb-col-label" style={{padding:"2px 14px 8px",background:BRAND_D,borderRight:`1px solid ${BRAND_D}`}}/>
              {CMB_ESCALAS.map((e,i)=>(
                <th key={e.id} className="cmb-col-val" style={{padding:"2px 8px 8px",textAlign:"right",fontSize:10,color:"#c8e6e0",fontWeight:400,whiteSpace:"nowrap",borderRight:i<CMB_ESCALAS.length-1?`1px solid ${BRAND_D}`:"none"}}>{e.sub}</th>
              ))}
              <th className="cmb-col-total" style={{padding:"2px 12px 8px",textAlign:"right",fontSize:10,color:"#d1ede8",fontWeight:400,background:BRAND_D}}>{per.label}</th>
            </tr>
          </thead>
          <tbody>
            {vis.map((row,ri)=>{
              const isFinal=row.tipo==="final",isMarco=row.tipo==="marco",isGrupo=row.tipo==="grupo";
              const bg=isFinal?BRAND_L:isMarco?BRAND_L:isGrupo?"#f0f4f3":ri%2===0?BG:"#F5F5F5";
              const co=isFinal?BRAND_D:isMarco?BRAND_D:TEXT;
              const fw=(isFinal||isMarco||isGrupo)?700:400;
              const fs=isFinal?14:isMarco?12.5:12;
              return (
                <tr key={row.id+ri} style={{background:bg,borderBottom:`1px solid ${BORDER}`}}>
                  <td onClick={isGrupo?()=>toggleG(row.id):undefined} className="sticky-col cmb-col-label"
                    style={{padding:isFinal?"12px 14px":isMarco?"10px 14px":"7px 14px",fontSize:fs,color:co,fontWeight:fw,background:bg,
                      borderRight:`1px solid ${BORDER}`,borderLeft:(isFinal||isMarco)?`3px solid ${BRAND}`:"3px solid transparent",
                      borderTop:isFinal?`2px solid ${BORDER}`:"none",cursor:isGrupo?"pointer":"default",
                      whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                    {isGrupo&&<i className={`ti ${col.has(row.id)?"ti-chevron-right":"ti-chevron-down"}`} style={{marginRight:6,fontSize:10,color:BRAND}}/>}
                    {row.label}
                  </td>
                  {CMB_ESCALAS.map((e,ei)=>{
                    const v=getV(row,e.id);
                    return <ValCell key={e.id} v={v} isFinal={isFinal} isMarco={isMarco} style={{borderRight:ei<CMB_ESCALAS.length-1?`1px solid ${BORDER}`:"none"}}/>;
                  })}
                  {(()=>{
                    const v=getV(row,null);
                    const tBg=isFinal?BRAND_L:isMarco?BRAND_L:isGrupo?"#e8eded":"#f4f7f6";
                    return <ValCell v={v} isFinal={isFinal} isMarco={isMarco} isGrupo={isGrupo} style={{borderLeft:"2px solid #d1dbd8",background:tBg,padding:isFinal?"12px 12px":"7px 12px"}}/>;
                  })()}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{fontSize:11,color:"#9ca3af",marginTop:6,textAlign:"right",flexShrink:0}}>Elim Consultoria Tributária &amp; Empresarial · DRE CMB · {per.label}</p>
    </div>
  );
}

// ── LOGO ─────────────────────────────────────────────────────────
function LogoElim({ collapsed }) {
  if (collapsed) {
    return (
      <svg width="32" height="36" viewBox="0 0 32 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text x="1" y="28" fontFamily="'Helvetica Neue',Helvetica,Arial,sans-serif" fontWeight="300" fontSize="28" fill="#ffffff">E</text>
        <circle cx="29" cy="26" r="4.5" fill="#1e7a5a"/>
      </svg>
    );
  }
  return (
    <svg width="125" height="44" viewBox="0 0 125 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="38" fontFamily="'Helvetica Neue',Helvetica,Arial,sans-serif" fontWeight="300" fontSize="44" fill="#ffffff" letterSpacing="2">Elim</text>
      <circle cx="100" cy="34" r="6" fill="#1e7a5a"/>
    </svg>
  );
}

// ── APP ──────────────────────────────────────────────────────────
const PAGES=["DRE Geral","DRE CMB"];
const ICONS={"DRE Geral":"ti-report","DRE CMB":"ti-building"};

export default function App() {
  const [page,setPage]=useState("DRE Geral");
  const [sideOpen,setSideOpen]=useState(true);
  const [mobileOpen,setMobileOpen]=useState(false);
  const goTo=p=>{setPage(p);setMobileOpen(false);};
  return (
    <>
      <GlobalStyle/>
      <div className="app-shell">
        {mobileOpen&&<div className="overlay" onClick={()=>setMobileOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:15}}/>}
        <div className={`sidebar ${sideOpen?"":"collapsed"} ${mobileOpen?"mobile-open":""}`}>
          <div style={{padding:sideOpen?"20px 16px 16px":"20px 10px 16px",borderBottom:"1px solid #2a2a2a",minHeight:64,display:"flex",alignItems:"center"}}>
            <LogoElim collapsed={!sideOpen}/>
          </div>
          <nav style={{flex:1,padding:"10px 0"}}>
            {PAGES.map(p=>(
              <button key={p} onClick={()=>goTo(p)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:sideOpen?"11px 16px":"11px 13px",background:page===p?"#2a2a2a":"transparent",border:"none",cursor:"pointer",color:page===p?"#7fcfb8":"#888",fontSize:13,fontWeight:page===p?500:400,textAlign:"left",borderLeft:page===p?`3px solid ${BRAND}`:"3px solid transparent",transition:"all 0.15s"}}>
                <i className={`ti ${ICONS[p]}`} style={{fontSize:17,flexShrink:0}}/>
                {sideOpen&&<span style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p}</span>}
              </button>
            ))}
          </nav>
          <div style={{padding:"10px",borderTop:"1px solid #2a2a2a"}}>
            <button onClick={()=>setSideOpen(o=>!o)} style={{background:"transparent",border:"none",color:"#888",cursor:"pointer",fontSize:16,padding:6,display:"flex",alignItems:"center",justifyContent:"center",width:"100%"}} aria-label="Toggle sidebar">
              <i className={`ti ${sideOpen?"ti-chevrons-left":"ti-chevrons-right"}`}/>
            </button>
          </div>
        </div>
        <div className="main-content">
          <div style={{background:BG,borderBottom:`1px solid ${BORDER}`,padding:"10px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
              <button className="hamburger" onClick={()=>setMobileOpen(o=>!o)} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:20,color:TEXT,padding:4,display:"none",alignItems:"center",flexShrink:0}} aria-label="Abrir menu">
                <i className="ti ti-menu-2"/>
              </button>
              <p className="topbar-label-full" style={{fontSize:12,color:MUTED,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>Tropical Bus Transporte e Turismo · CNPJ 08.360.383/0001-10</p>
              <p className="topbar-label-short" style={{fontSize:12,color:MUTED,margin:0,display:"none"}}>Tropical Bus</p>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
              <span className="period-badge" style={{fontSize:11,background:BRAND_L,color:BRAND_D,padding:"3px 10px",borderRadius:20,fontWeight:500,whiteSpace:"nowrap"}}>Jan–Abr/2026</span>
              <div style={{width:30,height:30,borderRadius:"50%",background:BRAND,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,color:"#fff"}}>TB</div>
            </div>
          </div>
          <div style={{flex:1,overflow:"hidden",background:BG2,display:"flex",flexDirection:"column"}}>
            {page==="DRE Geral"&&<DREPage/>}
            {page==="DRE CMB"&&<CMBPage/>}
          </div>
        </div>
      </div>
    </>
  );
}
