import { generateShaderCode } from "./code_emission";
import { nodeSpecs } from "./nodes";

import LeaderLine from "leader-line-new";

const container = document.getElementById("node-canvas");
const contextMenu = document.getElementById("add-panel");
let id = 0;

let outputNode = undefined;
const allNodes = [];

const shaderOutput = document.getElementById("code-output");

// Util used to make a node draggable. Node is the node specification, elmnt the
// associated dom element.
function dragElement(node, elmnt) {
    var pos1 = 0,
        pos2 = 0,
        pos3 = 0,
        pos4 = 0;

    const title = elmnt.querySelector('.node-title');
    title.onmousedown = dragMouseDown;

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

        for (let link of node.links)
            link.position();
    }
    function closeDragElement() {
        /* stop moving when mouse button is released:*/
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// Util to make an element create a line on drag.
function linkElement(elt, redrawCallback) {
    let line = null;
    let start = null;

    elt.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        if (e.target.tagName !== "LI")
            return;

        e.preventDefault();

        start = e.target;
        const end = LeaderLine.pointAnchor({x: e.clientX, y: e.clientY})

        const isInput = start.dataset.type === "input";
        line = new LeaderLine(start, end, { color: 'white', startPlug: 'disc', endPlug: 'disc', startSocket: isInput ? 'left' : 'right' });

        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();

        line.remove();

        const end = LeaderLine.pointAnchor({ x: e.clientX, y: e.clientY });
        const isInput = start.dataset.type === "input";
        line = new LeaderLine(start, end, { color: 'white', startPlug: 'disc', endPlug: 'disc', startSocket: isInput ? 'left' : 'right' });
    }

    function closeDragElement(e) {
        document.onmouseup = null;
        document.onmousemove = null;

        line.remove();
        line = null;

        let endElement = document.elementFromPoint(e.clientX, e.clientY);
        if (endElement.tagName !== "LI")
            return;

        if (endElement.dataset.parent === start.dataset.parent)
            return;

        const isInput = start.dataset.type === "input";
        const isEndInput = endElement.dataset.type === "input";

        if (isInput === isEndInput)
            return;

        if (!isInput) {
            const tmp = start;
            start = endElement;
            endElement = tmp;
        }

        line = new LeaderLine(start, endElement, {
            color: 'white',
            startPlug: 'disc',
            endPlug: 'disc',
            startSocket: 'left',
            endSocket: 'right'
        });

        const startNode = allNodes.find(node => node.id == start.dataset.parent);
        const endNode = allNodes.find(node => node.id == endElement.dataset.parent);

        const attribs = start.dataset.inputId.split('-');
        const fieldName = attribs.slice(2).join('-');

        startNode.links.push(line);
        endNode.links.push(line);

        startNode.attrib_links[fieldName] = endNode;

        // Hide input as we no longer use its value for display.
        const startInput = document.getElementById(start.dataset.inputId);
        startInput.style.opacity = 0;
        startInput.style.pointerEvents = "none";

        redrawCallback();
    }
}

// Build the dom element for a node input field.
function buildInputField(id, type, default_value) {
    switch (type) {
        case "colorramp":
            return `<div id=${id} class="node-input colorramp" data-type="${type}">
                  <div style="padding: 0;display: flex;justify-content: space-between;gap: 10px;margin: 10px 0;">
                    <input type="color" value="${default_value[0]}" class="colorramp-left" />
                    <input type="color" value="${default_value[1]}" class="colorramp-right" />
                  </div>
                  <div class="colorramp-preview" style="background: linear-gradient(0.25turn, ${default_value[0]}, ${default_value[1]});"></div>
                </div>`;
        case "number":
            return `<input id="${id}" type="range" value=${default_value} min="0" max="1" step="0.01" class="node-input" data-type="${type}"/>
                <label for="${id}">${default_value}</label>`;
        case "none":
            return "";
        default:
            return `<input id="${id}" type="${type}" value="${default_value}" class="node-input" data-type="${type}" />`;
    }
}

// Bind event callback for click events. Takes the node input to bind, input type
// and scene redraw callback
function nodeInputCallback(node, type, redrawCallback) {
    switch (type)
    {
        case "colorramp":
            const firstColor = node.querySelector('.colorramp-left');
            const secondColor = node.querySelector('.colorramp-right');
            const preview = node.querySelector('.colorramp-preview');

            node.addEventListener("change", () => {
                preview.style.background = `linear-gradient(0.25turn, ${firstColor.value}, ${secondColor.value})`;
                redrawCallback();
            });
            break;
        case "number":
            const label = node.labels[0];
            node.addEventListener("input", () => {
                label.innerText = node.value;
                redrawCallback();
            });
            break;
        case "none":
            break;
        default:
            node.addEventListener("change", redrawCallback);
            break;
    }
}

function addNode(name, x, y, redrawCallback) {
    let html = `<div id="node-${id}" class="node" style="left: ${x}px; top: ${y}px">
        <p class="node-title">${name}</p>`;

    const attributes = nodeSpecs[name]
    const attribIds = [] // id of each input/output elt.
    const attribLinks = {} // id of block linked to the input. null by default.

    if (attributes["inputs"] != null)
    {
        html += `<ul>`;

        for (let attrib of attributes["inputs"]) {
            const attribMini = attrib["name"].replace(/\s+/g, '-').toLowerCase();
            const attribId = `node-${id}-${attribMini}`; 
            attribIds.push(attribId);
            attribLinks[attribMini] = null;

            const input = buildInputField(attribId, attrib.value_type, attrib.default_value);

            html += `<li data-type="input" data-parent="${id}" data-input-id="${attribId}"><span class="node-item">${attrib["name"]} ${input}</span></li>`
        }

        html += `</ul>`;
    }

    if (attributes["outputs"] != null)
    {
        html += `<ul class="node-out">`
        for (let out of attributes["outputs"]) {
            let input = "";

            const attribId = `node-${id}-${out["name"].replace(/\s+/g, '-').toLowerCase()}`; 
            attribIds.push(attribId);

            if (out.show_out)
                input = buildInputField(attribId, out.value_type, out.default_value);
            html += `<li data-type="output" data-parent="${id}" data-input-id="${attribId}"><span class="node-item">${out.name} ${input}</span></li>`;
        }
        html += `</ul>`;
    }

    html += `</div>`;

    container.innerHTML += html;

    const out = {
        id: id,
        type: name,
        attrib_ids: attribIds,
        attrib_links: attribLinks,
        links: [] // List of LeaderLine objects
    }
    allNodes.push(out);

    for (let node of allNodes)
    {
        const nodeDom = document.getElementById(`node-${node.id}`);
        dragElement(node, nodeDom);

        const inputs = nodeDom.querySelectorAll(".node-input");
        inputs.forEach(input => nodeInputCallback(input, input.dataset.type, redrawCallback));

        const elts = nodeDom.querySelectorAll("li");
        elts.forEach(elt => linkElement(elt, redrawCallback));
    }

    id++;
    return out;
}


// Redraw method. Called on each input change.
function updateShaderCode(redrawCallback) {
    const content = generateShaderCode(outputNode);
    shaderOutput.innerText = content;
    redrawCallback();
}

// Canvas init. Adds the output node and setup contextmenu event listeners.
export function initCanvas(redrawCallback) {
    const x = container.clientWidth / 2 + 100;
    const y = container.clientHeight / 2 - 100;
    outputNode = addNode("Output", x, y, redrawCallback);
    addNode("ColorRamp", x - 500, y - 100, () => updateShaderCode(redrawCallback));

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
