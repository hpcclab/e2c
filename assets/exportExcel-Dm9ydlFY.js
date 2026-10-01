import{J as w}from"./index--A9wJhNy.js";const N="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",x=t=>String(t||"").toUpperCase(),u=(t,n)=>{if(x(t.status)==="DNR")return"DNR";const o=t[n];return o??"N/A"},g=t=>t.taskId??t.id??"N/A",$=(t,n)=>n.filter(o=>{const l=o.assigned_machine||"";return l===t.name||l.startsWith(`${t.name} #`)}).length,v=({dataResults:t=[],missedTasks:n=[],machines:o=[],simulationTime:l=0}={})=>{const s=o.filter(e=>e.id!==-1),m=t.filter(e=>x(e.status)==="COMPLETED").length,c=s.reduce((e,r)=>e+(Number(r.price)||0)*(Number(r.utilization_time)||0)*3600,0);return{Summary:[["Metric","Value"],["Simulation Time (s)",Number(l)||0],["Total Tasks",t.length],["Completed Tasks",m],["Missed Tasks",n.length],["Total Machines",s.length],["Total Cost ($)",c]],Tasks:[["Task ID","Type","Assigned Machine","Generation Time","Data Size (KB)","Connectivity","Travel Time","Arrival Time","Start Time","Completion Time","Exec Time","Status","Deadline"],...t.map(e=>[g(e),e.task_type||"N/A",e.assigned_machine||"N/A",e.generation_time??e.arrival_time??"N/A",e.data_size??"N/A",e.connectivity??"N/A",e.travel_time??0,e.arrival_time??"N/A",u(e,"start_time"),u(e,"end_time"),e.execution_time??"N/A",e.status||"N/A",e.deadline??"N/A"])],"Missed Tasks":[["Task ID","Type","Assigned Machine","Generation Time","Data Size (KB)","Connectivity","Travel Time","Arrival Time","Deadline","Status"],...n.map(e=>[g(e),e.task_type||"N/A",e.assigned_machine||"N/A",e.generation_time??e.arrival_time??"N/A",e.data_size??"N/A",e.connectivity??"N/A",e.travel_time??0,e.arrival_time??"N/A",e.deadline??"N/A",e.status||"MISSED"])],Machines:[["Machine Name","Power (W)","Idle Power (W)","Replicas","Price ($/s)","Utilization Time (hr)","Total Cost ($)","Tasks Processed"],...s.map(e=>[e.name||"N/A",Number(e.power)||0,Number(e.idle_power)||0,Number(e.replicas)||1,Number(e.price)||0,Number(e.utilization_time)||0,(Number(e.price)||0)*(Number(e.utilization_time)||0)*3600,$(e,t)])]}},y=t=>String(t).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;"),d=t=>{let n="",o=t;for(;o>0;)o-=1,n=String.fromCharCode(65+o%26)+n,o=Math.floor(o/26);return n},A={Tasks:{4:2,5:2,6:2,7:2,9:2},"Missed Tasks":{4:2,5:2},Machines:{5:3,6:4,7:5}},D=(t,n,o)=>{var l;if(n===1)return 1;if(t==="Summary"&&o===2){if(n===2)return 2;if(n===7)return 5}return(l=A[t])==null?void 0:l[o]},k=(t,n,o)=>{const l=o?` s="${o}"`:"";return typeof t=="number"&&Number.isFinite(t)?`<c r="${n}"${l}><v>${t}</v></c>`:`<c r="${n}" t="inlineStr"${l}><is><t xml:space="preserve">${y(t??"")}</t></is></c>`},_=(t,n)=>{const o=Math.max(1,...n.map(r=>r.length)),l=Math.max(1,n.length),s=`${d(o)}${l}`,c=Array.from({length:o},(r,i)=>{const a=n.reduce((p,f)=>Math.max(p,String(f[i]??"").length),10);return Math.min(a+2,32)}).map((r,i)=>`<col min="${i+1}" max="${i+1}" width="${r}" customWidth="1"/>`).join(""),e=n.map((r,i)=>{const a=i+1,p=r.map((b,T)=>{const h=T+1,I=`${d(h)}${a}`,F=D(t,a,h);return k(b,I,F)}).join("");return`<row r="${a}"${a===1?' ht="24" customHeight="1"':""}>${p}</row>`}).join("");return`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${s}"/>
  <sheetViews><sheetView workbookViewId="0" showGridLines="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  <cols>${c}</cols>
  <sheetData>${e}</sheetData>
  <autoFilter ref="A1:${d(o)}${l}"/>
</worksheet>`},S=t=>`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <bookViews><workbookView/></bookViews>
  <sheets>${t.map((n,o)=>`<sheet name="${y(n)}" sheetId="${o+1}" r:id="rId${o+1}"/>`).join("")}</sheets>
</workbook>`,C=t=>`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${Array.from({length:t},(n,o)=>`<Relationship Id="rId${o+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${o+1}.xml"/>`).join("")}
  <Relationship Id="rId${t+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,M=t=>`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${Array.from({length:t},(n,o)=>`<Override PartName="/xl/worksheets/sheet${o+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}
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
</styleSheet>`,z=t=>{const n=v(t),o=Object.keys(n),l=new w;return l.file("[Content_Types].xml",M(o.length)),l.file("_rels/.rels",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'),l.file("xl/workbook.xml",S(o)),l.file("xl/_rels/workbook.xml.rels",C(o.length)),l.file("xl/styles.xml",E),o.forEach((s,m)=>{l.file(`xl/worksheets/sheet${m+1}.xml`,_(s,n[s]))}),l},R=async t=>{const o=await z(t).generateAsync({type:"blob",mimeType:N,compression:"DEFLATE"}),l=new Date().toISOString().slice(0,19).replace(/[:-]/g,"");return{blob:o,filename:`simulation_report_${l}.xlsx`}};export{v as buildExcelReportData,R as createExcelReportFile,z as createSimulationWorkbook};
