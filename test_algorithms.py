import unittest
from regression import linear, quadratic, gauss
from lagrange import nodes, evaluate, predict
from validation import loocv

class T(unittest.TestCase):
    def test_linear(self):
        a0, a1 = linear([1, 2, 3, 4], [3, 5, 7, 9]); self.assertAlmostEqual(a0, 1); self.assertAlmostEqual(a1, 2)
    def test_quadratic(self):
        x = [1, 2, 3, 4, 5]; c = quadratic(x, [2 - 3*v + 0.5*v*v for v in x])
        for a, b in zip(c, [2, -3, 0.5]): self.assertAlmostEqual(a, b, places=8)
    def test_gauss(self):
        s = gauss([[2, 1], [1, 3]], [5, 10]); self.assertAlmostEqual(s[0], 1); self.assertAlmostEqual(s[1], 3)
    def test_singular(self):
        with self.assertRaises(ValueError): gauss([[1, 2], [2, 4]], [1, 2])
    def test_lagrange_nodes(self):
        pts = [(1, 2), (2, 5), (3, 10), (4, 17), (5, 26)]
        for x, y in pts: self.assertAlmostEqual(predict(pts, x, 2), y)
        self.assertAlmostEqual(predict(pts, 2.5, 2), 2.5**2 + 1)
    def test_duplicates(self):
        self.assertEqual(len(nodes([(1, 1), (1, 2), (2, 3)], 1.5, 1)), 2)
        self.assertIsNone(nodes([(1, 1), (1, 2)], 1, 1))
    def test_loocv_no_leak(self):
        pts = [(float(i), float(i*i)) for i in range(1, 8)]
        self.assertAlmostEqual(loocv(pts, 2)[3][2], 16.0)

if __name__ == '__main__': unittest.main()
