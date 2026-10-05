// Estadísticos (sin redondeo interno)
const Stats = {
  sum: a => a.reduce((s, v) => s + v, 0),
  mean(a) { return Stats.sum(a) / a.length; },
  fit(y, yh, p) {
    const n = y.length, m = Stats.mean(y);
    let sse = 0, sst = 0;
    for (let i = 0; i < n; i++) { sse += (y[i] - yh[i]) ** 2; sst += (y[i] - m) ** 2; }
    return { n, p, sse, sst,
      sy: n > 1 ? Math.sqrt(sst / (n - 1)) : NaN,
      syx: n > p ? Math.sqrt(sse / (n - p)) : NaN,
      r2: sst > 0 ? 1 - sse / sst : NaN };
  },
  pearson(x, y) {
    const mx = Stats.mean(x), my = Stats.mean(y);
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < x.length; i++) { sxy += (x[i]-mx)*(y[i]-my); sxx += (x[i]-mx)**2; syy += (y[i]-my)**2; }
    return sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : NaN;
  },
  // Métricas de error fuera de muestra a partir de pares {y, yh}
  errors(rows, yAll) {
    const v = rows.filter(r => Number.isFinite(r.yh));
    const n = v.length; if (!n) return { n: 0 };
    const mse = Stats.sum(v.map(r => (r.y - r.yh) ** 2)) / n;
    const mae = Stats.sum(v.map(r => Math.abs(r.y - r.yh))) / n;
    const rel = v.filter(r => r.y !== 0).map(r => Math.abs((r.y - r.yh) / r.y) * 100);
    const mape = rel.length ? Stats.sum(rel) / rel.length : NaN;
    const sdRel = rel.length > 1 ? Math.sqrt(Stats.sum(rel.map(e => (e - mape) ** 2)) / (rel.length - 1)) : NaN;
    const my = Stats.mean(yAll);
    const sst = Stats.sum(v.map(r => (r.y - my) ** 2));
    const r2 = sst > 0 ? 1 - Stats.sum(v.map(r => (r.y - r.yh) ** 2)) / sst : NaN;
    return { n, mse, mae, mape, sdRel, r2 };
  }
};
