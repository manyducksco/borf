import { readable, ref, writable, cond, computed } from "@borf/browser";
import { select, mouse } from "d3-selection";
import { scaleLinear, interpolateViridis } from "d3-scale";
import { ExampleFrame } from "../views/ExampleFrame";

const deg = (radians) => radians * (180 / Math.PI);

export default function BorfFractals(props, ctx) {
  const baseSize = 80;
  const realMax = 8; // original benchmark uses 11 but borf's performance is horrific in this test
  const svg = {
    width: 1280,
    height: 600,
  };

  const $$currentMax = writable(0);
  const $$heightFactor = writable(0);
  const $$lean = writable(0);

  const svgRef = ref();

  let running = false;

  function next() {
    if ($$currentMax.get() < realMax) {
      $$currentMax.update((n) => n + 1);
      setTimeout(next, 500);
    }
  }

  function onMouseMove() {
    if (running) return;
    running = true;

    const [x, y] = mouse(svgRef.current);
    const scaleFactor = scaleLinear().domain([svg.height, 0]).range([0, 0.8]);
    const scaleLean = scaleLinear()
      .domain([0, svg.width / 2, svg.width])
      .range([0.5, 0, -0.5]);

    $$heightFactor.set(scaleFactor(y));
    $$lean.set(scaleLean(x));

    running = false;
  }

  ctx.onConnected(() => {
    select(svgRef.current).on("mousemove", onMouseMove);
    next();
  });

  return (
    <ExampleFrame title="Borf Fractals">
      <svg
        width={svg.width}
        height={svg.height}
        ref={svgRef}
        style={{ border: "1px solid lightgray" }}
      >
        <TreeNode
          $level={readable(0)}
          $maxLevel={readable($$currentMax)}
          $heightFactor={readable($$heightFactor)}
          $lean={readable($$lean)}
          $w={readable(baseSize)}
          $x={readable(svg.width / 2 - 40)}
          $y={readable(svg.height - baseSize)}
        />
      </svg>
    </ExampleFrame>
  );
}

function TreeNode(props, ctx) {
  const { $w, $level, $maxLevel } = props;

  return cond(
    computed(
      [$level, $maxLevel, $w],
      ([level, maxLevel, w]) => level < maxLevel && w >= 1
    ),
    <Pythagoras {...props} />
  );
}

function Pythagoras(props, ctx) {
  const { $w, $x, $y, $heightFactor, $lean, $level, $maxLevel } = props;

  const $left = readable(props.left);
  const $right = readable(props.right);

  const $math = computed(
    [$w, $heightFactor, $lean],
    ([w, heightFactor, lean]) => {
      const trigH = heightFactor * w;

      return {
        nextRight: Math.sqrt(trigH ** 2 + (w * (0.5 - lean)) ** 2),
        nextLeft: Math.sqrt(trigH ** 2 + (w * (0.5 + lean)) ** 2),
        A: deg(Math.atan(trigH / ((0.5 + lean) * w))),
        B: deg(Math.atan(trigH / ((0.5 - lean) * w))),
      };
    }
  );

  const $transform = computed(
    [$w, $x, $y, $math, $left, $right],
    ([w, x, y, { A, B }, left, right]) => {
      if (left) {
        return `translate(${x} ${y}) rotate(${-A} 0 ${w})`;
      } else if (right) {
        return `translate(${x} ${y}) rotate(${B} ${w} ${w})`;
      } else {
        return `translate(${x} ${y})`;
      }
    }
  );

  const $color = computed([$level, $maxLevel], ([level, maxLevel]) =>
    interpolateViridis(level / maxLevel)
  );

  const $nextLevel = computed($level, (n) => n + 1);

  return (
    <g attributes={{ transform: $transform }}>
      <rect
        attributes={{ width: $w, height: $w, x: 0, y: 0 }}
        style={{ fill: $color }}
      />

      <TreeNode
        left
        $level={$nextLevel}
        $maxLevel={$maxLevel}
        $heightFactor={$heightFactor}
        $lean={$lean}
        $w={computed($math, ({ nextLeft }) => nextLeft)}
        $x={readable(0)}
        $y={computed($math, ({ nextLeft }) => -nextLeft)}
      />
      <TreeNode
        right
        $level={$nextLevel}
        $maxLevel={$maxLevel}
        $heightFactor={$heightFactor}
        $lean={$lean}
        $w={computed($math, ({ nextRight }) => nextRight)}
        $x={computed([$math, $w], ([{ nextRight }, w]) => w - nextRight)}
        $y={computed($math, ({ nextRight }) => -nextRight)}
      />
    </g>
  );
}
