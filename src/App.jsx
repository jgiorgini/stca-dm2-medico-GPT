import React, { useState } from "react";
import "./styles.css";

export default function App() {
  const [paciente, setPaciente] = useState({
    nombre: "",
    edad: "",
    hba1c: "",
    ldl: "",
    tas: "",
    tad: "",
    imc: "",
    fecha: "",
  });

  const handleChange = (e) => {
    setPaciente({ ...paciente, [e.target.name]: e.target.value });
  };

  const getColor = (valor, min, max) => {
    if (valor === "") return "gray";
    if (valor < min) return "orange";
    if (valor > max) return "red";
    return "green";
  };

  return (
    <div className="container">
      <h1>STCA – DM2 · Plataforma del Médico</h1>
      <p className="subtitle">Módulo de Seguimiento y Control Cardiometabólico</p>

      <div className="form">
        <label>
          Nombre y Apellido:
          <input type="text" name="nombre" value={paciente.nombre} onChange={handleChange} />
        </label>

        <label>
          Edad:
          <input type="number" name="edad" value={paciente.edad} onChange={handleChange} />
        </label>

        <label>
          Fecha del control:
          <input type="date" name="fecha" value={paciente.fecha} onChange={handleChange} />
        </label>

        <div className="grid">
          <label>
            HbA1c (%):
            <input type="number" name="hba1c" value={paciente.hba1c} onChange={handleChange} />
            <span style={{ color: getColor(paciente.hba1c, 0, 7) }}>●</span>
          </label>

          <label>
            LDL (mg/dL):
            <input type="number" name="ldl" value={paciente.ldl} onChange={handleChange} />
            <span style={{ color: getColor(paciente.ldl, 0, 70) }}>●</span>
          </label>

          <label>
            TAS (mmHg):
            <input type="number" name="tas" value={paciente.tas} onChange={handleChange} />
            <span style={{ color: getColor(paciente.tas, 100, 130) }}>●</span>
          </label>

          <label>
            TAD (mmHg):
            <input type="number" name="tad" value={paciente.tad} onChange={handleChange} />
            <span style={{ color: getColor(paciente.tad, 60, 80) }}>●</span>
          </label>

          <label>
            IMC:
            <input type="number" name="imc" value={paciente.imc} onChange={handleChange} />
            <span style={{ color: getColor(paciente.imc, 18.5, 25) }}>●</span>
          </label>
        </div>
      </div>

      <div className="summary">
        <h2>Resumen</h2>
        <pre>{JSON.stringify(paciente, null, 2)}</pre>
      </div>
    </div>
  );
}
