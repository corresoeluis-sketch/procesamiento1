if (typeof Chart !== 'undefined') { Chart.defaults.color = '#c9c9c9'; Chart.defaults.borderColor = '#3b3b3b'; }
const Charts = {
  inst: {},
  draw(id, cfg) {
    if (Charts.inst[id]) Charts.inst[id].destroy();
    if (typeof Chart === 'undefined') return;
    Charts.inst[id] = new Chart(document.getElementById(id), cfg);
  },
  axes: () => ({ x: { title: { display: true, text: 'Estatura (cm)' } }, y: { title: { display: true, text: 'Peso (kg)' } } }),
  scatter(id, pts, curves = []) {
    const ds = [{ type: 'scatter', label: 'Observaciones', data: pts.map(p => ({ x: p.x, y: p.y })), backgroundColor: '#FF5900' }];
    curves.forEach(c => ds.push({ type: 'line', label: c.label, data: c.data, borderColor: c.color, pointRadius: 0, fill: false }));
    Charts.draw(id, { data: { datasets: ds }, options: { scales: Object.assign(Charts.axes(), { x: { type: 'linear', title: { display: true, text: 'Estatura (cm)' } } }) } });
  },
  curve(f, lo, hi, n = 60) {
    return Array.from({ length: n + 1 }, (_, i) => { const x = lo + (hi - lo) * i / n; return { x, y: f(x) }; });
  },
  loocv(id, series) {
    const col = ['#FF5900', '#739912', '#c9c9c9', '#ffb27a'];
    Charts.draw(id, { type: 'scatter', data: { datasets: series.map((s, i) => ({ label: 'Grado ' + s.degree, data: s.rows.filter(r => Number.isFinite(r.yh)).map(r => ({ x: r.x, y: r.y - r.yh })), backgroundColor: col[i] })) },
      options: { scales: { x: { title: { display: true, text: 'Estatura (cm)' } }, y: { title: { display: true, text: 'Error LOOCV (kg)' } } } } });
  }
};
