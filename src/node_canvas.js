import { generateShaderCode } from "./code_emission";
import { nodeSpecs } from "./nodes";

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

function updateShaderCode(redrawCallback) {
    const content = generateShaderCode(outputNode);
    shaderOutput.innerText = content;
    redrawCallback();
}

function addNode(name, x, y, redrawCallback) {
    let html = `<div id="node-${id}" class="node" style="left: ${x}px; top: ${y}px">
        <p class="node-title">${name}</p>
        <ul>`;

    const attributes = nodeSpecs[name]
    const attribIds = [] // id of each input elt.
    const attribLinks = {} // id of block linked to the input. null by default.

    for (let attrib of attributes["inputs"]) {
        const attribId = `node-${id}-${attrib["name"].replace(/\s+/g, '-').toLowerCase()}`; 
        attribIds.push(attribId);
        attribLinks[attrib["name"]] = null;

        const input = `<input id="${attribId}" type="${attrib["value_type"]}" value="${attrib["default_value"]}"></input>`;

        html += `<li><span class="node-item">${attrib["name"]} ${input}</span></li>`
    }

    html += `</ul>`;

    if (attributes["outputs"] != null)
    {
        html += `<ul class="node-out">`
        for (let out of attributes["outputs"])
            html += `<li>${out}</li>`;
        html += `</ul>`;
    }

    html += `</div>`;

    container.innerHTML += html;

    const nodes = container.querySelectorAll(".node");
    nodes.forEach(node => {
        dragElement(node);
        const inputs = node.querySelectorAll("input");
        inputs.forEach(input => input.addEventListener("change", () => updateShaderCode(redrawCallback)));
    });

    const out = {
        id: id,
        attrib_ids: attribIds,
        attri_links: attribLinks,
    }

    id++;

    return out;
}

export function initCanvas(redrawCallback) {
    const x = container.clientWidth / 2;
    const y = container.clientHeight / 2 - 100;
    outputNode = addNode("Output", x, y, redrawCallback);

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
