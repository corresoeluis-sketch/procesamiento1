const $ = id => document.getElementById(id);
const fmt = (v, d = 4) => Number.isFinite(v) ? v.toLocaleString('es-CO', { maximumFractionDigits: d, minimumFractionDigits: d }) : 'N/D';
let data = [], nextId = 1, R = null;

function valid(x, y) { return Number.isFinite(x) && Number.isFinite(y) && x > 0 && y > 0; }
function invalidate() { R = null; $('estado').textContent = 'Sin procesar'; $('estado').className = 'badge warn';
  $('procOut').innerHTML = $('resOut').innerHTML = '<p>Datos modificados: vuelve a procesar.</p>'; $('indOut').innerHTML = ''; }

function render() {
  $('tabla').tBodies[0].innerHTML = data.map((p, i) =>
    `<tr><td>${p.id}</td><td>${p.x}</td><td>${p.y}</td><td><button data-e="${i}">Editar</button> <button data-d="${i}">Eliminar</button></td></tr>`).join('');
  $('count').textContent = data.length;
  const av = [], xs = data.map(p => p.x), distinct = new Set(xs).size;
  if (data.length < 20) av.push(`Faltan ${20 - data.length} observaciones para el análisis completo.`);
  if (distinct < xs.length) av.push(`Hay ${xs.length - distinct} estaturas repetidas: se conservan en la regresión; Lagrange usa una observación por estatura.`);
  if (distinct < 5) av.push('Hay menos de 5 estaturas distintas: no se podrá construir el grado 4.');
  $('avisos').innerHTML = av.map(a => `<li>${a}</li>`).join('');
  Charts.scatter('cPrev', data);
}
function add(x, y, id) {
  if (!valid(x, y)) { $('msg').textContent = 'Valores inválidos: deben ser números positivos y no vacíos.'; return false; }
  $('msg').textContent = ''; data.push({ id: id ?? nextId++, x, y }); invalidate(); render(); return true;
}
$('add').onclick = () => { if (add(parseFloat($('ix').value), parseFloat($('iy').value))) $('ix').value = $('iy').value = ''; };
$('tabla').onclick = e => {
  const d = e.target.dataset;
  if (d.d !== undefined) { data.splice(+d.d, 1); invalidate(); render(); }
  if (d.e !== undefined) {
    const p = data[+d.e], x = parseFloat(prompt('Estatura (cm)', p.x)), y = parseFloat(prompt('Peso (kg)', p.y));
    if (valid(x, y)) { p.x = x; p.y = y; invalidate(); render(); } else $('msg').textContent = 'Edición inválida; no se modificó la fila.';
  }
};
$('clear').onclick = () => { if (confirm('¿Borrar todas las observaciones?')) { data = []; invalidate(); render(); } };
$('file').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  const rows = (await f.text()).split(/\r?\n/).filter(l => l.trim()).map(l => l.split(/[;,\t]/).map(s => s.trim().replace(',', '.')));
  const head = rows[0].some(c => isNaN(parseFloat(c))) ? rows.shift() : null;
  if (head && !confirm(`Columnas detectadas: ${head.join(' | ')}\nSe usarán las dos últimas como estatura y peso. ¿Continuar?`)) return;
  const bad = [];
  rows.forEach((r, i) => { const c = r.slice(-2); if (!add(parseFloat(c[0]), parseFloat(c[1]))) bad.push(i + 1); });
  $('msg').textContent = bad.length ? `Filas rechazadas (no eliminadas en silencio): ${bad.join(', ')}` : '';
};
$('exp').onclick = () => download('datos.csv', 'id,estatura_cm,peso_kg\n' + data.map(p => `${p.id},${p.x},${p.y}`).join('\n'));
function download(name, text) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' })); a.download = name; a.click(); }
document.querySelectorAll('nav button').forEach(b => b.onclick = () => {
  document.querySelectorAll('nav button,.tab').forEach(e => e.classList.remove('on'));
  b.classList.add('on'); $(b.dataset.tab).classList.add('on');
});

$('procesar').onclick = () => {
  if (data.length < 20) { $('msg').textContent = 'Se requieren al menos 20 observaciones válidas.'; return; }
  const x = data.map(p => p.x), y = data.map(p => p.y);
  const lin = Regression.linear(x, y), quad = Regression.quadratic(x, y);
  const loo = [1, 2, 3, 4].map(m => ({ degree: m, rows: Lagrange.loocv(data, m) }));
  loo.forEach(s => s.m = Stats.errors(s.rows, y));
  R = { x, y, lin, quad, loo, r: Stats.pearson(x, y) };
  $('target').value = $('target').value || fmt(Stats.mean(x), 1).replace(',', '.');
  $('estado').textContent = 'Procesado'; $('estado').className = 'badge ok';
  showProc(); showRes();
};
$('target').oninput = $('deg').onchange = () => R && showProc();

