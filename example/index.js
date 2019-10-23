"use strict";
const pulumi = require("@pulumi/pulumi");
var random = require("@pulumi/random");

exports.number = new random.RandomId("number", {
  byteLength: 10,
}).hex;
