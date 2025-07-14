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
function linkElement(elt) {
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

        // TODO: add the line
        line.remove();
        line = null;

        const endElement = document.elementFromPoint(e.clientX, e.clientY);
        if (endElement.tagName !== "LI")
            return;

        const isInput = start.dataset.type === "input";
        line = new LeaderLine(start, endElement, {
            color: 'white',
            startPlug: 'disc',
            endPlug: 'disc',
            startSocket: isInput ? 'left' : 'right',
            endSocket: isInput ? 'right' : 'left'
        });

        console.log(start.dataset.parent);
        console.log(endElement.dataset.parent);
        const startNode = allNodes.find(node => node.id == start.dataset.parent);
        const endNode = allNodes.find(node => node.id == endElement.dataset.parent);

        startNode.links.push(line);
        endNode.links.push(line);
    }
}

// Redraw method. Called on each input change.
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

        html += `<li data-type="input" data-parent="${id}"><span class="node-item">${attrib["name"]} ${input}</span></li>`
    }

    html += `</ul>`;

    if (attributes["outputs"] != null)
    {
        html += `<ul class="node-out">`
        for (let out of attributes["outputs"])
            html += `<li data-type="output" data-parent="${id}">${out}</li>`;
        html += `</ul>`;
    }

    html += `</div>`;

    container.innerHTML += html;

    const out = {
        id: id,
        attrib_ids: attribIds,
        attrib_links: attribLinks,
        links: [] // List of LeaderLine objects
    }
    allNodes.push(out);

    for (let node of allNodes)
    {
        const nodeDom = document.getElementById(`node-${node.id}`);
        dragElement(node, nodeDom);

        const inputs = nodeDom.querySelectorAll("input");
        inputs.forEach(input => input.addEventListener("change", () => updateShaderCode(redrawCallback)));

        const elts = nodeDom.querySelectorAll("li");
        console.log(elts);
        elts.forEach(elt => linkElement(elt));
    }

    id++;
    return out;
}

// Canvas init. Adds the output node and setup contextmenu event listeners.
export function initCanvas(redrawCallback) {
    const x = container.clientWidth / 2;
    const y = container.clientHeight / 2 - 100;
    outputNode = addNode("Output", x, y, redrawCallback);
    const tex = addNode("Texture", x - 500, y, redrawCallback);

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