const pre = a => `<pre>${(a || []).join('\n')}</pre>`;
function showProc() {
  const { lin, quad, x } = R, t = parseFloat($('target').value), m = +$('deg').value;
  let h = `<h3>Regresión lineal</h3>${lin.error ? `<p class="msg">${lin.error}</p>` : `<details open><summary>Pasos</summary>${pre(lin.steps)}</details><p>ŷ = ${fmt(lin.coef[0], 6)} + ${fmt(lin.coef[1], 6)}x</p>`}`;
  h += `<h3>Regresión cuadrática</h3>${quad.error ? `<p class="msg">${quad.error}</p>` : `<details open><summary>Sistema normal y eliminación gaussiana</summary>${pre(['Matriz: ' + JSON.stringify(quad.A), 'Vector: ' + JSON.stringify(quad.b), ...quad.steps])}</details><p>ŷ = ${fmt(quad.coef[0], 6)} + ${fmt(quad.coef[1], 6)}x + ${fmt(quad.coef[2], 8)}x²</p>`}`;
  const L = Number.isFinite(t) ? Lagrange.predict(data, t, m) : { error: 'Introduce una estatura objetivo.' };
  h += `<h3>Lagrange grado ${m}</h3>`;
  if (L.error) h += `<p class="msg">${L.error}</p>`;
  else {
    h += pre(L.terms.map((q, i) => `L${i}(${t}) = ${fmt(q.L, 8)}  | nodo (${q.x}, ${q.y})  | denominador = ${q.den}`)) +
      `<p>P(${t}) = Σ yᵢLᵢ = ${fmt(L.value, 4)} kg ${L.inRange ? '' : '<b class="msg">(fuera del intervalo de nodos: extrapolación, no confiable)</b>'}</p>`;
    const ref = data.find(p => p.x === t);
    if (ref) h += `<p>Peso experimental de referencia: ${ref.y} kg; error = ${fmt(ref.y - L.value)} kg</p>`;
  }
  $('procOut').innerHTML = h;
  const lo = Math.min(...x), hi = Math.max(...x), curves = [];
  if (!lin.error) curves.push({ label: 'Lineal', color: '#739912', data: Charts.curve(lin.f, lo, hi, 2) });
  if (!quad.error) curves.push({ label: 'Cuadrática', color: '#c9c9c9', data: Charts.curve(quad.f, lo, hi) });
  if (!L.error) curves.push({ label: 'Lagrange local', color: '#ffb27a', data: Charts.curve(u => Lagrange.eval(L.nodes, u), L.nodes[0].x, L.nodes.at(-1).x) });
  Charts.scatter('cReg', data, curves);
}
function showRes() {
const { lin, quad, loo, r } = R, row = (n, s) => s ? `<tr><td>${n}</td><td>${fmt(s.sse)}</td><td>${fmt(s.sy)}</td><td>${fmt(s.syx)}</td></tr>` : '';

let h = `<div class="cards"><div class="card">n<b>${data.length}</b></div><div class="card">r (Pearson)<b>${fmt(r, 6)}</b></div></div>

<h3>Regresión</h3>
<table>
<tr><th>Modelo</th><th>SSE</th><th>s_y</th><th>s_y/x</th></tr>
${row('Lineal (p=2)', lin.stats)}
${row('Cuadrática (p=3)', quad.stats)}
</table>

<h3>Lagrange local: LOOCV</h3>
<table>
<tr><th>Grado</th><th>n eval.</th><th>MAE</th><th>MSE</th><th>MAPE %</th><th>Desv. rel. %</th></tr>
${loo.map(s => `<tr><td>${s.degree}</td><td>${s.m.n}</td><td>${fmt(s.m.mae)}</td><td>${fmt(s.m.mse)}</td><td>${fmt(s.m.mape, 3)}</td><td>${fmt(s.m.sdRel, 3)}</td></tr>`).join('')}</table>`;
  const ok = loo.filter(s => s.m.n);
  const best = ok.sort((a, b) => a.m.mse - b.m.mse)[0];
  h += `<h3>Conclusión para el público general</h3>${conclusionPublica()}<h3>Conclusión técnica (para especialistas)</h3><p>Entre ${data.length} observaciones, r = ${fmt(r, 4)}. ` +
    (lin.stats ? `La regresión lineal explica R² = ${fmt(lin.stats.r2, 4)} de la variabilidad (s_y/x = ${fmt(lin.stats.syx, 3)} kg). ` : '') +
    (quad.stats ? `La cuadrática alcanza R² = ${fmt(quad.stats.r2, 4)}; un R² mayor dentro de la muestra no garantiza mejor predicción, pues tiene más parámetros. ` : '') +
    (best ? `Por LOOCV, el grado de Lagrange con menor MSE fuera de muestra es ${best.degree} (MSE = ${fmt(best.m.mse, 3)}); revisa si la diferencia con los demás es pequeña antes de declarar un ganador. ` : 'LOOCV no pudo evaluarse. ') +
    `Limitaciones: la asociación estadística no implica causalidad ni permite diagnósticos de salud, y las estimaciones fuera del rango experimental no son confiables.</p>
  <button id="expRes">Exportar resultados CSV</button> <button onclick="print()">Imprimir / PDF</button>`;
  $('resOut').innerHTML = h;
  $('expRes').onclick = () => download('resultados.csv', 'modelo,SSE,sy,syx,R2\n' +
    [['lineal', lin.stats], ['cuadratica', quad.stats]].filter(a => a[1]).map(([n, s]) => [n, s.sse, s.sy, s.syx, s.r2].join(',')).join('\n') +
    '\ngrado,MAE,MSE,MAPE,R2_fuera\n' + loo.map(s => [s.degree, s.m.mae, s.m.mse, s.m.mape, s.m.r2].join(',')).join('\n'));
  Charts.loocv('cLoo', loo);
}
render();

