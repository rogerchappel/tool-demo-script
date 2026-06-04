#!/usr/bin/env node
const args = process.argv.slice(2);
if (args[0] === '--version' || args[0] === '-V') {
  console.log('0.1.0');
} else if (args[0] === 'greet') {
  const name = args[1] || 'World';
  console.log(`Hello, ${name}!`);
} else {
  console.log('Usage: fixture-cli [--version|greet <name>]');
}
