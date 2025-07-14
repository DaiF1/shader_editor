function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: (parseInt(result[1], 16) / 255).toFixed(2),
    g: (parseInt(result[2], 16) / 255).toFixed(2),
    b: (parseInt(result[3], 16) / 255).toFixed(2)
  } : null;
}

let var_count = 0;

function emitOutput(node) {
    const colorValue = hexToRgb(document.getElementById(node.attrib_ids[0]).value);

    let color = `vec4(${colorValue.r}, ${colorValue.g}, ${colorValue.b}, 1.0);`;
    let shaderChildren = "";

    if (node.attrib_links['out-color'])
        [shaderChildren, color] = emitNode(node.attrib_links['out-color']);

    const shaderContent = `  out_color = ${color};\n`
    return [shaderChildren + shaderContent, ""];
}

function emitColorRamp(node) {
    const nodeElt = document.getElementById(`node-${node.id}`);
    const startElt = nodeElt.querySelector('.colorramp-left');
    const endElt = nodeElt.querySelector('.colorramp-right');
    const weightElt = document.getElementById(`node-${node.id}-value`);

    const startColor = hexToRgb(startElt.value);
    const endColor = hexToRgb(endElt.value);
    const weight = parseFloat(weightElt.value).toFixed(2);

    const startVal = `start_${var_count++}`;
    const endVal = `end_${var_count++}`;
    const weightVal = `weight_${var_count++}`;
    const outVal = `color_${var_count++}`;

    let shaderContent = `  vec4 ${startVal} = vec4(${startColor.r}, ${startColor.g}, ${startColor.b}, 1.0);\n`;
    shaderContent += `  vec4 ${endVal} = vec4(${endColor.r}, ${endColor.g}, ${endColor.b}, 1.0);\n`;

    shaderContent += `  float ${weightVal} = ${weight};\n`;
    shaderContent += `  vec4 ${outVal} = mix(${startVal}, ${endVal}, ${weightVal});\n`;

    return [shaderContent, outVal];
}

function emitNode(node) {
    switch (node.type)
    {
        case "Output":
            return emitOutput(node);
        case "ColorRamp":
            return emitColorRamp(node);
    }
}

export function generateShaderCode(rootNode) {
    var_count = 0;

    let content = `#version 300 es

precision mediump float;

out vec4 out_color;

void main() {\n`

    const [emitContent, _] = emitNode(rootNode);
    content += emitContent;
    content += `}`;

    return content;
}
