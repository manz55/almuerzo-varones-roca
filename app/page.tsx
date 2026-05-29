'use client';

import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { motion, AnimatePresence } from 'framer-motion';

const VERSICULOS = [
  { texto: "«Esfuérzate y sé valiente; no temas ni desmayes, porque Jehová tu Dios estará contigo en dondequiera que vayas».", referencia: "Josué 1:9" },
  { texto: "«Manténganse alerta; permanezcan firmes en la fe; sean valientes y fuertes. Hagan todo con amor».", referencia: "1 Corintios 16:13-14" },
  { texto: "«Como el hierro se afila con el hierro, así un amigo afila a otro amigo».", referencia: "Proverbios 27:17" }
];

// Función para formatear el ID de la base de datos a un ticket amigable (Ej: 001, 002)
const formatTicket = (id: number) => `#${String(id).padStart(3, '0')}`;

const LOGO_ROCA_ETERNA_SVG = `
  <svg viewBox="0 0 400 400" width="80" height="80" style="margin: 0 auto; display: block;">
    <path d="M200,60 C230,110 270,120 270,160 C270,210 220,230 200,230 C180,230 130,210 130,160 C130,120 170,110 200,60 Z" fill="url(#gradientGold)" />
    <path d="M200,90 C215,125 240,135 240,165 C240,200 210,215 200,215 C190,215 160,200 160,165 C160,135 185,125 200,90 Z" fill="#EAB308" opacity="0.8" />
    <path d="M200,205 C240,205 310,140 310,200 C310,260 230,280 200,280 C170,280 90,260 90,200 C90,140 160,205 200,205 Z" fill="url(#gradientSilver)" stroke="#94A3B8" stroke-width="1" />
    <path d="M200,205 C220,220 240,240 240,255 C240,270 215,280 200,280 C185,280 160,270 160,255 C160,240 180,205 200,205 Z" fill="url(#gradientSilverDark)" />
    <defs>
      <linearGradient id="gradientGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#F5A623" />
        <stop offset="50%" stop-color="#FFD700" />
        <stop offset="100%" stop-color="#B45309" />
      </linearGradient>
      <linearGradient id="gradientSilver" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#E2E8F0" />
        <stop offset="100%" stop-color="#94A3B8" />
      </linearGradient>
      <linearGradient id="gradientSilverDark" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#CBD5E1" />
        <stop offset="100%" stop-color="#64748B" />
      </linearGradient>
    </defs>
  </svg>
`;

