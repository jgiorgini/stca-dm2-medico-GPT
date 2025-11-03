import React, { useMemo, useState } from "react";
import "./styles.css";

// ——— utilidades ———
const hoyISO = () => new Date().toISOString().slice(0, 10);
const parseNum = (v) => (v === "" || v == null ? NaN : Number(v));
const round1 = (n) => (isNaN(n) ? "" : Math.round(n * 10) / 10);
const diffDays = (dateISO) => {
  if (!dateISO) return Infinity;
  const a = new Date(dateISO);
  const b = new Date(hoyISO());
  return Math.ceil((a - b) / (1000 * 60 * 60 * 24));
};

// ——— objetivos por defecto (editables en UI) ———
const OBJ_INIT = {
  hba1c_max: 7.0,
  ldl_max: 70,
  tas_max: 130,
  tad_max: 80,
  imc_min: 18.5,
  imc_max: 25,
};

const VISTA = { LISTA: "lista", INGRESO: "ingreso", SEGUIMIENTO: "seguimiento" };

// ——— presets de medicación (ejemplos mínimos, podés ampliar) ———
const PRESETS = [
  { grupo: "Hipoglucemiante", f: "Metformina 850 mg c/12 h" },
  { grupo: "Hipoglucemiante", f: "Dapagliflozina 10 mg/d" },
  { grupo: "Hipoglucemiante", f: "Semaglutida 0,5 mg s/c semanal" },
  { grupo: "Antihipertensivo", f: "Losartán 50 mg/d" },
  { grupo: "Hipolipemiante", f: "Atorvastatina 40 mg/noche" },
  { grupo: "Antiagregante", f: "Aspirina 100 mg/d" },
];

