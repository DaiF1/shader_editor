import { nodeSpecs } from "./nodes";

const container = document.getElementById("node-canvas");
const contextMenu = document.getElementById("add-panel");
const addBtn = document.getElementById("add-btn");

const selectionDisplay = document.getElementById("node-selection-bg");
const selectionList = document.getElementById("selection-list");
const exitSelection = document.getElementById("exit-panel");
const selectInput = document.getElementById("filter-input");

export function initContextMenu(addNodeCallback) {
    let menuX = 0;
    let menuY = 0;

    container.addEventListener('contextmenu', (event) => {
        menuX = event.clientX;
        menuY = event.clientY;
        contextMenu.style.left = `${menuX}px`;
        contextMenu.style.top = `${menuY}px`;
        contextMenu.style.display = "block";

        event.preventDefault();
    }, false);

    container.addEventListener('click', () => {
        contextMenu.style.display = "none";
    });

    let listContent = "";
    for (let node in nodeSpecs) {
        if (node === "Output")
            continue;

        listContent += `<li>${node}</li>`;
    }
    selectionList.innerHTML = listContent;

    exitSelection.addEventListener("click", () => {
        selectionDisplay.style.display = "none";
    });

    addBtn.addEventListener("click", () => {
        selectionDisplay.style.display = "flex";
        contextMenu.style.display = "none";
    });

    const items = selectionList.querySelectorAll("li");

    items.forEach(item => item.addEventListener("click", () => {
        selectionDisplay.style.display = "none";
        addNodeCallback(item.innerText, menuX, menuY);
    }));

    selectInput.addEventListener("input", () => {
        const searchValue = selectInput.value.toUpperCase();
        for (let item of items) {
            const itemStr = item.innerText.toString().toUpperCase();
            if (itemStr.indexOf(searchValue) > -1)
                item.style.display = "";
            else
                item.style.display = "none";
        }
    });
}
