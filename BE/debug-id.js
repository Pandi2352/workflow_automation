
const mongoose = require('mongoose');
const { Types } = mongoose;

const id = '69392cde9949a4b5b230d289';
const isValid = Types.ObjectId.isValid(id);
console.log(`ID: ${id}`);
console.log(`isValid: ${isValid}`);

const invalidId = 'undefined';
console.log(`'undefined' isValid: ${Types.ObjectId.isValid(invalidId)}`);

const newId = 'new';
console.log(`'new' isValid: ${Types.ObjectId.isValid(newId)}`);