$('est').onclick = () => {
  const t = parseFloat($('ex').value), real = parseFloat($('ey').value), hasReal = Number.isFinite(real) && real > 0;
  if (!R) { $('indOut').innerHTML = '<p class="msg">Primero procesa los datos (apartado 1).</p>'; return; }
  if (!(t > 0)) { $('indOut').innerHTML = '<p class="msg">Escribe una estatura positiva.</p>'; return; }
  const lo = Math.min(...R.x), hi = Math.max(...R.x), rows = [];
  if (!R.lin.error) rows.push(['Regresión lineal', R.lin.f(t), '']);
  if (!R.quad.error) rows.push(['Regresión cuadrática', R.quad.f(t), '']);
  [1, 2, 3, 4].forEach(m => {
    const L = Lagrange.predict(data, t, m);
    rows.push([`Lagrange grado ${m}`, L.error ? NaN : L.value, L.error || (L.inRange ? '' : 'fuera del intervalo de nodos: no confiable')]);
  });
  let h = (t < lo || t > hi) ? `<p class="msg">Aviso: ${t} cm está fuera del rango experimental (${lo}–${hi} cm); es una extrapolación poco confiable.</p>` : '';
  h += `<table><tr><th>Modelo</th><th>Peso estimado (kg)</th>${hasReal ? '<th>Error (real − estimado)</th>' : ''}<th>Nota</th></tr>` +
    rows.map(r => `<tr><td>${r[0]}</td><td>${fmt(r[1], 2)}</td>${hasReal ? `<td>${fmt(real - r[1], 2)}</td>` : ''}<td>${r[2]}</td></tr>`).join('') + '</table>' +
    '<p>Estas estimaciones son valores aproximados, no diagnósticos de salud.</p>';
  $('indOut').innerHTML = h;
};

function conclusionPublica() {
  const { lin, quad, loo, r } = R, n = data.length, out = [];
  const fuerza = Math.abs(r) >= 0.8 ? 'fuerte' : Math.abs(r) >= 0.5 ? 'moderada' : 'débil';
  if (!Number.isFinite(r)) out.push('No fue posible medir la relación entre estatura y peso con estos datos.');
  else if (r > 0) out.push(`Con los datos de ${n} personas se observa que, en general, <b>a mayor estatura, mayor peso</b>. Esta relación es <b>${fuerza}</b>.`);
  else out.push(`Con los datos de ${n} personas, el peso tiende a <b>bajar</b> cuando sube la estatura (relación ${fuerza}). Es un resultado poco habitual; conviene revisar los datos.`);
  if (!lin.error) {
    const d = lin.coef[1] * 10;
    out.push(`Según una línea recta que resume los datos, por cada 10 cm más de estatura el peso ${d >= 0 ? 'aumenta' : 'disminuye'} en promedio unos <b>${fmt(Math.abs(d), 1)} kg</b>.`);
    out.push(`La estatura explica cerca del <b>${fmt(lin.stats.r2 * 100, 0)} %</b> de las diferencias de peso entre estas personas; el resto depende de otros factores (contextura, edad, hábitos). Al estimar el peso de alguien, el error típico es de unos <b>${fmt(lin.stats.syx, 1)} kg</b>.`);
  }
  if (!lin.error && !quad.error) {
    out.push(quad.stats.r2 - lin.stats.r2 < 0.01
      ? 'Usar una curva en lugar de una recta casi no mejora el resultado, así que la recta es suficiente y más fácil de entender.'
      : 'Una curva se ajusta un poco mejor que la recta, aunque es más difícil de interpretar.');
  }
  const best = loo.filter(s => s.m.n).sort((x, y) => x.m.mse - y.m.mse)[0];
  if (best) out.push(`Para comprobar qué tan bien se puede estimar el peso de alguien "nuevo", se ocultó a cada persona y se estimó su peso con las demás. El método de interpolación más preciso fue el de <b>grado ${best.degree}</b>, con un error promedio de unos <b>${fmt(best.m.mae, 1)} kg</b>.`);
  out.push(`<b>Importante:</b> son aproximaciones, no valores exactos. No sirven para diagnosticar la salud de nadie ni para estaturas fuera del rango medido (${Math.min(...R.x)}–${Math.max(...R.x)} cm), y que dos cosas vayan juntas no significa que una cause la otra.`);
  return '<div class="pub">' + out.map(t => `<p>${t}</p>`).join('') + '</div>';
}
