"""Planning fixture checks only; no image/artistic/runtime validation is claimed."""
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]

class HybridArtPlanningExample(unittest.TestCase):
    def setUp(self):
        self.doc = json.loads((ROOT / 'references/hybrid-art/asset-manifest.example.json').read_text())
        self.layers = {x['id']: x for x in self.doc['layers']}

    def test_example_cannot_masquerade_as_measured_assets(self):
        self.assertEqual(self.doc['status'], 'planned')
        for layer in self.layers.values():
            self.assertEqual(layer['status'], 'planned')
            self.assertIsNone(layer['sha256'])
            self.assertIsNone(layer['alpha_measured_range'])
            if layer['file']:
                p = Path(layer['file'])
                self.assertFalse(p.is_absolute())
                self.assertNotIn('..', p.parts)
        self.assertFalse(self.doc['camera_plan']['overscan_verified'])

    def test_contact_anchors_register_to_same_world_point(self):
        def point(layer, name):
            x, y = layer['anchors_local_px'][name]
            a, b, c, d, tx, ty = layer['local_to_world']
            return a*x+c*y+tx, b*x+d*y+ty
        for contact in self.doc['contacts']:
            self.assertEqual(point(self.layers[contact['actor']], contact['actor_anchor']),
                             point(self.layers[contact['target']], contact['target_anchor']))
            self.assertIsNone(contact['event_time_seconds'])

    def test_no_baked_dynamic_duplicates_and_foreground_order(self):
        excluded = set(self.doc['clean_plate_excludes'])
        self.assertTrue(excluded <= self.layers.keys())
        for layer in self.layers.values():
            if layer['role'] in ('dynamic-object', 'independent-actor', 'occluder'):
                self.assertIn(layer['id'], excluded)
                self.assertTrue(layer['alpha_required'])
        self.assertGreater(self.layers['foreground']['draw_order'], self.layers['actor']['draw_order'])
        self.assertEqual(len({x['draw_order'] for x in self.layers.values()}), len(self.layers))

    def test_geometry_bounds_and_safe_frame(self):
        for layer in self.layers.values():
            w, h = layer['pixel_size']
            for x, y in layer['anchors_local_px'].values():
                self.assertTrue(0 <= x <= w and 0 <= y <= h)
        x, y, w, h = self.doc['camera_plan']['safe_frame_xywh']
        self.assertTrue(x >= 0 and y >= 0 and w > 0 and h > 0)
        self.assertLessEqual(x+w, self.doc['output']['width'])
        self.assertLessEqual(y+h, self.doc['output']['height'])

if __name__ == '__main__':
    unittest.main()
