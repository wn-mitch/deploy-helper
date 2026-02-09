# Deployment Pattern Specifications

**Coordinate System:**
- Board: 60" wide (x) × 44" tall (y)
- Origin: Top-left corner at (0, 0)
- Center: (30, 22)
- X increases left → right
- Y increases top → bottom

**Mirroring:**
All deployment zones are mirrored. Only define the **Attacker zone** - the Defender zone will be automatically mirrored across the horizontal centerline (y = 22).

**Format:**
- **Rectangle**: Position (x, y) + Width + Height
- **Polygon**: List of corner points (x, y) going clockwise

---

## 1. Tipping Point

### Attacker Zone (Blue)
- Point 1: (0, 0)
- Point 2: (12, 0)
- Point 3: (12, 22)
- Point 4: (20, 22)
- Point 5: (20, 44)
- Point 6: (0, 44)

---

## 2. Hammer and Anvil

### Attacker Zone (Blue)
Shape: Rectangle
- Position: (0, 0)
- Width: 18"
- Height: 44"

---

## 3. Sweeping Engagement

### Attacker Zone (Blue)
- Point 1: (0, 0)
- Point 2: (60, 0)
- Point 3: (60, 14)
- Point 4: (30, 14)
- Point 5: (30, 8)
- Point 6: (0, 8)

---

## 4. Dawn of War

### Attacker Zone (Blue)
Shape: Rectangle
- Position: (0, 0)
- Width: 60"
- Height: 12"

---

## 5. Crucible of Battle

### Attacker Zone (Blue)
Shape: Polygon
- Point 1: (0, 0)
- Point 2: (30, 44)
- Point 3: (0, 44)

---

## 6. Search and Destroy

### Attacker Zone (Blue)
Shape: Polygon (corner to midpoints with 9" circle exclusion)
- Point 1: (0, 22)
- Point 2: (21, 22)
- Point 3: (30, 31)
- Point 4: (30, 44)
 upd- Point 4: (0, 44)
