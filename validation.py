"""LOOCV para Lagrange local y métricas fuera de muestra."""
import math
from lagrange import predict

def loocv(pts, m):
    out = []
    for k, (x, y) in enumerate(pts):
        train = pts[:k] + pts[k+1:]            # sin fuga: el registro de prueba se excluye
        out.append((x, y, predict(train, x, m)))
    return out

def metrics(rows, y_all):
    v = [(y, yh) for _, y, yh in rows if yh is not None]
    n = len(v)
    if not n: return None
    mean = sum(y_all)/len(y_all)
    rel = [abs((y-yh)/y)*100 for y, yh in v if y != 0]
    mape = sum(rel)/len(rel) if rel else None
    sst = sum((y-mean)**2 for y, _ in v)
    return dict(n=n, mae=sum(abs(y-h) for y, h in v)/n, mse=sum((y-h)**2 for y, h in v)/n, mape=mape,
                sd_rel=math.sqrt(sum((e-mape)**2 for e in rel)/(len(rel)-1)) if rel and len(rel) > 1 else None,
                r2=1-sum((y-h)**2 for y, h in v)/sst if sst else None)
