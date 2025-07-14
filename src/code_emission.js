function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export function generateShaderCode(rootNode) {
    const color = hexToRgb(document.getElementById(rootNode.attrib_ids[0]).value);
    let content = `#version 300 es

precision mediump float;

out vec4 out_color;

void main() {
    out_color = vec4(${color.r / 255}, ${color.g / 255}, ${color.b / 255}, 1.0);
}`;

    return content;
}
