import "./style.css"
import { m4 } from "./matrix";
import { initCanvas } from "./node_canvas";

const vertexSrc = `#version 300 es

in vec4 a_position;

uniform mat4 u_matrix;

void main() {
    gl_Position = u_matrix * a_position;
}`

const canvas = document.getElementById('shader-output');
const gl = canvas.getContext('webgl2');
const fragmentElt = document.getElementById('code-output');

const reload_btn = document.getElementById('reload');

// Utils that create a webgl shader.
function createShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }

    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

// Builds a program using the content of elt id=code as fragment source and
// vertexSrc for its vertex source.
function buildProgram() {
    const fragmentSrc = fragmentElt.innerText;
    const vertexShader = createShader(gl.VERTEX_SHADER, vertexSrc);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentSrc);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }

    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

// Builds a cube vao for the given program. The program must have a a_position
// attribute in its vertex shader.
function getObjVAO(program) {
    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    const positionBuffer = gl.createBuffer();

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(positionAttributeLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const positions = [
        -0.5, -0.5,  -0.5,
        -0.5,  0.5,  -0.5,
         0.5, -0.5,  -0.5,
        -0.5,  0.5,  -0.5,
         0.5,  0.5,  -0.5,
         0.5, -0.5,  -0.5,

        -0.5, -0.5,   0.5,
         0.5, -0.5,   0.5,
        -0.5,  0.5,   0.5,
        -0.5,  0.5,   0.5,
         0.5, -0.5,   0.5,
         0.5,  0.5,   0.5,

        -0.5,   0.5, -0.5,
        -0.5,   0.5,  0.5,
         0.5,   0.5, -0.5,
        -0.5,   0.5,  0.5,
         0.5,   0.5,  0.5,
         0.5,   0.5, -0.5,

        -0.5,  -0.5, -0.5,
         0.5,  -0.5, -0.5,
        -0.5,  -0.5,  0.5,
        -0.5,  -0.5,  0.5,
         0.5,  -0.5, -0.5,
         0.5,  -0.5,  0.5,

        -0.5,  -0.5, -0.5,
        -0.5,  -0.5,  0.5,
        -0.5,   0.5, -0.5,
        -0.5,  -0.5,  0.5,
        -0.5,   0.5,  0.5,
        -0.5,   0.5, -0.5,

         0.5,  -0.5, -0.5,
         0.5,   0.5, -0.5,
         0.5,  -0.5,  0.5,
         0.5,  -0.5,  0.5,
         0.5,   0.5, -0.5,
         0.5,   0.5,  0.5,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);


    // location, obj size, data type, normalize, stride, offset
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
    return vao;
}

function main() {
    if (gl == null) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }

    let program = buildProgram();
    let vao = getObjVAO(program);

    function degToRad(d) {
        return d * Math.PI / 180;
    }

    const fieldOfViewRadians = degToRad(60);
    let modelXRotationRadians = degToRad(0);
    let modelYRotationRadians = degToRad(0);

    let matrixLocation = gl.getUniformLocation(program, "u_matrix");

    reload_btn.addEventListener("click", () => {
        program = buildProgram();
        vao = getObjVAO(program);
        matrixLocation = gl.getUniformLocation(program, "u_matrix");
    });

    let start = 0;
    requestAnimationFrame(drawScene);

    function drawScene(time) {
        time *= 0.001;
        const deltaTime = time - start;
        start = time;

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        modelYRotationRadians += -0.7 * deltaTime;
        modelXRotationRadians += -0.4 * deltaTime;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(program);
        gl.bindVertexArray(vao);

        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

        const cameraPosition = [0, 0, 2];
        const up = [0, 1, 0];
        const target = [0, 0, 0];

        const cameraMatrix = m4.lookAt(cameraPosition, target, up);
        const viewMatrix = m4.inverse(cameraMatrix);
        const viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

        let matrix = m4.xRotate(viewProjectionMatrix, modelXRotationRadians);
        matrix = m4.yRotate(matrix, modelYRotationRadians);

        gl.uniformMatrix4fv(matrixLocation, false, matrix);
        gl.drawArrays(gl.TRIANGLES, 0, 6 * 6);

        requestAnimationFrame(drawScene);
    }

    initCanvas();
}

main();
