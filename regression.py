"""Regresión lineal y cuadrática por mínimos cuadrados (solo biblioteca estándar)."""
import math

def sums(x, y):
    return dict(n=len(x), x=sum(x), y=sum(y), x2=sum(a*a for a in x), xy=sum(a*b for a, b in zip(x, y)),
                x3=sum(a**3 for a in x), x4=sum(a**4 for a in x), x2y=sum(a*a*b for a, b in zip(x, y)))

def linear(x, y):
    s = sums(x, y); den = s['n']*s['x2'] - s['x']**2
    if abs(den) < 1e-12: raise ValueError('Estaturas todas iguales')
    a1 = (s['n']*s['xy'] - s['x']*s['y'])/den
    return s['y']/s['n'] - a1*s['x']/s['n'], a1

def gauss(A, b):
    n = len(b); M = [list(r)+[b[i]] for i, r in enumerate(A)]
    scale = max(abs(v) for r in A for v in r)
    for k in range(n):
        p = max(range(k, n), key=lambda i: abs(M[i][k]))
        if abs(M[p][k]) < 1e-12*scale: raise ValueError('Matriz singular')
        M[k], M[p] = M[p], M[k]
        for i in range(k+1, n):
            m = M[i][k]/M[k][k]
            M[i] = [M[i][j] - m*M[k][j] for j in range(n+1)]
    sol = [0.0]*n
    for i in range(n-1, -1, -1):
        sol[i] = (M[i][n] - sum(M[i][j]*sol[j] for j in range(i+1, n)))/M[i][i]
    return sol

def quadratic(x, y):
    s = sums(x, y)
    return gauss([[s['n'], s['x'], s['x2']], [s['x'], s['x2'], s['x3']], [s['x2'], s['x3'], s['x4']]],
                 [s['y'], s['xy'], s['x2y']])

def fit_stats(y, yh, p):
    n = len(y); m = sum(y)/n
    sse = sum((a-b)**2 for a, b in zip(y, yh)); sst = sum((a-m)**2 for a in y)
    return dict(sse=sse, sst=sst, sy=math.sqrt(sst/(n-1)), syx=math.sqrt(sse/(n-p)), r2=1-sse/sst if sst else None)
