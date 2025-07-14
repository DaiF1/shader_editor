// Each node is represented by a list of attributes with a name and value type
// The input and outputs of different nodes can be linked to each other.
export const nodeSpecs = {
    Output: {
        inputs: [
            {
                name: "Out Color",
                value_type: "color",
                default_value: "#ff007f",
            }
        ],
    },
    Texture: {
        inputs: [
            {
                name: "File",
                value_type: "file",
                default_value: null,
            }
        ],
        outputs: [
            "Color",
        ]
    },
}
