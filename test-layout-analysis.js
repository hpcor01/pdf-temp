// Simple test script for layout-analysis.ts
// Run with: node test-layout-analysis.js

const { layoutAnalyzer } = require('./src/lib/layout-analysis.ts');

async function testLayoutAnalyzer() {
  console.log('Testing LayoutAnalyzer...');

  try {
    // Test initialization
    console.log('Initializing...');
    await layoutAnalyzer.initialize();
    console.log('Initialization successful');

    // Test detectTextRegions with a dummy image
    console.log('Testing detectTextRegions...');
    const dummyImage = {
      width: 100,
      height: 100,
      src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    };
    const regions = await layoutAnalyzer.detectTextRegions(dummyImage);
    console.log('detectTextRegions result:', regions);

    // Test createPreservationMask
    console.log('Testing createPreservationMask...');
    const canvas = document.createElement('canvas');
    const mask = await layoutAnalyzer.createPreservationMask(dummyImage, regions, canvas);
    console.log('createPreservationMask successful');

    console.log('All tests passed!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testLayoutAnalyzer();
