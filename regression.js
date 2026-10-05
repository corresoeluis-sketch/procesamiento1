// Regresión lineal y cuadrática por mínimos cuadrados (con registro de pasos)
const Regression = {
  sums(x, y) {
    const S = { n: x.length, x: 0, y: 0, x2: 0, xy: 0, x3: 0, x4: 0, x2y: 0 };
    for (let i = 0; i < x.length; i++) {
      const a = x[i], b = y[i];
      S.x += a; S.y += b; S.x2 += a*a; S.xy += a*b; S.x3 += a**3; S.x4 += a**4; S.x2y += a*a*b;
    }
    return S;
  },
  linear(x, y) {
    const S = Regression.sums(x, y), n = S.n, steps = [];
    const den = n * S.x2 - S.x ** 2;
    if (!Number.isFinite(den) || Math.abs(den) < 1e-12) return { error: 'Denominador nulo: todas las estaturas son iguales.' };
    const a1 = (n * S.xy - S.x * S.y) / den;
    const xm = S.x / n, ym = S.y / n, a0 = ym - a1 * xm;
    steps.push(`Sumas: n=${n}, Σx=${S.x}, Σy=${S.y}, Σx²=${S.x2}, Σxy=${S.xy}`);
    steps.push(`a₁ = [nΣxy − ΣxΣy] / [nΣx² − (Σx)²] = [${n}·${S.xy} − ${S.x}·${S.y}] / [${n}·${S.x2} − ${S.x}²] = ${n*S.xy - S.x*S.y} / ${den} = ${a1}`);
    steps.push(`x̄ = ${xm},  ȳ = ${ym}`);
    steps.push(`a₀ = ȳ − a₁x̄ = ${ym} − ${a1}·${xm} = ${a0}`);
    const f = t => a0 + a1 * t;
    const yh = x.map(f), res = y.map((v, i) => v - yh[i]);
    return { coef: [a0, a1], f, yh, res, steps, S, stats: Stats.fit(y, yh, 2) };
  },
  // Eliminación gaussiana con pivoteo parcial; devuelve solución y bitácora
  gauss(A, b) {
    const n = b.length, M = A.map((r, i) => [...r, b[i]]), log = [];
    if (M.some(r => r.length !== n + 1)) return { error: 'Dimensiones inconsistentes.' };
    const scale = Math.max(...A.flat().map(Math.abs));
    for (let k = 0; k < n; k++) {
      let p = k;
      for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
      if (Math.abs(M[p][k]) < 1e-12 * scale) return { error: 'Matriz singular o mal condicionada.', log };
      if (p !== k) { [M[p], M[k]] = [M[k], M[p]]; log.push(`Intercambio F${k+1} ↔ F${p+1}`); }
      log.push(`Pivote ${k+1}: ${M[k][k]}`);
      for (let i = k + 1; i < n; i++) {
        const m = M[i][k] / M[k][k];
        for (let j = k; j <= n; j++) M[i][j] -= m * M[k][j];
        log.push(`F${i+1} ← F${i+1} − (${m})·F${k+1}  →  [${M[i].join(', ')}]`);
      }
    }
    const sol = Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      let s = M[i][n];
      for (let j = i + 1; j < n; j++) s -= M[i][j] * sol[j];
      sol[i] = s / M[i][i];
      log.push(`a${i} = ${sol[i]}`);
    }
    if (sol.some(v => !Number.isFinite(v))) return { error: 'Solución no finita.', log };
    return { sol, log };
  },
  quadratic(x, y) {
    const S = Regression.sums(x, y);
    const A = [[S.n, S.x, S.x2], [S.x, S.x2, S.x3], [S.x2, S.x3, S.x4]], b = [S.y, S.xy, S.x2y];
    const g = Regression.gauss(A, b);
    if (g.error) return { error: g.error, steps: g.log };
    const [a0, a1, a2] = g.sol, f = t => a0 + a1 * t + a2 * t * t;
    const yh = x.map(f), res = y.map((v, i) => v - yh[i]);
    return { coef: g.sol, f, yh, res, A, b, steps: g.log, S, stats: Stats.fit(y, yh, 3) };
  }
};
