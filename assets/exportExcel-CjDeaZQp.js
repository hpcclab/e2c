import{J as _,s as A,m as w,f as g}from"./index-Cj5MRTWy.js";const D="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",b=t=>String(t||"").toUpperCase(),y=(t,n)=>{if(b(t.status)==="DNR")return"DNR";const o=t[n];return o??"N/A"},x=t=>t.taskId??t.id??"N/A",$=(t,n)=>n.filter(o=>{const r=o.assigned_machine||"";return r===t.name||r.startsWith(`${t.name} #`)}).length,v=({dataResults:t=[],missedTasks:n=[],machines:o=[],sources:r=[],edges:a=[],simulationTime:c=0,schedulingMode:p="immediate",batchIntervalSeconds:f=null}={})=>{const l=o.filter(e=>e.id!==-1),i=r.filter(e=>e.id!==-3),s=t.filter(e=>b(e.status)==="COMPLETED").length,m=l.reduce((e,d)=>e+(Number(d.price)||0)*(Number(d.utilization_time)||0)*3600,0);return{Summary:[["Metric","Value"],["Simulation Time (s)",Number(c)||0],["Scheduling Mode",A(p)],["Batch Period (s)",p==="batch"?Number(f)||0:"N/A"],["Total Tasks",t.length],["Completed Tasks",s],["Missed Tasks",n.length],["IoT Battery Generation/Upload Failures",t.filter(e=>e.status==="NOT_GENERATED").length],["Machine Battery Processing Failures",t.filter(e=>e.failure_reason==="MACHINE_BATTERY_DEPLETED").length],["Total Machines",l.length],["Total IoT Devices",i.length],["Total Edges",a.length],["Total Cost ($)",m]],Tasks:[["Task ID","Type","Assigned Machine","Generation Time","Data Size (KB)","Generation Energy (J)","Network Upload Energy (J)","Processing Energy (J)","Connectivity","Travel Time","Arrival Time","Batch Number","Batch Dispatch Time","Batch Wait Time","Start Time","Completion Time","Exec Time","Status","Failure Reason","Deadline"],...t.map(e=>[x(e),e.task_type||"N/A",e.assigned_machine||"N/A",e.generation_time??e.arrival_time??"N/A",e.data_size??"N/A",e.generation_energy_j??"N/A",e.network_energy_j??"N/A",e.processing_energy_j??"N/A",e.connectivity??"N/A",e.travel_time??0,e.arrival_time??"N/A",e.batch_number??"N/A",e.batch_release_time??"N/A",e.batch_wait_time??"N/A",y(e,"start_time"),y(e,"end_time"),e.execution_time??"N/A",e.status||"N/A",g(e.failure_reason),e.deadline??"N/A"])],"Missed Tasks":[["Task ID","Type","Assigned Machine","Generation Time","Data Size (KB)","Generation Energy (J)","Network Upload Energy (J)","Processing Energy (J)","Connectivity","Travel Time","Arrival Time","Batch Number","Batch Dispatch Time","Batch Wait Time","Deadline","Status","Failure Reason"],...n.map(e=>[x(e),e.task_type||"N/A",e.assigned_machine||"N/A",e.generation_time??e.arrival_time??"N/A",e.data_size??"N/A",e.generation_energy_j??"N/A",e.network_energy_j??"N/A",e.processing_energy_j??"N/A",e.connectivity??"N/A",e.travel_time??0,e.arrival_time??"N/A",e.batch_number??"N/A",e.batch_release_time??"N/A",e.batch_wait_time??"N/A",e.deadline??"N/A",e.status||"MISSED",g(e.failure_reason)])],Machines:[["Machine Name","Power (W)","Idle Power (W)","Replicas","Price ($/s)","Utilization Time (hr)","Total Cost ($)","Tasks Processed","Power Source","Battery Capacity (J)","Battery Remaining (J)","Processing Energy Rate (J/KB)"],...l.map(e=>[e.name||"N/A",Number(e.power)||0,Number(e.idle_power)||0,Number(e.replicas)||1,Number(e.price)||0,Number(e.utilization_time)||0,(Number(e.price)||0)*(Number(e.utilization_time)||0)*3600,$(e,t),e.energySource||"Grid-Powered",e.energySource==="Battery"?e.batteryCapacityJ??100:"N/A",e.energySource==="Battery"?e.batteryRemainingJ??e.batteryCapacityJ??100:"N/A",w(e)])]}},T=t=>String(t).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;"),h=t=>{let n="",o=t;for(;o>0;)o-=1,n=String.fromCharCode(65+o%26)+n,o=Math.floor(o/26);return n},S={Tasks:{4:2,5:2,6:2,7:2,8:2,10:2,11:2,12:2,13:2,14:2,15:2,16:2,17:2,20:2},"Missed Tasks":{4:2,5:2,6:2,7:2,8:2,10:2,11:2,12:2,13:2,14:2,15:2},Machines:{5:3,6:4,7:5}},E=(t,n,o)=>{var r;if(n===1)return 1;if(t==="Summary"&&o===2){if(n===2)return 2;if(n===13)return 5}return(r=S[t])==null?void 0:r[o]},C=(t,n,o)=>{const r=o?` s="${o}"`:"";return typeof t=="number"&&Number.isFinite(t)?`<c r="${n}"${r}><v>${t}</v></c>`:`<c r="${n}" t="inlineStr"${r}><is><t xml:space="preserve">${T(t??"")}</t></is></c>`},B=(t,n)=>{const o=Math.max(1,...n.map(l=>l.length)),r=Math.max(1,n.length),a=`${h(o)}${r}`,p=Array.from({length:o},(l,i)=>{const s=n.reduce((m,e)=>Math.max(m,String(e[i]??"").length),10);return Math.min(s+2,32)}).map((l,i)=>`<col min="${i+1}" max="${i+1}" width="${l}" customWidth="1"/>`).join(""),f=n.map((l,i)=>{const s=i+1,m=l.map((d,N)=>{const u=N+1,F=`${h(u)}${s}`,I=E(t,s,u);return C(d,F,I)}).join("");return`<row r="${s}"${s===1?' ht="24" customHeight="1"':""}>${m}</row>`}).join("");return`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${a}"/>
  <sheetViews><sheetView workbookViewId="0" showGridLines="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  <cols>${p}</cols>
  <sheetData>${f}</sheetData>
  <autoFilter ref="A1:${h(o)}${r}"/>
