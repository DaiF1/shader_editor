// Each node is represented by a list of attributes with a name and value type
// The input and outputs of different nodes can be linked to each other.
export const nodeSpecs = {
    Output: {
        inputs: [
            {
                name: "Out Color",
                value_type: "color",
                default_value: "#ff007f",
            },
        ],
    },
    // Texture: {
    //     inputs: [
    //         {
    //             name: "File",
    //             value_type: "file",
    //             default_value: null,
    //         },
    //     ],
    //     outputs: [
    //         {
    //             name: "Color",
    //             value_type: "none",
    //             show_out: false,
    //         },
    //     ]
    // },
    Value: {
        outputs: [
            {
                name: "Value",
                value_type: "number",
                default_value: 0.5,
                show_out: true,
            },
        ]
    },
    ColorRamp: {
        inputs: [
            {
                name: "Range",
                value_type: "colorramp",
                default_value: ["#000000", "#ffffff"]
            },
            {
                name: "Value",
                value_type: "number",
                default_value: 0.5,
            },
        ],
        outputs: [
            {
                name: "Color",
                value_type: "color",
                show_out: false,
            },
        ]
    },
}
