import { generateTextureHeader } from "./texture_manager";

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: (parseInt(result[1], 16) / 255).toFixed(2),
    g: (parseInt(result[2], 16) / 255).toFixed(2),
    b: (parseInt(result[3], 16) / 255).toFixed(2)
  } : null;
}

// NOTE: visitor design pattern seemed overkill at first, but might be a good
// idea to implement if the system grows too much.

let var_count = 0;

function emitOutput(node) {
    const colorValue = hexToRgb(document.getElementById(node.attrib_ids[0]).value);

    let color = `vec4(${colorValue.r}, ${colorValue.g}, ${colorValue.b}, 1.0);`;
    let shaderChildren = "";

    if (node.attrib_links['out-color']) {
        let res = emitNode(node.attrib_links['out-color']);
        shaderChildren = res.content;
        color = res.value;
    }

    const shaderContent = `  out_color = vec4(${color});\n`
    return {
        content: shaderChildren + shaderContent,
        value: "",
    };
}

function emitColorRamp(node) {
    const nodeElt = document.getElementById(`node-${node.id}`);
    const startElt = nodeElt.querySelector('.colorramp-left');
    const endElt = nodeElt.querySelector('.colorramp-right');
    const weightElt = document.getElementById(`node-${node.id}-value-input`);

    const startColor = hexToRgb(startElt.value);
    const endColor = hexToRgb(endElt.value);

    let weight = parseFloat(weightElt.value).toFixed(2);
    let shaderChildren = "";
    if (node.attrib_links['value']) {
        let res = emitNode(node.attrib_links['value']);
        shaderChildren = res.content;
        weight = res.value;
    }

    const startVal = `start_${var_count++}`;
    const endVal = `end_${var_count++}`;
    const weightVal = `weight_${var_count++}`;
    const outVal = `color_${var_count++}`;

    let shaderContent = `  vec4 ${startVal} = vec4(${startColor.r}, ${startColor.g}, ${startColor.b}, 1.0);\n`;
    shaderContent += `  vec4 ${endVal} = vec4(${endColor.r}, ${endColor.g}, ${endColor.b}, 1.0);\n`;

    shaderContent += `  float ${weightVal} = float(${weight});\n`;
    shaderContent += `  vec4 ${outVal} = vec4(mix(${startVal}, ${endVal}, ${weightVal}));\n`;

    return {
        content: shaderChildren + shaderContent,
        value: outVal,
    };
}

function emitValue(node) {
    const valueElt = document.getElementById(`node-${node.id}-value-input`);
    const value = parseFloat(valueElt.value).toFixed(2);

    const valName = `val_${var_count++}`;
    const shaderContent = `  float ${valName} = ${value};\n`;
    return {
        content: shaderContent,
        value: valName,
    };
}

function emitTexture(node) {
    const nodeInput = document.getElementById(`node-${node.id}-image-file`);
    const textureName = `u_tex${nodeInput.dataset.textureid}`;

    const valName = `color_${var_count++}`;
    const shaderContent = `  vec4 ${valName} = texture(${textureName}, v_UV);\n`;

    return {
        content: shaderContent,
        value: valName,
    }
}

function emitNode(node) {
    switch (node.type)
    {
        case "Output":
            return emitOutput(node);
        case "ColorRamp":
            return emitColorRamp(node);
        case "Value":
            return emitValue(node);
        case "Texture":
            return emitTexture(node);
    }
}

export function generateShaderCode(rootNode) {
    var_count = 0;

    const code = emitNode(rootNode);
    let content = `#version 300 es
precision mediump float;

${generateTextureHeader()}
out vec4 out_color;

void main() {
${code.content}}`;

    return content;
}
