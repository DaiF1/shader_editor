import { gl } from "./gl";

const textureList = {};
let textureCount = 0;

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}

export function addTexture(textureNode) {
    const index = textureCount++;
    const fileDOM = textureNode.querySelector('input[type="file"]');
    fileDOM.dataset.textureid = index;

    textureList[index] = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textureList[index]);

    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([255, 0, 255, 255]);
    gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        internalFormat,
        width,
        height,
        border,
        srcFormat,
        srcType,
        pixel,
    );

    fileDOM.addEventListener("change", (event) => {
        const file = event.target.files[0];

        if (file == null)
            return;

        const texture = textureList[index];
        const image = new Image();

        image.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(
                gl.TEXTURE_2D,
                level,
                internalFormat,
                srcFormat,
                srcType,
                image,
            );

            if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
                gl.generateMipmap(gl.TEXTURE_2D);
            } else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            }
        };

        const reader = new FileReader();
        reader.onload = (event) => {
            image.src = event.target.result;
        };
        reader.readAsDataURL(file);

        textureList[index] = texture;
    });
}

export function bindTextureUniforms(program) {
    for (let index in textureList) {
        if (textureList[index] == null)
            continue;

        gl.activeTexture(gl.TEXTURE0 + parseInt(index));
        gl.bindTexture(gl.TEXTURE_2D, textureList[index]);

        const location = gl.getUniformLocation(program, `u_tex${index}`);
        gl.uniform1i(location, index);
    }
}

export function generateTextureHeader() {
    let header = "in vec2 v_UV;\n";

    for (let index in textureList) {
        header += `uniform sampler2D u_tex${index};\n`;
    }

    return header;
}
