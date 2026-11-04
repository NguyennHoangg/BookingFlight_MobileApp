/* global __dirname */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");

function setup(platform, initialStates = []) {
  const states = [...initialStates];
  const effects = [];
  const fetches = [];
  let cursor = 0;
  const dependencies = {
    react: {
      __esModule: true,
      default: React,
      useState(initial) {
        const index = cursor++;
        if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial;
        return [states[index], value => { states[index] = value; }];
      },
      useEffect: effect => effects.push(effect),
    },
    "react-native": { View: "View", Image: "Image", Platform: { OS: platform } },
    "@expo/vector-icons": { Ionicons: "Icon" },
    "react-native-svg/css": { SvgCss: "SvgCss" },
    "../../utils/svg": {
      isSvgUrl: uri => /\.svg($|\?)/i.test(uri ?? ""),
      fetchSvgXml: async uri => { fetches.push(uri); return "<svg/>"; },
      DEFAULT_IMAGE_HEADERS: { "User-Agent": "mobile" },
    },
  };
  const source = fs.readFileSync(path.join(__dirname, "../src/components/common/RemoteImage.tsx"), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React },
  });
  const exports = {};
  vm.runInNewContext(outputText, { exports, console, require: id => {
    if (!(id in dependencies)) throw new Error(`Unexpected dependency: ${id}`);
    return dependencies[id];
  } });
  return {
    effects, fetches,
    render(props) {
      cursor = 0;
      const content = exports.default(props);
      return content.type(content.props);
    },
  };
}

test("web SVG uses the browser image loader without fetching XML or sending native headers", () => {
  const runner = setup("web");
  const props = { uri: "https://images.example/logo.svg", width: 36, height: 36, alt: "Airline logo" };
  const tree = runner.render(props);
  const image = tree.props.children;
  assert.equal(image.type, "Image");
  assert.equal(image.props.source.uri, props.uri);
  assert.equal(image.props.source.headers, undefined);
  assert.equal(image.props.accessibilityLabel, props.alt);
  runner.effects.forEach(effect => effect());
  assert.equal(runner.fetches.length, 0);
  image.props.onError({ nativeEvent: { error: "404" } });
  const fallback = runner.render(props);
  assert.equal(fallback.props.children.type, "Icon");
  assert.equal(fallback.props.style[0][0].width, 36);
  assert.equal(fallback.props.style[0][0].height, 36);
});

test("native SVG keeps XML rendering and supplies a fallback for parser failures", () => {
  const runner = setup("android", ["<svg/>", false, false]);
  const tree = runner.render({ uri: "https://images.example/logo.svg" });
  const svg = tree.props.children;
  assert.equal(svg.type, "SvgCss");
  assert.equal(svg.props.xml, "<svg/>");
  assert.equal(svg.props.fallback.props.children.type, "Icon");
  assert.doesNotThrow(() => svg.props.onError(new Error("Invalid SVG")));
});
