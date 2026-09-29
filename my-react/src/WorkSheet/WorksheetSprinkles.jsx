import { useEffect, useRef } from "react";
import rough from "roughjs/bundled/rough.esm.js";
import "./WorksheetSprinkles.css";

const COLORS = ["#6c5ce7", "#37a7e8", "#f04472", "#ffca3a", "#26b979"];
const FILL_STYLES = ["solid", "hachure", "cross-hatch", "dots"];

// Each zone is intentionally broad so the result feels scattered instead of
// snapping to repeated anchor points. The middle stays clear for game content.
const EDGE_ZONES = [
  { x: [0.015, 0.13], y: [0.08, 0.92] },
  { x: [0.87, 0.985], y: [0.08, 0.92] },
  { x: [0.12, 0.88], y: [0.02, 0.16] },
  { x: [0.12, 0.88], y: [0.84, 0.98] },
];

function hashSeed(value) {
  let hash = 2166136261;

  for (const character of String(value)) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createRandom(seed) {
  let state = seed || 1;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(values, random) {
  const result = [...values];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

function randomBetween([minimum, maximum], random) {
  return minimum + random() * (maximum - minimum);
}

function distanceBetween(first, second) {
  // Worksheet cards are usually much wider than they are tall. Weight the
  // horizontal distance so spacing feels even in actual screen pixels.
  return Math.hypot((first.x - second.x) * 1.6, first.y - second.y);
}

function createScatteredPositions(count, random) {
  const positions = [];
  const zoneOrder = shuffled(EDGE_ZONES, random);

  for (let index = 0; index < count; index += 1) {
    const zone =
      index < zoneOrder.length
        ? zoneOrder[index]
        : EDGE_ZONES[Math.floor(random() * EDGE_ZONES.length)];
    let chosenPosition = null;
    let fallbackPosition = null;
    let fallbackDistance = -1;

    for (let attempt = 0; attempt < 40; attempt += 1) {
      const candidate = {
        x: randomBetween(zone.x, random),
        y: randomBetween(zone.y, random),
      };
      const nearestDistance = positions.length
        ? Math.min(
            ...positions.map((position) =>
              distanceBetween(candidate, position)
            )
          )
        : Number.POSITIVE_INFINITY;

      if (nearestDistance > fallbackDistance) {
        fallbackPosition = candidate;
        fallbackDistance = nearestDistance;
      }

      if (nearestDistance >= 0.2) {
        chosenPosition = candidate;
        break;
      }
    }

    positions.push(chosenPosition || fallbackPosition);
  }

  return positions;
}

function polygonPoints(centerX, centerY, radius, sides, startAngle = -Math.PI / 2) {
  return Array.from({ length: sides }, (_, index) => {
    const angle = startAngle + (index * Math.PI * 2) / sides;
    return [
      centerX + Math.cos(angle) * radius,
      centerY + Math.sin(angle) * radius,
    ];
  });
}

function starPoints(centerX, centerY, radius) {
  return Array.from({ length: 10 }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI) / 5;
    const pointRadius = index % 2 === 0 ? radius : radius * 0.44;
    return [
      centerX + Math.cos(angle) * pointRadius,
      centerY + Math.sin(angle) * pointRadius,
    ];
  });
}

function sparklePoints(centerX, centerY, radius) {
  return Array.from({ length: 8 }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI) / 4;
    const pointRadius = index % 2 === 0 ? radius : radius * 0.22;
    return [
      centerX + Math.cos(angle) * pointRadius,
      centerY + Math.sin(angle) * pointRadius,
    ];
  });
}

function lightningPoints(centerX, centerY, radius) {
  return [
    [centerX + radius * 0.1, centerY - radius],
    [centerX - radius * 0.62, centerY + radius * 0.08],
    [centerX - radius * 0.08, centerY + radius * 0.02],
    [centerX - radius * 0.28, centerY + radius],
    [centerX + radius * 0.68, centerY - radius * 0.2],
    [centerX + radius * 0.12, centerY - radius * 0.1],
  ];
}

function createSvgGroup() {
  return document.createElementNS("http://www.w3.org/2000/svg", "g");
}

function drawSun(roughSvg, centerX, centerY, radius, options) {
  const group = createSvgGroup();
  const rayOptions = {
    ...options,
    fill: undefined,
    seed: options.seed + 1,
  };

  for (let index = 0; index < 8; index += 1) {
    const angle = (index * Math.PI) / 4;
    group.appendChild(
      roughSvg.line(
        centerX + Math.cos(angle) * radius * 0.72,
        centerY + Math.sin(angle) * radius * 0.72,
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius,
        { ...rayOptions, seed: rayOptions.seed + index }
      )
    );
  }

  group.appendChild(
    roughSvg.circle(centerX, centerY, radius * 1.18, {
      ...options,
      fill: "#ffca3a",
    })
  );
  return group;
}

function drawFlower(roughSvg, centerX, centerY, radius, options) {
  const group = createSvgGroup();
  const petalRadius = radius * 0.48;

  for (let index = 0; index < 6; index += 1) {
    const angle = (index * Math.PI) / 3;
    group.appendChild(
      roughSvg.circle(
        centerX + Math.cos(angle) * radius * 0.5,
        centerY + Math.sin(angle) * radius * 0.5,
        petalRadius * 1.35,
        { ...options, seed: options.seed + index + 1 }
      )
    );
  }

  group.appendChild(
    roughSvg.circle(centerX, centerY, radius * 0.72, {
      ...options,
      seed: options.seed + 7,
      fill: "#ffca3a",
      fillStyle: "solid",
    })
  );
  return group;
}

