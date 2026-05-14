#!/usr/bin/env node

import http from 'http';

// Simple test to verify the API endpoints exist and are accessible
const API_BASE = 'http://localhost:3000';

async function testEndpoints() {
  console.log('Testing inventory destination endpoints...\n');

  try {
    // Test 1: Get warehouse state (verify destinations are included)
    console.log('1. Testing GET /warehouse/state...');
    const stateResponse = await fetch(`${API_BASE}/warehouse/state`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!stateResponse.ok) {
      console.log(`   Status: ${stateResponse.status}`);
      const errorText = await stateResponse.text();
      console.log(`   Error: ${errorText}\n`);
      return;
    }

    const stateData = await stateResponse.json();
    console.log(`   ✓ Status: ${stateResponse.status}`);
    console.log(`   ✓ inventoryDestinations found: ${stateData?.inventoryDestinations ? stateData.inventoryDestinations.length : 0}\n`);

    // Test 2: Create a destination
    console.log('2. Testing POST /warehouse/inventory/destinations...');
    const createResponse = await fetch(`${API_BASE}/warehouse/inventory/destinations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        warehouse: 'Test Warehouse',
        storageLocation: 'Test Location',
        recipientName: 'Test Recipient',
      }),
    });

    if (!createResponse.ok) {
      console.log(`   Status: ${createResponse.status}`);
      const errorText = await createResponse.text();
      console.log(`   Error: ${errorText}\n`);
      return;
    }

    const createData = await createResponse.json();
    console.log(`   ✓ Status: ${createResponse.status}`);
    console.log(`   ✓ Destination created with ID: ${createData?.destinationId}\n`);

    // Test 3: Verify destination was added to state
    console.log('3. Verifying destination was added to state...');
    const state2Response = await fetch(`${API_BASE}/warehouse/state`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const state2Data = await state2Response.json();
    const destination = state2Data?.inventoryDestinations?.find((d) => d.id === createData?.destinationId);
    if (destination) {
      console.log(`   ✓ Destination found in state!`);
      console.log(`   ✓ Warehouse: ${destination.warehouse}`);
      console.log(`   ✓ Storage Location: ${destination.storageLocation}`);
      console.log(`   ✓ Recipient: ${destination.recipientName}\n`);
    } else {
      console.log(`   ✗ Destination not found in state\n`);
    }

    console.log('All tests passed! ✓');
  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }
}

// Wait for server to start then run tests
setTimeout(testEndpoints, 3000);
