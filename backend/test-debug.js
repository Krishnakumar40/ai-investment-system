const pkg = require('yahoo-finance2');
console.log("Root export type:", typeof pkg);
console.log("Root export keys:", Object.keys(pkg));
if (pkg.default) {
    console.log("pkg.default type:", typeof pkg.default);
    console.log("pkg.default keys:", Object.keys(pkg.default));
    console.log("Is default a class?", pkg.default.toString().startsWith("class"));
}
