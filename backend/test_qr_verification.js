const fs = require('fs');
const http = require('http');
const QRCode = require('qrcode');
const { PNG } = require('pngjs');
const jsQR = require('jsqr');
const { connectDB } = require('./src/config/db');
const Organization = require('./src/models/Organization');
const Service = require('./src/models/Service');

async function testQrGenerationAndDecoding() {
  console.log('====================================================');
  console.log('🧪 QVeue QR Code Feature Verification Test');
  console.log('====================================================');

  await connectDB();

  // 1. Fetch real organization & service
  const org = await Organization.findOne({ name: /CityCare/i });
  if (!org) throw new Error('CityCare organization not found in DB');
  const orgId = org._id || org.id;

  const service = await Service.findOne({ organizationId: orgId, name: /Consultation/i });
  if (!service) throw new Error('General Consultation service not found in DB');
  const serviceId = service._id || service.id;

  console.log(`✓ 1. Fetched real DB entities:`);
  console.log(`     - Organization: "${org.name}" (ID: ${orgId})`);
  console.log(`     - Service:      "${service.name}" (ID: ${serviceId}, Prefix: ${service.prefix})`);

  // 2. Construct intended target URL with network IP
  const networkIp = '192.168.0.104';
  const port = 3000;
  const intendedUrl = `http://${networkIp}:${port}/join/${orgId}/${serviceId}`;
  console.log(`✓ 2. Intended QR Target URL:`);
  console.log(`     ${intendedUrl}`);

  // 3. Generate QR code as PNG buffer
  const pngBuffer = await QRCode.toBuffer(intendedUrl, {
    width: 1024,
    margin: 3,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#070d1e',
      light: '#ffffff'
    }
  });
  console.log(`✓ 3. Real QR Code generated using 'qrcode' library (PNG size: ${pngBuffer.length} bytes).`);

  // 4. Decode the generated QR code buffer using pngjs and jsQR
  const png = PNG.sync.read(pngBuffer);
  const code = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);

  if (!code) {
    throw new Error('❌ FAILED: jsQR could not decode the generated QR code image!');
  }

  console.log(`✓ 4. QR Code successfully decoded from raw image pixels:`);
  console.log(`     Decoded Value: "${code.data}"`);

  // 5. Verification Assertion
  if (code.data !== intendedUrl) {
    throw new Error(`❌ MISMATCH: Decoded URL "${code.data}" does not match intended "${intendedUrl}"`);
  }
  console.log(`✅ VERIFIED: Decoded URL strictly matches the intended service join URL!`);

  // 6. Test entrance pass URL as well
  const entranceUrl = `http://${networkIp}:${port}/join/${orgId}`;
  const entrancePngBuffer = await QRCode.toBuffer(entranceUrl, { width: 512, margin: 2 });
  const entrancePng = PNG.sync.read(entrancePngBuffer);
  const entranceCode = jsQR(new Uint8ClampedArray(entrancePng.data), entrancePng.width, entrancePng.height);
  if (entranceCode.data !== entranceUrl) {
    throw new Error(`❌ MISMATCH on entrance pass URL!`);
  }
  console.log(`✅ VERIFIED: Entrance pass QR code decodes to "${entranceCode.data}"`);

  // 7. Verify API Preview endpoint returns valid data for the decoded URL params
  const previewPath = `/api/queues/preview/${orgId}/${serviceId}`;
  const previewData = await new Promise((resolve, reject) => {
    http.get(`http://localhost:5000${previewPath}`, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });

  if (!previewData.success || !previewData.data) {
    throw new Error(`❌ API preview returned error: ${JSON.stringify(previewData)}`);
  }

  console.log(`✓ 5. Verified API preview response for decoded target:`);
  console.log(`     - Queue ID:        ${previewData.data.queueId}`);
  console.log(`     - Current Token:   ${previewData.data.currentToken}`);
  console.log(`     - Waiting Count:   ${previewData.data.waitingCount}`);
  console.log(`     - Estimated Wait:  ${previewData.data.estimatedWaitMinutes} minutes`);

  console.log('====================================================');
  console.log('🎉 ALL QR GENERATION & DECODING TESTS PASSED!');
  console.log('====================================================');
  process.exit(0);
}

testQrGenerationAndDecoding().catch((err) => {
  console.error(err);
  process.exit(1);
});