</worksheet>`},M=t=>`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <bookViews><workbookView/></bookViews>
  <sheets>${t.map((n,o)=>`<sheet name="${T(n)}" sheetId="${o+1}" r:id="rId${o+1}"/>`).join("")}</sheets>
</workbook>`,k=t=>`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${Array.from({length:t},(n,o)=>`<Relationship Id="rId${o+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${o+1}.xml"/>`).join("")}
  <Relationship Id="rId${t+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,P=t=>`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${Array.from({length:t},(n,o)=>`<Override PartName="/xl/worksheets/sheet${o+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}
</Types>`,R=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
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
</styleSheet>`,J=t=>{const n=v(t),o=Object.keys(n),r=new _;return r.file("[Content_Types].xml",P(o.length)),r.file("_rels/.rels",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'),r.file("xl/workbook.xml",M(o)),r.file("xl/_rels/workbook.xml.rels",k(o.length)),r.file("xl/styles.xml",R),o.forEach((a,c)=>{r.file(`xl/worksheets/sheet${c+1}.xml`,B(a,n[a]))}),r},j=async t=>{const o=await J(t).generateAsync({type:"blob",mimeType:D,compression:"DEFLATE"}),r=new Date().toISOString().slice(0,19).replace(/[:-]/g,"");return{blob:o,filename:`simulation_report_${r}.xlsx`}};export{v as buildExcelReportData,j as createExcelReportFile,J as createSimulationWorkbook};