export default function App() {
  const [vista, setVista] = useState(VISTA.LISTA);

  // lista de pacientes muy simple (persistencia local opcional)
  const [pacientes, setPacientes] = useState(() => {
    const raw = localStorage.getItem("pacientes_dm2");
    return raw ? JSON.parse(raw) : [];
  });
  const [filtro, setFiltro] = useState("");

  // ficha activa en edición
  const [p, setP] = useState({
    id: crypto.randomUUID(),
    inicio_fecha: hoyISO(),
    lugar: "",
    nombre: "",
    dni: "",
    sexo: "",
    fnac: "",
    edad: "",
    direccion: "",
    telefono: "",
    mail: "",
    medico_tratante: "",
    medico_ficha: "",

    // antecedentes
    anios_dm: "",
    tipo_dm: "2",
    cv_antecedente: "",
    peso: "",
    altura_cm: "",
    cintura_cm: "",
    imc: "",
    cintura_altura: "",
    qx: "",
    internaciones: "no",
    internaciones_causa: "",
    resp_patologia: "",

    // psicosocial
    vive: "solo",
    convive_con: "",
    escolaridad: "",
    vulnerable: "no",
    ansiedad: "no",
    depresion: "no",
    trabajo_actual: "si",
    planes_sociales: "no",
    ejercicio_150: "no",
    ejercicio_otro: "",
    sueno_horas: "",
    stopbang: "",

    // obstétricos si mujer
    embarazos: "",
    abortos: "",
    emb_normales: "",
    complicaciones: "",

    // tratamiento actual (texto libre + presets)
    tto: [], // array de strings

    // examen físico
    fc: "",
    tas: "",
    tad: "",
    piel: "normal",
    cv: "",
    resp: "",
    neuro: "",

    // laboratorio
    hemograma: "",
    glucemia: "",
    hba1c: "",
    urea: "",
    creatinina: "",
    ionograma: "",
    hepatograma: "",
    perfil_lipidico: "",
    tsh: "",
    ers: "",
    pcr: "",
    ferremia: "",
    ferritina: "",
    vitd: "",
    vitb12: "",

    // seguimiento
    control_tipo: "presencial",
    proximo_control: "",
    indicaciones: "",
    objetivos: "Adherencia, PA <130/80, LDL <70, HbA1c <7",
    cumplio_obj: "no",
  });

  const [obj, setObj] = useState(OBJ_INIT);

  // ——— sincroniza persistencia local ———
  const savePacientes = (arr) => {
    setPacientes(arr);
    localStorage.setItem("pacientes_dm2", JSON.stringify(arr));
  };

  // ——— cálculos automáticos ———
  const altura_m = useMemo(() => parseNum(p.altura_cm) / 100, [p.altura_cm]);
  const peso = useMemo(() => parseNum(p.peso), [p.peso]);
  const cintura = useMemo(() => parseNum(p.cintura_cm), [p.cintura_cm]);

  const imc = useMemo(() => round1(peso / (altura_m * altura_m)), [peso, altura_m]);
  const relCintAlt = useMemo(() => round1(cintura / p.altura_cm), [cintura, p.altura_cm]);

  // actualizar automáticos en UI
  const updateField = (name, value) => setP((s) => ({ ...s, [name]: value }));
  const onChange = (e) => updateField(e.target.name, e.target.value);

  // guardar paciente
  const agregarPaciente = () => {
    const nuevo = { ...p, imc, cintura_altura: relCintAlt };
    savePacientes([nuevo, ...pacientes]);
    setVista(VISTA.LISTA);
  };

  const borrarPaciente = (id) => {
    if (!confirm("¿Eliminar paciente de la lista?")) return;
    savePacientes(pacientes.filter((x) => x.id !== id));
  };

  const cargarPaciente = (row) => {
    setP(row);
    setVista(VISTA.SEGUIMIENTO);
  };

  // estado de semáforos
  const color = (ok) => (ok == null ? "gray" : ok ? "green" : "red");
  const okHba1c = !isNaN(parseNum(p.hba1c)) && parseNum(p.hba1c) <= parseNum(obj.hba1c_max);
  const okLDL = !isNaN(parseNum(p.perfil_lipidico)) && parseNum(p.perfil_lipidico) <= parseNum(obj.ldl_max);
  const okTAS = !isNaN(parseNum(p.tas)) && parseNum(p.tas) < parseNum(obj.tas_max);
  const okTAD = !isNaN(parseNum(p.tad)) && parseNum(p.tad) < parseNum(obj.tad_max);
  const okIMC = !isNaN(imc) && imc >= parseNum(obj.imc_min) && imc <= parseNum(obj.imc_max);

  // estado agenda
  const dias = diffDays(p.proximo_control);
  const estadoAgenda = isFinite(dias) ? (dias >= 0 ? "al día" : "atrasado") : "sin fecha";

  // presets de medicación
  const agregarPreset = (txt) => updateField("tto", Array.from(new Set([...(p.tto || []), txt]))); // sin duplicar
  const quitarMed = (txt) => updateField("tto", (p.tto || []).filter((x) => x !== txt));

  // exportar a PDF (impresión limpia)
  const exportPDF = () => window.print();

  // ——————————————————————————————————— UI ———————————————————————————————————

  return (
    <div className="wrap">
      {/* barra superior */}
      <header className="topbar no-print">
        <h1>STCA – DM2 · Plataforma del Médico</h1>
        <nav>
          <button className={vista === VISTA.LISTA ? "primary" : ""} onClick={() => setVista(VISTA.LISTA)}>
            Pacientes
          </button>
          <button className={vista === VISTA.INGRESO ? "primary" : ""} onClick={() => setVista(VISTA.INGRESO)}>
            Ficha de ingreso
          </button>
          <button className={vista === VISTA.SEGUIMIENTO ? "primary" : ""} onClick={() => setVista(VISTA.SEGUIMIENTO)}>
            Seguimiento
          </button>
          <button onClick={exportPDF}>Exportar PDF</button>
        </nav>
      </header>

      {/* objetivos configurables */}
      <section className="card no-print">
        <h3>Objetivos (editables)</h3>
        <div className="grid4">
          <label>HbA1c ≤ <input type="number" step="0.1" value={obj.hba1c_max} onChange={(e)=>setObj({...obj, hba1c_max: e.target.value})}/> %</label>
          <label>LDL ≤ <input type="number" value={obj.ldl_max} onChange={(e)=>setObj({...obj, ldl_max: e.target.value})}/> mg/dL</label>
          <label>TAS &lt; <input type="number" value={obj.tas_max} onChange={(e)=>setObj({...obj, tas_max: e.target.value})}/> mmHg</label>
          <label>TAD &lt; <input type="number" value={obj.tad_max} onChange={(e)=>setObj({...obj, tad_max: e.target.value})}/> mmHg</label>
          <label>IMC {obj.imc_min}–<input style={{width:80}} type="number" value={obj.imc_max} onChange={(e)=>setObj({...obj, imc_max: e.target.value})}/> kg/m²</label>
        </div>
      </section>

      {/* lista multi-paciente */}
      {vista === VISTA.LISTA && (
        <section className="card">
          <div className="row">
            <h2>Pacientes</h2>
            <input placeholder="Buscar…" value={filtro} onChange={(e)=>setFiltro(e.target.value)} />
            <button onClick={()=>{ setP({ ...p, id: crypto.randomUUID(), inicio_fecha: hoyISO() }); setVista(VISTA.INGRESO); }}>+ Nuevo</button>
          </div>
          <table className="tabla">
            <thead>
              <tr>
                <th>Nombre</th><th>DNI</th><th>Próx. control</th><th>Estado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pacientes
                .filter(x => (x.nombre||"").toLowerCase().includes(filtro.toLowerCase()))
                .map(x => {
                  const d = diffDays(x.proximo_control);
                  const estado = isFinite(d) ? (d >= 0 ? "al día" : "atrasado") : "sin fecha";
                  return (
                    <tr key={x.id}>
                      <td>{x.nombre}</td>
                      <td>{x.dni}</td>
                      <td>{x.proximo_control || "-"}</td>
                      <td><span className={`badge ${estado}`}>{estado}</span></td>
                      <td>
                        <button onClick={()=>cargarPaciente(x)}>Abrir</button>
                        <button className="danger" onClick={()=>borrarPaciente(x.id)}>Borrar</button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </section>
      )}

      {/* ficha de ingreso */}
      {vista === VISTA.INGRESO && (
        <section className="card">
          <h2>Ingreso</h2>
          <div className="grid2">
            <label>Fecha inicio <input type="date" name="inicio_fecha" value={p.inicio_fecha} onChange={onChange} /></label>
            <label>Lugar <input name="lugar" value={p.lugar} onChange={onChange} /></label>
            <label>Nombre y apellido <input name="nombre" value={p.nombre} onChange={onChange} /></label>
            <label>DNI <input name="dni" value={p.dni} onChange={onChange} /></label>
            <label>Sexo
              <select name="sexo" value={p.sexo} onChange={onChange}>
                <option value=""></option><option>F</option><option>M</option><option>Otro</option>
              </select>
            </label>
            <label>Fecha de nac. <input type="date" name="fnac" value={p.fnac} onChange={onChange} /></label>
            <label>Edad <input name="edad" value={p.edad} onChange={onChange} /></label>
            <label>Dirección / Ciudad <input name="direccion" value={p.direccion} onChange={onChange} /></label>
            <label>Teléfono <input name="telefono" value={p.telefono} onChange={onChange} /></label>
            <label>Mail <input name="mail" value={p.mail} onChange={onChange} /></label>
            <label>Médico tratante <input name="medico_tratante" value={p.medico_tratante} onChange={onChange} /></label>
            <label>Médico que completa <input name="medico_ficha" value={p.medico_ficha} onChange={onChange} /></label>
          </div>

          <h3>Antecedentes y factores de riesgo</h3>
          <div className="grid3">
            <label>Años de DM <input name="anios_dm" value={p.anios_dm} onChange={onChange} /></label>
            <label>Tipo de DM <input name="tipo_dm" value={p.tipo_dm} onChange={onChange} /></label>
            <label>CV antecedentes <input name="cv_antecedente" value={p.cv_antecedente} onChange={onChange} /></label>

            <label>Peso (kg) <input name="peso" value={p.peso} onChange={onChange} /></label>
            <label>Altura (cm) <input name="altura_cm" value={p.altura_cm} onChange={onChange} /></label>
            <label>Cintura (cm) <input name="cintura_cm" value={p.cintura_cm} onChange={onChange} /></label>

            <label>IMC <input readOnly value={imc} /></label>
            <label>Cintura/Altura <input readOnly value={relCintAlt} /></label>

            <label>Cirugías <input name="qx" value={p.qx} onChange={onChange} /></label>
            <label>Internaciones
              <select name="internaciones" value={p.internaciones} onChange={onChange}>
                <option>no</option><option>si</option>
              </select>
            </label>
            {p.internaciones === "si" && (
              <label>Causa <input name="internaciones_causa" value={p.internaciones_causa} onChange={onChange} /></label>
            )}
            <label>Patología respiratoria <input name="resp_patologia" value={p.resp_patologia} onChange={onChange} /></label>

            <label>Vive
              <select name="vive" value={p.vive} onChange={onChange}>
                <option>solo</option><option>acompañado</option>
              </select>
            </label>
            {p.vive === "acompañado" && (
              <label>Convive con <input name="convive_con" value={p.convive_con} onChange={onChange} /></label>
            )}

            <label>Escolaridad <input name="escolaridad" value={p.escolaridad} onChange={onChange} /></label>
            <label>Zona vulnerable
              <select name="vulnerable" value={p.vulnerable} onChange={onChange}>
                <option>no</option><option>si</option>
              </select>
            </label>
            <label>Ansiedad
              <select name="ansiedad" value={p.ansiedad} onChange={onChange}>
                <option>no</option><option>si</option>
              </select>
            </label>
            <label>Depresión
              <select name="depresion" value={p.depresion} onChange={onChange}>
                <option>no</option><option>si</option>
              </select>
            </label>
            <label>Trabajo actual
              <select name="trabajo_actual" value={p.trabajo_actual} onChange={onChange}>
                <option>si</option><option>no</option>
              </select>
            </label>
            <label>Planes sociales
              <select name="planes_sociales" value={p.planes_sociales} onChange={onChange}>
                <option>no</option><option>si</option>
              </select>
            </label>
            <label>Ejercicio ≥150 min/sem
              <select name="ejercicio_150" value={p.ejercicio_150} onChange={onChange}>
                <option>no</option><option>si</option>
              </select>
            </label>
            <label>Otro ejercicio <input name="ejercicio_otro" value={p.ejercicio_otro} onChange={onChange} /></label>
            <label>Horas de sueño <input name="sueno_horas" value={p.sueno_horas} onChange={onChange} /></label>
            <label>STOP-BANG (riesgo SAOS) <input name="stopbang" value={p.stopbang} onChange={onChange} /></label>
          </div>

          <div className="row">
            <button className="primary" onClick={agregarPaciente}>Guardar ingreso</button>
            <button onClick={()=>setVista(VISTA.LISTA)}>Volver</button>
          </div>
        </section>
      )}

      {/* seguimiento */}
      {vista === VISTA.SEGUIMIENTO && (
        <section className="card">
          <h2>Seguimiento</h2>

          <div className="grid3">
            <label>FC <input name="fc" value={p.fc} onChange={onChange} /></label>
            <label>TAS <input name="tas" value={p.tas} onChange={onChange} /></label>
            <label>TAD <input name="tad" value={p.tad} onChange={onChange} /></label>

            <label>Piel
              <select name="piel" value={p.piel} onChange={onChange}>
                <option>normal</option><option>micosis</option><option>úlceras</option><option>sequedad</option>
              </select>
            </label>
            <label>Cardiovascular <input name="cv" value={p.cv} onChange={onChange} placeholder="soplos, pulsos, IC..." /></label>
            <label>Respiratorio <input name="resp" value={p.resp} onChange={onChange} placeholder="entrada de aire, rales..." /></label>
            <label>Neurológico <input name="neuro" value={p.neuro} onChange={onChange} placeholder="conciencia, déficit..." /></label>
          </div>

          <h3>Laboratorio</h3>
          <div className="grid3">
            <label>HbA1c % <input name="hba1c" value={p.hba1c} onChange={onChange} /></label>
            <label>LDL mg/dL <input name="perfil_lipidico" value={p.perfil_lipidico} onChange={onChange} /></label>
            <label>Glucemia mg/dL <input name="glucemia" value={p.glucemia} onChange={onChange} /></label>
            <label>Urea <input name="urea" value={p.urea} onChange={onChange} /></label>
            <label>Creatinina <input name="creatinina" value={p.creatinina} onChange={onChange} /></label>
            <label>TSH <input name="tsh" value={p.tsh} onChange={onChange} /></label>
            <label>PCR <input name="pcr" value={p.pcr} onChange={onChange} /></label>
            <label>Ferritina <input name="ferritina" value={p.ferritina} onChange={onChange} /></label>
            <label>Vitamina D <input name="vitd" value={p.vitd} onChange={onChange} /></label>
          </div>

          <h3>Semáforos</h3>
          <div className="chips">
            <span className={`chip ${color(okHba1c)}`}>HbA1c</span>
            <span className={`chip ${color(okLDL)}`}>LDL</span>
            <span className={`chip ${color(okTAS && okTAD)}`}>PA</span>
            <span className={`chip ${color(okIMC)}`}>IMC</span>
          </div>

          <h3>Tratamiento (presets + libre)</h3>
          <div className="preset-row no-print">
            {PRESETS.map((x) => (
              <button key={x.f} onClick={()=>agregarPreset(x.f)}>{x.f}</button>
            ))}
          </div>
          <ul className="meds">
            {(p.tto || []).map((m) => (
              <li key={m}>{m} <button className="link danger" onClick={()=>quitarMed(m)}>quitar</button></li>
            ))}
          </ul>
          <textarea placeholder="Agregar indicaciones libres…" value={p.indicaciones} onChange={(e)=>updateField("indicaciones", e.target.value)} />

          <div className="grid3">
            <label>Tipo de control
              <select name="control_tipo" value={p.control_tipo} onChange={onChange}>
                <option>presencial</option><option>virtual</option><option>email</option>
              </select>
            </label>
            <label>Próximo control <input type="date" name="proximo_control" value={p.proximo_control} onChange={onChange} /></label>
            <label>Estado <span className={`badge ${estadoAgenda}`}>{estadoAgenda}</span></label>
          </div>

          <div className="row">
            <button className="primary" onClick={()=>{ // guardar actualización en lista
              const upd = { ...p, imc, cintura_altura: relCintAlt };
              savePacientes([upd, ...pacientes.filter(x=>x.id!==p.id)]);
              alert("Seguimiento guardado.");
            }}>Guardar seguimiento</button>
            <button onClick={()=>setVista(VISTA.LISTA)}>Volver</button>
          </div>
        </section>
      )}

      {/* pie impresión */}
      <footer className="print-footer only-print">
       
