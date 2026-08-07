const args = process.argv.slice(2);

if (args.includes('--version')) {
  console.log('2.3.4');
} else {
  console.log('start-only-cli');
}
