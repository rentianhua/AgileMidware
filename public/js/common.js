
String.uuid =  function () {
    return (function(g) {
        return (g() + g() + "-" + g() + "-" + g() + "-" + g() + "-" + g() + g() + g()).toUpperCase();
    })(function() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    });
};