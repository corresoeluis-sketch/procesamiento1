// Interpolación local de Lagrange y LOOCV
const Lagrange = {
  // Nodos: x distintas (se conserva la primera observación de cada x), las m+1 más cercanas a t
  nodes(pts, t, m) {
    const seen = new Map();
    pts.forEach(p => { if (!seen.has(p.x)) seen.set(p.x, p); });
    const d = [...seen.values()];
    if (d.length < m + 1) return null;
    return d.sort((a, b) => Math.abs(a.x - t) - Math.abs(b.x - t)).slice(0, m + 1).sort((a, b) => a.x - b.x);
  },
  basis(nodes, i, t) {
    let L = 1;
    nodes.forEach((n, j) => { if (j !== i) L *= (t - n.x) / (nodes[i].x - n.x); });
    return L;
  },
  eval(nodes, t) { return nodes.reduce((s, n, i) => s + n.y * Lagrange.basis(nodes, i, t), 0); },
  inRange(nodes, t) { return t >= nodes[0].x && t <= nodes[nodes.length - 1].x; },
  predict(pts, t, m) {
    const nodes = Lagrange.nodes(pts, t, m);
    if (!nodes) return { error: `Se requieren ${m+1} estaturas distintas.` };
    const terms = nodes.map((n, i) => {
      let den = 1; nodes.forEach((q, j) => { if (j !== i) den *= (n.x - q.x); });
      return { x: n.x, y: n.y, den, L: Lagrange.basis(nodes, i, t) };
    });
    return { nodes, terms, value: Lagrange.eval(nodes, t), inRange: Lagrange.inRange(nodes, t) };
  },
  // LOOCV: los nodos salen solo del conjunto sin la observación de prueba
  loocv(pts, m) {
    return pts.map((p, k) => {
      const train = pts.filter((_, i) => i !== k);
      const r = Lagrange.predict(train, p.x, m);
      const ok = !r.error && r.inRange;
      return { id: p.id, x: p.x, y: p.y, yh: ok ? r.value : NaN, degree: m,
               note: r.error || (!r.inRange ? 'Fuera del intervalo de nodos' : '') };
    });
  }
};
