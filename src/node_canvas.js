const container = document.getElementById("node-canvas");
let id = 0;

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

function addNode(name, attributes, types, x, y) {
    let html = `<div id="node-${id}" class="node" style="left: ${x}px; top: ${y}px">
        <p class="node-title">${name}</p>
        <ul>`;
    for (let i = 0; i < attributes.length; i++)
        html += `<li><span class="node-item">${attributes[i]} <input type="${Object.keys(types)[i]}" value="${Object.values(types)[i]}"></input></span></li>`
    html += `</ul></div>`;

    container.innerHTML += html;

    const nodes = container.querySelectorAll(".node");
    nodes.forEach(node => dragElement(node));
}

export function initCanvas() {
    const x = container.clientWidth / 2;
    const y = container.clientHeight / 2 - 100;
    addNode("Output", ["Color"], {"color": "#ff007f"}, x, y);
}