export default function Home() {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [cupos, setCupos] = useState(1);
  const [acompanantes, setAcompanantes] = useState<string[]>([]);
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia'>('efectivo');
  const [ultimos4Digitos, setUltimos4Digitos] = useState('');
  const [versiculo, setVersiculo] = useState({ texto: '', referencia: '' });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketGenerado, setTicketGenerado] = useState<{ codigo: string; total: number } | null>(null);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * VERSICULOS.length);
    setVersiculo(VERSICULOS[randomIndex]);
  }, []);

  const handleCuposChange = (cantidad: number) => {
    setCupos(cantidad);
    const totalExtrasCalculated = cantidad - 1;
    
    if (totalExtrasCalculated > 0) {
      setAcompanantes(new Array(totalExtrasCalculated).fill(''));
    } else {
      setAcompanantes([]);
    }
  };

  const handleAcompananteName = (index: number, value: string) => {
    const nuevosAcompanantes = [...acompanantes];
    nuevosAcompanantes[index] = value;
    setAcompanantes(nuevosAcompanantes);
  };

  const lanzarConfeti = () => {
    try {
      const duration = 3 * 1000;
      const end = Date.now() + duration;
      const interval = setInterval(() => {
        if (Date.now() > end) return clearInterval(interval);
        const confeti = document.createElement('div');
        const colores = ['#F5A623', '#FFD700', '#ffffff', '#10B981'];
        confeti.style.position = 'fixed';
        confeti.style.width = Math.random() * 8 + 6 + 'px';
        confeti.style.height = Math.random() * 8 + 6 + 'px';
        confeti.style.backgroundColor = colores[Math.floor(Math.random() * colores.length)];
        confeti.style.left = Math.random() * 100 + 'vw';
        confeti.style.top = '-10px';
        confeti.style.borderRadius = '50%';
        confeti.style.zIndex = '9999';
        confeti.style.transition = 'transform 3s linear, opacity 3s linear';
        document.body.appendChild(confeti);
        setTimeout(() => {
          confeti.style.transform = `translateY(105vh) translateX(${Math.random() * 100 - 50}px) rotate(${Math.random() * 360}deg)`;
          confeti.style.opacity = '0';
        }, 50);
        setTimeout(() => confeti.remove(), 3000);
      }, 40);
    } catch (e) {
      console.error(e);
    }
  };

  const descargarPDFUsuario = () => {
    if (!ticketGenerado) return;
    const ventanaImpresion = window.open('', '_blank');
    if (!ventanaImpresion) return;

    const calculoTotal = cupos * 35;
    const fechaActualStr = new Date().toLocaleDateString();

    ventanaImpresion.document.write(`
      <html>
        <head>
          <title>Comprobante_${ticketGenerado.codigo}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; background-color: #f8fafc; }
            .ticket-card { border: 2px solid #e2e8f0; background: #ffffff; padding: 35px; max-width: 420px; margin: 20px auto; border-radius: 24px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); text-align: center; }
            .logo-container { margin-bottom: 10px; }
            .church-title { font-size: 13px; font-weight: 800; letter-spacing: 2px; color: #64748b; margin: 5px 0 0 0; text-transform: uppercase; }
            h2 { margin: 5px 0 0 0; font-size: 22px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
            .subtitle { margin: 5px 0 0 0; font-size: 12px; color: #64748b; font-weight: 500; }
            .ticket-code { background: #fef3c7; color: #d97706; display: inline-block; padding: 10px 24px; border-radius: 14px; font-size: 28px; font-weight: 900; margin: 25px 0; letter-spacing: 1px; }
            .info-box { text-align: left; background: #f8fafc; padding: 20px; border-radius: 16px; font-size: 13px; line-height: 1.8; border: 1px solid #f1f5f9; }
            .info-line { display: flex; justify-content: space-between; border-bottom: 1px dashed #e2e8f0; padding: 6px 0; }
            .info-line:last-child { border-bottom: none; }
            .label { color: #64748b; font-weight: 500; }
            .value { color: #0f172a; font-weight: 700; }
            .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 25px; line-height: 1.5; font-weight: 500; }
          </style>
        </head>
        <body>
          <div class="ticket-card">
            <div class="logo-container">${LOGO_ROCA_ETERNA_SVG}</div>
            <p class="church-title">Roca Eterna Ministerios</p>
            <h2>ALMUERZO DE VARONES</h2>
            <p class="subtitle">Constancia Oficial de Inscripción</p>
            
            <div class="ticket-code">${ticketGenerado.codigo}</div>
            
            <div class="info-box">
              <div class="info-line"><span class="label">Responsable:</span> <span class="value">${nombre}</span></div>
              <div class="info-line"><span class="label">Teléfono:</span> <span class="value">${telefono}</span></div>
              <div class="info-line"><span class="label">Cupos Apartados:</span> <span class="value">${cupos}</span></div>
              ${acompanantes.filter(n => n.trim() !== '').length > 0 ? `<div class="info-line"><span class="label">Acompañantes:</span> <span class="value">${acompanantes.filter(n => n.trim() !== '').join(', ')}</span></div>` : ''}
              <div class="info-line"><span class="label">Total Abonado:</span> <span class="value" style="color:#10b981;">Q${calculoTotal}.00</span></div>
              <div class="info-line"><span class="label">Método de Pago:</span> <span class="value">${metodoPago === 'transferencia' ? `Transferencia (Dígitos: ${ultimos4Digitos})` : 'En Efectivo'}</span></div>
            </div>
            
            <div class="footer">
              Generado el ${fechaActualStr}<br>
              Iglesia Roca Eterna • Control de Ingreso
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    ventanaImpresion.document.close();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !telefono) {
      alert('Por favor llena los campos obligatorios.');
      return;
    }
    
    if (metodoPago === 'transferencia') {
      if (!/^\d{4}$/.test(ultimos4Digitos)) {
        alert('Por favor ingresa exactamente los últimos 4 dígitos del número de aprobación.');
        return;
      }
    }

    setCargando(true);
    setError(null);

    const totalPagar = cupos * 35;

    try {
      const estadoInicial = metodoPago === 'transferencia' ? 'Por Verificar' : 'Pendiente Efectivo';

      // Insertamos y le pedimos a la base de datos el ID autoincremental recién creado
      const { data, error: supabaseError } = await supabase
        .from('inscripciones')
        .insert([
          {
            responsable: nombre,
            telefono: telefono,
            cupos: cupos,
            acompanantes: acompanantes.filter(n => n.trim() !== '').join(', '),
            total: totalPagar,
            estado: estadoInicial,
            ultimos_4_digitos: metodoPago === 'transferencia' ? ultimos4Digitos : null
          }
        ])
        .select('id') // Pedimos específicamente el ID
        .single(); // Solo esperamos un resultado

      if (supabaseError) throw supabaseError;

      // Usamos el ID de la base de datos para generar el ticket "Abuelo-Friendly"
      const codigoTicket = formatTicket(data.id);

      setTicketGenerado({ codigo: codigoTicket, total: totalPagar });
      lanzarConfeti(); 
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error inesperado al guardar datos. Revisa tu conexión.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1c1000] to-[#0f0f0f] flex items-center justify-center p-4 md:p-8 font-sans selection:bg-amber-500 selection:text-black">
      <AnimatePresence>
        {ticketGenerado ? (
          <div className="min-h-screen bg-gradient-to-br from-[#1c1000] to-[#0f0f0f] flex items-center justify-center p-4 md:p-8 font-sans selection:bg-amber-500 selection:text-black w-full absolute top-0 left-0 z-50">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#111827]/90 backdrop-blur-xl p-6 md:p-10 rounded-[2.5rem] border border-amber-500/40 max-w-md w-full text-center shadow-2xl relative overflow-hidden mx-auto"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 via-orange-600 to-amber-400"></div>
              
              <div className="mb-2" dangerouslySetInnerHTML={{ __html: LOGO_ROCA_ETERNA_SVG }} />
              <h2 className="text-2xl font-black text-white tracking-wider uppercase mt-2">¡Cupo Asegurado!</h2>
              <p className="text-xs text-slate-400 mt-1">Tu registro se guardó correctamente en el sistema</p>
              
              <div className="my-6 bg-[#090602] p-6 rounded-2xl border border-amber-500/10 relative">
                <p className="text-[10px] font-bold text-amber-500/60 tracking-widest uppercase mb-1">NÚMERO DE TICKET</p>
                <p className="text-4xl font-black text-amber-400 tracking-tight">{ticketGenerado.codigo}</p>
              </div>

              <p className="text-base text-slate-300 font-medium mb-6">
                Total a cancelar: <span className="text-emerald-400 font-black text-2xl pl-1">Q{ticketGenerado.total}</span>
              </p>

              <div className="p-5 bg-slate-950/80 rounded-2xl text-left border border-slate-800/80 space-y-2.5">
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">📋 Pasos Siguientes:</h4>
                {metodoPago === 'transferencia' ? (
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Tu número de aprobación fue registrado con éxito. Puedes descargar tu constancia en el botón de abajo. Los administradores validarán los 4 dígitos con el banco muy pronto.
                  </p>
                ) : (
                  <p className="text-xs text-slate-200 leading-relaxed font-semibold bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                    ⚠️ Por favor, acérquese con los encargados en la mesa de registro para realizar su pago en efectivo lo antes posible. Así asegura su lugar de forma definitiva en la lista oficial.
                  </p>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={descargarPDFUsuario}
                className="w-full mt-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-black py-4 rounded-xl transition-all tracking-wider uppercase shadow-xl shadow-emerald-500/10"
              >
                📥 Descargar PDF Comprobante
              </motion.button>

              <button
                onClick={() => {
                  setTicketGenerado(null);
                  setNombre('');
                  setTelefono('');
                  setUltimos4Digitos('');
                  handleCuposChange(1);
                  setMetodoPago('efectivo');
                }}
                className="w-full mt-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold py-3.5 rounded-xl transition-all tracking-wider uppercase"
              >
                Volver al inicio
              </button>
            </motion.div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111827]/30 md:bg-[#111827]/50 backdrop-blur-2xl w-full min-h-screen md:min-h-0 md:max-w-5xl md:rounded-[2.5rem] shadow-2xl border-0 md:border border-amber-500/10 grid grid-cols-1 md:grid-cols-12 overflow-hidden"
          >
            <div className="md:col-span-5 bg-gradient-to-br from-[#241705]/40 to-[#0f0f0f]/90 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-900 relative">
              <div className="relative z-10 space-y-3 mt-4 md:mt-0">
                <div className="text-left mb-2" dangerouslySetInnerHTML={{ __html: LOGO_ROCA_ETERNA_SVG }} />
                <span className="bg-amber-500/10 text-amber-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-amber-500/20 inline-block">
                  Roca Eterna Ministerios
                </span>
                <h2 className="text-3xl font-black text-white tracking-tight pt-1 leading-none">ALMUERZO DE <br/>VARONES</h2>
                <p className="text-xs text-slate-400 leading-relaxed pt-2">
                  Un espacio exclusivo diseñado para conectar, fortalecernos mutuamente como hombres de valor y recargar fuerzas. Aparta tu lugar.
                </p>
              </div>

              <div className="border-t border-amber-500/10 pt-6 mt-8 space-y-3 relative z-10">
                <AnimatePresence mode="wait">
                  {versiculo.texto && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-1.5">
                      <p className="text-xs text-slate-300 italic font-medium leading-relaxed">{versiculo.texto}</p>
                      <p className="text-[10px] font-bold text-amber-500/90 uppercase tracking-wider">— {versiculo.referencia}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="md:col-span-7 p-6 md:p-10 flex flex-col justify-center bg-slate-950/40">
              <form onSubmit={handleSubmit} className="space-y-5">
                <h3 className="text-xl font-black text-white tracking-tight uppercase hidden md:block">🎟️ Formulario de Inscripción</h3>
                
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl font-medium">
                    ❌ {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Tu Nombre Completo:</label>
                  <input
                    type="text" required placeholder="Ej. Carlos Pérez"
                    className="w-full bg-[#070a13]/90 border border-slate-800 rounded-2xl px-4 py-4 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-amber-500/80 transition-all font-medium"
                    value={nombre} onChange={(e) => setNombre(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Número de Teléfono:</label>
                  <input
                    type="tel" required placeholder="Ej. 5555-1234"
                    className="w-full bg-[#070a13]/90 border border-slate-800 rounded-2xl px-4 py-4 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-amber-500/80 transition-all font-medium"
                    value={telefono} onChange={(e) => setTelefono(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">¿Cuántos cupos en total?</label>
                  <select
                    className="w-full bg-[#070a13]/90 border border-slate-800 rounded-2xl px-4 py-4 text-sm text-amber-400 focus:outline-none focus:border-amber-500 font-bold cursor-pointer transition-all"
                    value={cupos} onChange={(e) => handleCuposChange(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <option key={num} value={num} className="bg-[#111827] text-slate-300">{num} {num === 1 ? 'Cupo' : 'Cupos'}</option>
                    ))}
                  </select>
                </div>

                <AnimatePresence>
                  {acompanantes.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-3 pt-1 overflow-hidden">
                      <label className="block text-[10px] font-black text-amber-500 uppercase tracking-widest pl-1">Nombres de tus acompañantes:</label>
                      {acompanantes.map((name, index) => (
                        <input
                          key={index} type="text" required placeholder={`Nombre completo acompañante #${index + 1}`}
                          className="w-full bg-[#070a13]/50 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-medium capitalize transition-all"
                          value={name} onChange={(e) => handleAcompananteName(index, e.target.value)}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-3 pt-3 border-t border-slate-800/80">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">¿Cómo vas a realizar tu pago?</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button" onClick={() => setMetodoPago('efectivo')}
                      className={`p-4 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all duration-200 ${metodoPago === 'efectivo' ? 'bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/10' : 'bg-[#070a13]/60 border-slate-800 text-slate-400'}`}
                    >
                      💵 En Efectivo
                    </button>
                    <button
                      type="button" onClick={() => setMetodoPago('transferencia')}
                      className={`p-4 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all duration-200 ${metodoPago === 'transferencia' ? 'bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/10' : 'bg-[#070a13]/60 border-slate-800 text-slate-400'}`}
                    >
                      🏦 Transferencia
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {metodoPago === 'transferencia' ? (
                      <motion.div 
                        key="transferencia-fields"
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        exit={{ opacity: 0, height: 0 }} 
                        className="overflow-hidden"
                      >
                        <div className="bg-[#070a13]/90 border border-amber-500/10 p-5 rounded-2xl space-y-4 mt-1">
                          <p className="text-xs text-slate-400 font-medium leading-relaxed">
                            🏦 <span className="font-bold text-slate-200">Banco G&T Continental</span><br />
                            Monetaria: <span className="font-mono text-amber-500 font-bold tracking-wide">200271078</span><br />
                            A nombre de: <span className="text-slate-300">Varones Re</span>
                          </p>

                          <div className="space-y-1.5">
                            <label className="block text-[9px] font-black text-amber-400 uppercase tracking-widest">🔢 Últimos 4 dígitos de aprobación:</label>
                            <input
                              type="text" required maxLength={4} pattern="\d{4}" placeholder="Ej. 8421"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 font-mono tracking-widest focus:outline-none focus:border-amber-500"
                              value={ultimos4Digitos} onChange={(e) => setUltimos4Digitos(e.target.value.replace(/\D/g, ''))}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="efectivo-warning"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl mt-1 text-left">
                          <p className="text-xs text-amber-400 leading-relaxed font-medium">
                            📢 <span className="font-black uppercase tracking-wider">¡Atención!</span> Por favor, acérquese a la mesa de pago para realizar su pago en efectivo lo antes posible. Su cupo se mantendrá reservado de manera temporal.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} type="submit" disabled={cargando}
                  className={`w-full text-xs font-black py-4 px-6 rounded-2xl transition-all uppercase tracking-wider shadow-lg mt-2 ${cargando ? 'bg-slate-800 text-slate-600' : 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-xl shadow-amber-500/10'}`}
                >
                  {cargando ? 'Guardando Registro...' : `Reservar mi Cupo (Q${cupos * 35})`}
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}