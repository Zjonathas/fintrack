import math
import os
import struct
import zlib

def create_png_rgba(width, height, get_pixel_fn):
    """
    Creates a valid RGBA PNG using only standard library (zlib + struct).
    get_pixel_fn is called with (x, y, width, height) and returns (r, g, b, a).
    """
    png = b'\x89PNG\r\n\x1a\n'
    # IHDR chunk: width, height, bit_depth=8, color_type=6 (RGBA), compression=0, filter=0, interlace=0
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png += struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data + struct.pack('>I', zlib.crc32(b'IHDR' + ihdr_data))

    # Raw scanlines
    raw = bytearray()
    for y in range(height):
        raw.append(0)  # filter type: None
        for x in range(width):
            r, g, b, a = get_pixel_fn(x, y, width, height)
            raw.extend([r, g, b, a])

    compressed = zlib.compress(bytes(raw), level=6)
    png += struct.pack('>I', len(compressed)) + b'IDAT' + compressed + struct.pack('>I', zlib.crc32(b'IDAT' + compressed))

    # IEND chunk
    png += struct.pack('>I', 0) + b'IEND' + struct.pack('>I', zlib.crc32(b'IEND'))
    return png

def render_icon(x, y, w, h, maskable=False):
    # Normalized coordinates (-1.0 to 1.0)
    nx = (x / (w - 1)) * 2.0 - 1.0
    ny = (y / (h - 1)) * 2.0 - 1.0

    # Background color: #090d16
    bg_r, bg_g, bg_b = 9, 13, 22

    if not maskable:
        # Rounded corner clip: radius = 22% of dimension
        corner_r = 0.22 * 2.0
        # Check distance to corners
        dx = max(0.0, abs(nx) - (1.0 - corner_r))
        dy = max(0.0, abs(ny) - (1.0 - corner_r))
        if math.sqrt(dx*dx + dy*dy) > corner_r:
            return (0, 0, 0, 0) # transparent outside rounded rect

    # Scale factor for maskable safe zone (80% safe zone per PWA spec)
    scale = 0.65 if maskable else 0.78
    sx = nx / scale
    sy = ny / scale

    # Check if inside central card shape
    # Card is roughly from sx in [-0.75, 0.75], sy in [-0.45, 0.45]
    card_w = 0.75
    card_h = 0.45
    card_radius = 0.12

    cdx = max(0.0, abs(sx) - (card_w - card_radius))
    cdy = max(0.0, abs(sy) - (card_h - card_radius))
    dist_card = math.sqrt(cdx*cdx + cdy*cdy)

    # Check if inside coin badge (circle at bottom-right of card)
    coin_cx = 0.42
    coin_cy = 0.28
    coin_r = 0.28
    dist_coin = math.sqrt((sx - coin_cx)**2 + (sy - coin_cy)**2)

    # Coin rendering
    if dist_coin <= coin_r:
        if dist_coin > coin_r - 0.04:
            # Coin gold/emerald border
            return (52, 211, 153, 255)  # #34d399
        elif dist_coin > coin_r - 0.07:
            # Dark separator
            return (9, 13, 22, 255)
        else:
            # Coin interior with emerald gradient
            return (16, 185, 129, 255)  # #10b981

    # Card rendering
    if dist_card <= card_radius:
        # Horizontal stripe on card (sy between -0.15 and 0.0)
        if -0.18 < sy < 0.0:
            return (4, 120, 87, 255)  # #047857 (darker emerald stripe)
        # Chip on card (sx in [-0.55, -0.32], sy in [0.08, 0.28])
        elif -0.55 <= sx <= -0.32 and 0.08 <= sy <= 0.28:
            return (254, 240, 138, 255)  # #fef08a (gold chip)
        else:
            # Card gradient body
            grad = (sy + card_h) / (2 * card_h)
            r = int(52 - grad * 36)
            g = int(211 - grad * 60)
            b = int(153 - grad * 48)
            return (r, g, b, 255)

    # Background subtly glowing around center
    center_dist = math.sqrt(nx*nx + ny*ny)
    glow = max(0.0, 1.0 - center_dist / 1.1)
    gr = int(bg_r + glow * 10)
    gg = int(bg_g + glow * 40)
    gb = int(bg_b + glow * 25)
    return (gr, gg, gb, 255)

def main():
    target_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'public')
    os.makedirs(target_dir, exist_ok=True)

    icons = [
        ('icon-192.png', 192, 192, False),
        ('icon-512.png', 512, 512, False),
        ('icon-maskable-192.png', 192, 192, True),
        ('icon-maskable-512.png', 512, 512, True),
        ('apple-touch-icon.png', 180, 180, False),
    ]

    for filename, width, height, maskable in icons:
        filepath = os.path.join(target_dir, filename)
        print(f"Generating {filename} ({width}x{height}, maskable={maskable})...")
        png_data = create_png_rgba(width, height, lambda x, y, w, h: render_icon(x, y, w, h, maskable=maskable))
        with open(filepath, 'wb') as f:
            f.write(png_data)
        print(f"Saved {filepath} ({len(png_data)} bytes)")

if __name__ == '__main__':
    main()