function createSprinkles(seed) {
  const numericSeed = hashSeed(seed);
  const random = createRandom(numericSeed);
  const count = 7 + Math.floor(random() * 15);
  const positions = createScatteredPositions(count, random);
  const types = shuffled(
    [
      "star",
      "circle",
      "square",
      "triangle",
      "pentagon",
      "hexagon",
      "heart",
      "sun",
      "moon",
      "flower",
      "lightning",
      "diamond",
      "sparkle",
    ],
    random
  );

  return positions.map((position, index) => ({
    x: position.x,
    y: position.y,
    type: types[index % types.length],
    size: 0.5 + random() * 1.2,
    rotation: -22 + random() * 44,
    color: COLORS[Math.floor(random() * COLORS.length)],
    fillStyle: FILL_STYLES[Math.floor(random() * FILL_STYLES.length)],
    roughSeed: ((numericSeed + index * 104729) >>> 0) || 1,
  }));
}

function drawSprinkle(roughSvg, descriptor, width, height, compact) {
  const centerX = descriptor.x * width;
  const centerY = descriptor.y * height;
  const baseSize = Math.max(18, Math.min(54, Math.min(width, height) * 0.08));
  const responsiveScale = compact ? 0.78 : 1;
  const radius = (baseSize * descriptor.size * responsiveScale) / 2;
  const options = {
    seed: descriptor.roughSeed,
    stroke: "#20345b",
    strokeWidth: 2.2,
    fill: descriptor.color,
    fillStyle: descriptor.fillStyle,
    fillWeight: 1.5,
    hachureGap: 5,
    roughness: 1.35,
    bowing: 1.15,
  };
  let shape;

  switch (descriptor.type) {
    case "circle":
      shape = roughSvg.circle(centerX, centerY, radius * 2, options);
      break;
    case "square":
      shape = roughSvg.rectangle(
        centerX - radius,
        centerY - radius,
        radius * 2,
        radius * 2,
        options
      );
      break;
    case "triangle":
      shape = roughSvg.polygon(
        polygonPoints(centerX, centerY, radius, 3),
        options
      );
      break;
    case "pentagon":
      shape = roughSvg.polygon(
        polygonPoints(centerX, centerY, radius, 5),
        options
      );
      break;
    case "hexagon":
      shape = roughSvg.polygon(
        polygonPoints(centerX, centerY, radius, 6),
        options
      );
      break;
    case "heart":
      shape = roughSvg.path(
        `M ${centerX} ${centerY + radius * 0.85}
         C ${centerX - radius * 1.3} ${centerY + radius * 0.05},
           ${centerX - radius * 0.92} ${centerY - radius * 0.92},
           ${centerX} ${centerY - radius * 0.28}
         C ${centerX + radius * 0.92} ${centerY - radius * 0.92},
           ${centerX + radius * 1.3} ${centerY + radius * 0.05},
           ${centerX} ${centerY + radius * 0.85} Z`,
        options
      );
      break;
    case "sun":
      shape = drawSun(roughSvg, centerX, centerY, radius, options);
      break;
    case "moon":
      shape = roughSvg.path(
        `M ${centerX + radius * 0.45} ${centerY - radius}
         C ${centerX - radius * 0.75} ${centerY - radius * 0.72},
           ${centerX - radius * 0.75} ${centerY + radius * 0.72},
           ${centerX + radius * 0.45} ${centerY + radius}
         C ${centerX - radius * 0.05} ${centerY + radius * 0.38},
           ${centerX - radius * 0.05} ${centerY - radius * 0.38},
           ${centerX + radius * 0.45} ${centerY - radius} Z`,
        options
      );
      break;
    case "flower":
      shape = drawFlower(roughSvg, centerX, centerY, radius, options);
      break;
    case "lightning":
      shape = roughSvg.polygon(
        lightningPoints(centerX, centerY, radius),
        { ...options, fill: "#ffca3a" }
      );
      break;
    case "diamond":
      shape = roughSvg.polygon(
        polygonPoints(centerX, centerY, radius, 4),
        options
      );
      break;
    case "sparkle":
      shape = roughSvg.polygon(
        sparklePoints(centerX, centerY, radius),
        options
      );
      break;
    default:
      shape = roughSvg.polygon(starPoints(centerX, centerY, radius), options);
  }

  shape.classList.add("worksheetSprinkleShape");
  shape.setAttribute(
    "transform",
    `rotate(${descriptor.rotation} ${centerX} ${centerY})`
  );
  return shape;
}

function WorksheetSprinkles({ seed }) {
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = svgRef.current;

    if (!svg) {
      return undefined;
    }

    const descriptors = createSprinkles(seed);
    let animationFrameId;

    function draw() {
      const width = Math.round(svg.clientWidth);
      const height = Math.round(svg.clientHeight);

      if (width < 1 || height < 1) {
        return;
      }

      svg.replaceChildren();
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

      const roughSvg = rough.svg(svg);
      const compact = width < 620;
      const visibleDescriptors = compact
        ? descriptors.slice(0, Math.min(4, descriptors.length))
        : descriptors;

      visibleDescriptors.forEach((descriptor) => {
        svg.appendChild(
          drawSprinkle(roughSvg, descriptor, width, height, compact)
        );
      });
    }

    function scheduleDraw() {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(draw);
    }

    const resizeObserver = new ResizeObserver(scheduleDraw);
    resizeObserver.observe(svg);
    scheduleDraw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      svg.replaceChildren();
    };
  }, [seed]);

  return (
    <svg
      ref={svgRef}
      className="worksheetSprinkles"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="none"
    />
  );
}

export default WorksheetSprinkles;
