const { model } = require('./src/models/model.js');
const fs = require('fs')

function main() {
    const contentfile = JSON.stringify({
        ...model,
        enums: Object.keys(model.enums).reduce(
            (acc, enumKey) => {
                acc[enumKey] = [...model.enums[enumKey]];
                return acc;
            },
            {}
        )
    });
    fs.writeFile(
        '/data/model.json',
        contentfile,
        error => console.log(error ? error : 'Done exporting model to /data/model.json.')
    );
}

main();