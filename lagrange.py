"""Interpolación local de Lagrange (grados 1-4)."""

def nodes(pts, t, m):
    seen = {}
    for p in pts: seen.setdefault(p[0], p)          # una observación por estatura
    d = sorted(seen.values(), key=lambda p: abs(p[0]-t))
    if len(d) < m+1: return None
    return sorted(d[:m+1])

def evaluate(nd, t):
    total = 0.0
    for i, (xi, yi) in enumerate(nd):
        L = 1.0
        for j, (xj, _) in enumerate(nd):
            if j != i: L *= (t-xj)/(xi-xj)
        total += yi*L
    return total

def predict(pts, t, m):
    nd = nodes(pts, t, m)
    if nd is None or not (nd[0][0] <= t <= nd[-1][0]): return None
    return evaluate(nd, t)
