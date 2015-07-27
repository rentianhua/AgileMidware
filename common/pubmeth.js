
Array.prototype.toArrayInt = function () {
    for (var i=0; i<this.length;i++) {
        this[i] = parseInt(this[i]);
    }
    return this;
};