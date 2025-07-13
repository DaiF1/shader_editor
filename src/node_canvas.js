const container = document.getElementById("node-canvas");
const contextMenu = document.getElementById("add-panel");
let id = 0;

let outputNode = undefined;

const shaderOutput = document.getElementById("code-output");

function dragElement(elmnt) {
  var pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  elmnt.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }
  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = elmnt.offsetTop - pos2 + "px";
    elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
  }
  function closeDragElement() {
    /* stop moving when mouse button is released:*/
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function updateShaderCode(redrawCallback) {
    const color = hexToRgb(document.getElementById(outputNode.attributes[0]).value);
    let content = `#version 300 es

precision mediump float;

out vec4 out_color;

void main() {
    out_color = vec4(${color.r / 255}, ${color.g / 255}, ${color.b / 255}, 1.0);
}`;

    shaderOutput.innerText = content;

    redrawCallback();
}

function addNode(name, attributes, types, x, y, redrawCallback) {
    let html = `<div id="node-${id}" class="node" style="left: ${x}px; top: ${y}px">
        <p class="node-title">${name}</p>
        <ul>`;

    const attribIds = []
    for (let i = 0; i < attributes.length; i++) {
        const attribId = `node-${id}-${attributes[i]}`; 
        const input = `<input id="${attribId}" type="${Object.keys(types)[i]}" value="${Object.values(types)[i]}"></input>`;
        attribIds.push(attribId);
        html += `<li><span class="node-item">${attributes[i]} ${input}</span></li>`
    }

    html += `</ul></div>`;

    container.innerHTML += html;

    const nodes = container.querySelectorAll(".node");
    nodes.forEach(node => {
        dragElement(node);
        const inputs = node.querySelectorAll("input");
        inputs.forEach(input => input.addEventListener("change", () => updateShaderCode(redrawCallback)));
    });
    id++;
}

export function initCanvas(redrawCallback) {
    const x = container.clientWidth / 2;
    const y = container.clientHeight / 2 - 100;
    addNode("Output", ["Color"], {"color": "#ff007f"}, x, y, redrawCallback);

    outputNode = {
        id: 0,
        attributes: [
            "node-0-Color"
        ]
    };

    container.addEventListener('contextmenu', (event) => {
        contextMenu.style.left = `${event.clientX}px`;
        contextMenu.style.top = `${event.clientY}px`;
        contextMenu.style.display = "block";

        event.preventDefault();
    }, false);

    container.addEventListener('click', () => {
        contextMenu.style.display = "none";
    });
}
