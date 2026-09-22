import{J as k}from"./index-Bhv10nIB.js";const w="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",x=e=>String(e||"").toUpperCase(),u=(e,n)=>{if(x(e.status)==="DNR")return"DNR";const t=e[n];return t??"N/A"},g=e=>e.taskId??e.id??"N/A",$=(e,n)=>n.filter(t=>{const l=t.assigned_machine||"";return l===e.name||l.startsWith(`${e.name} #`)}).length,N=({dataResults:e=[],missedTasks:n=[],machines:t=[],simulationTime:l=0}={})=>{const r=t.filter(o=>o.id!==-1),m=e.filter(o=>x(o.status)==="COMPLETED").length,p=r.reduce((o,s)=>o+(Number(s.price)||0)*(Number(s.utilization_time)||0)*3600,0);return{Summary:[["Metric","Value"],["Simulation Time (s)",Number(l)||0],["Total Tasks",e.length],["Completed Tasks",m],["Missed Tasks",n.length],["Total Machines",r.length],["Total Cost ($)",p]],Tasks:[["Task ID","Type","Assigned Machine","Arrival Time","Start Time","Completion Time","Exec Time","Status","Deadline"],...e.map(o=>[g(o),o.task_type||"N/A",o.assigned_machine||"N/A",o.arrival_time??"N/A",u(o,"start_time"),u(o,"end_time"),o.execution_time??"N/A",o.status||"N/A",o.deadline??"N/A"])],"Missed Tasks":[["Task ID","Type","Assigned Machine","Arrival Time","Deadline","Status"],...n.map(o=>[g(o),o.task_type||"N/A",o.assigned_machine||"N/A",o.arrival_time??"N/A",o.deadline??"N/A",o.status||"MISSED"])],Machines:[["Machine Name","Power (W)","Idle Power (W)","Replicas","Price ($/s)","Utilization Time (hr)","Total Cost ($)","Tasks Processed"],...r.map(o=>[o.name||"N/A",Number(o.power)||0,Number(o.idle_power)||0,Number(o.replicas)||1,Number(o.price)||0,Number(o.utilization_time)||0,(Number(o.price)||0)*(Number(o.utilization_time)||0)*3600,$(o,e)])]}},y=e=>String(e).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;"),d=e=>{let n="",t=e;for(;t>0;)t-=1,n=String.fromCharCode(65+t%26)+n,t=Math.floor(t/26);return n},D={Tasks:{4:2,5:2,6:2,7:2,9:2},"Missed Tasks":{4:2,5:2},Machines:{5:3,6:4,7:5}},A=(e,n,t)=>{var l;if(n===1)return 1;if(e==="Summary"&&t===2){if(n===2)return 2;if(n===7)return 5}return(l=D[e])==null?void 0:l[t]},S=(e,n,t)=>{const l=t?` s="${t}"`:"";return typeof e=="number"&&Number.isFinite(e)?`<c r="${n}"${l}><v>${e}</v></c>`:`<c r="${n}" t="inlineStr"${l}><is><t xml:space="preserve">${y(e??"")}</t></is></c>`},C=(e,n)=>{const t=Math.max(1,...n.map(s=>s.length)),l=Math.max(1,n.length),r=`${d(t)}${l}`,p=Array.from({length:t},(s,i)=>{const a=n.reduce((c,f)=>Math.max(c,String(f[i]??"").length),10);return Math.min(a+2,32)}).map((s,i)=>`<col min="${i+1}" max="${i+1}" width="${s}" customWidth="1"/>`).join(""),o=n.map((s,i)=>{const a=i+1,c=s.map((b,I)=>{const h=I+1,F=`${d(h)}${a}`,T=A(e,a,h);return S(b,F,T)}).join("");return`<row r="${a}"${a===1?' ht="24" customHeight="1"':""}>${c}</row>`}).join("");return`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${r}"/>
  <sheetViews><sheetView workbookViewId="0" showGridLines="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  <cols>${p}</cols>
  <sheetData>${o}</sheetData>
  <autoFilter ref="A1:${d(t)}${l}"/>
</worksheet>`},v=e=>`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <bookViews><workbookView/></bookViews>
  <sheets>${e.map((n,t)=>`<sheet name="${y(n)}" sheetId="${t+1}" r:id="rId${t+1}"/>`).join("")}</sheets>
</workbook>`,_=e=>`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${Array.from({length:e},(n,t)=>`<Relationship Id="rId${t+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${t+1}.xml"/>`).join("")}
  <Relationship Id="rId${e+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,M=e=>`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${Array.from({length:e},(n,t)=>`<Override PartName="/xl/worksheets/sheet${t+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}
</Types>`,E=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="4">
    <numFmt numFmtId="164" formatCode="0.000"/>
    <numFmt numFmtId="165" formatCode="$0.0000"/>
    <numFmt numFmtId="166" formatCode="0.0000"/>
    <numFmt numFmtId="167" formatCode="$0.00"/>
  </numFmts>
  <fonts count="2">
    <font><sz val="10"/><name val="Arial"/></font>
    <font><b/><color rgb="FFFFFFFF"/><sz val="10"/><name val="Arial"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF2563EB"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left style="thin"><color rgb="FFD1D5DB"/></left><right style="thin"><color rgb="FFD1D5DB"/></right><top style="thin"><color rgb="FFD1D5DB"/></top><bottom style="thin"><color rgb="FFD1D5DB"/></bottom><diagonal/></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="6">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
    <xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
    <xf numFmtId="166" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
    <xf numFmtId="167" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`,B=e=>{const n=N(e),t=Object.keys(n),l=new k;return l.file("[Content_Types].xml",M(t.length)),l.file("_rels/.rels",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'),l.file("xl/workbook.xml",v(t)),l.file("xl/_rels/workbook.xml.rels",_(t.length)),l.file("xl/styles.xml",E),t.forEach((r,m)=>{l.file(`xl/worksheets/sheet${m+1}.xml`,C(r,n[r]))}),l},X=async e=>{const t=await B(e).generateAsync({type:"blob",mimeType:w,compression:"DEFLATE"}),l=new Date().toISOString().slice(0,19).replace(/[:-]/g,"");return{blob:t,filename:`simulation_report_${l}.xlsx`}};export{N as buildExcelReportData,X as createExcelReportFile,B as createSimulationWorkbook};
