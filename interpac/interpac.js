/* =====================================================
   INTERPAC – Lógica (versión paciente, modo claro)
   Autor: Dr. Julio Giorgini · Diseño ChatGPT 2025
   Archivo: interpac.js
   ===================================================== */

// -------- Utilidades --------
function $(id){ return document.getElementById(id); }

function getURLParams(){
  const u = new URL(window.location.href);
  const g = (k) => u.searchParams.get(k) || "";
  // Permitir múltiples líneas con \n o %0A
  const toLines = (s) => !s ? [] : s.split(/\r?\n/).map(t => t.trim()).filter(Boolean);
  return {
    name:  g("name"),
    mode:  g("mode"),
    date:  g("date"),     // ISO recomendado: YYYY-MM-DD
    indic: toLines(g("indic")),
    goals: toLines(g("goals")),
    doctor:g("doctor"),
    email: g("email"),
    phone: g("phone")
  };
}

function toLocalDateString(iso){
  if(!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso; // si viene en otro formato, mostramos crudo
  return d.toLocaleDateString();
}

function buildMailtoLink(email, patientName, doctorName){
  if(!email) return "#";
  const subject = encodeURIComponent(`Envío de controles – ${patientName || ""}`);
  const body = encodeURIComponent(
    `Hola ${doctorName || "equipo"},\n\nAdjunto controles solicitados.\n\nSaludos,\n${patientName || ""}`
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

function downloadICS(data){
  if (!data.date){ alert("No hay fecha de próximo contacto."); return; }
  const dt = new Date((data.date || "") + "T09:00:00");
  if (isNaN(dt.getTime())){ alert("Fecha inválida."); return; }
  const dtEnd = new Date(dt.getTime() + 30*60000);
  const pad = (n)=> String(n).padStart(2,"0");
  const toUTC = (d)=> (
    d.getUTCFullYear() +
    pad(d.getUTCMonth()+1) +
    pad(d.getUTCDate()) + "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) + "00Z"
  );
  const desc = `Indicaciones: ${(data.indic||[]).join(" | ")}\\nObjetivos: ${(data.goals||[]).join(" | ")}`;
  const ics =
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//INTERPAC//DBT2//ES
BEGIN:VEVENT
UID:${Date.now()}@interpac
DTSTAMP:${toUTC(new Date())}
DTSTART:${toUTC(dt)}
DTEND:${toUTC(dtEnd)}
SUMMARY:${(data.mode||"Contacto")} con el equipo
DESCRIPTION:${desc}
END:VEVENT
END:VCALENDAR`;
  const blob = new Blob([ics],{type:"text/calendar"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "interpac-recordatorio.ics";
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

// -------- Render principal --------
function render(data){
  // Título
  $("title").textContent = `Bienvenido/a ${data.name || ""}`.trim() || "Bienvenido/a";

  // Próximo contacto
  const dateFmt = toLocalDateString(data.date);
  $("mode-pill").textContent = `Modo: ${data.mode || "—"}`;
  $("date-pill").textContent = `Fecha: ${dateFmt}`;
  $("mode-text").textContent = `Debe ${data.mode || "—"}`;
  $("date-text").innerHTML = `Fecha límite: <strong>${dateFmt}</strong>`;

  // Indicaciones
  const indBox = $("indicaciones");
  indBox.innerHTML = "";
  if (data.indic && data.indic.length){
    data.indic.forEach(t => {
      const p = document.createElement("p");
      p.textContent = "— " + t;
      indBox.appendChild(p);
    });
  } else {
    indBox.innerHTML = "<p>—</p>";
  }

  // Objetivos
  const objBox = $("objetivos");
  objBox.innerHTML = "";
  if (data.goals && data.goals.length){
    data.goals.forEach(t => {
      const p = document.createElement("p");
      p.textContent = "— " + t;
      objBox.appendChild(p);
    });
  } else {
    objBox.innerHTML = "<p>—</p>";
  }

  // Contacto
  $("doctor").textContent = `Médico tratante: ${data.doctor || "—"}`;
  $("email").innerHTML = `Email para controles: ${
    data.email ? `<a href="mailto:${data.email}">${data.email}</a>` : "—"
  }`;
  $("phone").textContent = `Teléfono: ${data.phone || "—"}`;

  // Botones
  $("btn-mailto").href = buildMailtoLink(data.email, data.name, data.doctor);
  $("btn-ics").onclick = () => downloadICS(data);
  $("btn-done").onclick = () => {
    localStorage.setItem("INTERPAC_DONE", new Date().toISOString());
    alert("¡Gracias! Marcado como realizado.");
  };
  $("btn-copy-mail").onclick = async () => {
    if (!data.email) return alert("No hay email de destino.");
    try{
      await navigator.clipboard.writeText(data.email);
      alert("Email copiado.");
    }catch{
      alert("No se pudo copiar el email.");
    }
  };
}

// -------- Carga de datos: URL → window.INTERPAC_DATA → JSON --------
async function bootstrap(){
  // 1) URL params
  const params = getURLParams();

  // 2) window.INTERPAC_DATA (si el médico lo inyecta antes del script)
  const embedded = (typeof window.INTERPAC_DATA === "object" && window.INTERPAC_DATA) ? window.INTERPAC_DATA : null;

  // 3) merge preferente: embebido > params
  let data = Object.assign({
    name:"", mode:"", date:"",
    indic:[], goals:[],
    doctor:"", email:"", phone:""
  }, params, embedded);

  // 4) Si no vino nada por URL ni embebido, probamos JSON de ejemplo
  const isEmpty =
    !data.name && !data.mode && !data.date &&
    (!data.indic || data.indic.length===0) &&
    (!data.goals || data.goals.length===0) &&
    !data.doctor && !data.email && !data.phone;

  if (isEmpty){
    try{
      const r = await fetch("data-example.json", {cache:"no-store"});
      if (r.ok){
        const j = await r.json();
        data = Object.assign(data, j);
      }
    }catch(e){
      // Si no existe o falla, seguimos sin datos
      // console.warn("No se pudo cargar data-example.json", e);
    }
  }

  render(data);

  // 5) postMessage para actualizaciones en tiempo real (si se usa iframe)
  window.addEventListener("message", (ev)=>{
    if (!ev?.data || ev.data.type !== "INTERPAC_UPDATE") return;
    const payload = ev.data.payload || {};
    const next = Object.assign({}, data, payload);
    data = next; // persistimos última versión
    render(next);
  });
}

// Inicial
document.addEventListener("DOMContentLoaded", bootstrap);
